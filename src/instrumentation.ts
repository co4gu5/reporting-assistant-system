/** Returns "HH:MM" in the given IANA timezone, reliably on all Node.js versions. */
function getCurrentHHMM(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23", // always 0–23, never "24:xx" or "AM/PM"
  }).formatToParts(date);

  const hour   = parts.find((p) => p.type === "hour")?.value   ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

/** Returns "YYYY-MM-DD" in the given IANA timezone. */
function getLocalDateStr(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
  // en-CA locale produces "YYYY-MM-DD" reliably
}

/**
 * Returns the UTC Date objects for [start-of-day, start-of-next-day]
 * in the given IANA timezone, avoiding the `new Date("YYYY-MM-DD")` UTC-parse trap.
 */
function getDayBoundsUTC(date: Date, timezone: string): [Date, Date] {
  const dateStr = getLocalDateStr(date, timezone); // "YYYY-MM-DD"

  // Build a "YYYY-MM-DDTHH:MM:SS" string for midnight in the target timezone,
  // then find the real UTC equivalent by using the Intl offset trick.
  const [year, month, day] = dateStr.split("-").map(Number);

  // Probe: create a UTC date that approximates midnight local, then
  // measure the real offset at that moment and correct it.
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // noon UTC as safe probe
  const localMidnightStr = `${dateStr}T00:00:00`;

  // Format probe as local time to discover timezone offset
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });

  // Iterate once to nail the exact UTC instant for local midnight
  // (handles DST correctly by using the actual offset at midnight)
  const localNoonStr = formatter.format(probe);          // "YYYY-MM-DD HH:MM:SS"
  const localNoon    = new Date(localNoonStr.replace(" ", "T") + "Z"); // treat as UTC to compute delta
  const probeMid     = new Date(localMidnightStr + "Z");               // naive midnight as if UTC
  const offsetMs     = probe.getTime() - localNoon.getTime();          // real UTC-local delta in ms
  const startUTC     = new Date(probeMid.getTime() + offsetMs);        // true UTC midnight
  const endUTC       = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);

  return [startUTC, endUTC];
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: cron } = await import("node-cron");
    const { prisma }        = await import("@/lib/prisma");
    const { sendReportReminderEmail } = await import("@/lib/email");

    cron.schedule("* * * * *", async () => {
      try {
        const now = new Date();

        const settings = await prisma.notificationSetting.findMany({
          where: { enabled: true },
          include: { user: true },
        });

        for (const setting of settings) {
          // ── 1. Does the current local time match the alarm? ─────────────────
          const currentHHMM = getCurrentHHMM(now, setting.timezone);
          console.log(
            `[Notification] ${setting.user.email} → local=${currentHHMM} alarm=${setting.alarmTime} tz=${setting.timezone}`
          );

          if (currentHHMM !== setting.alarmTime) continue;

          // ── 2. Already notified today? ──────────────────────────────────────
          if (setting.lastNotifiedAt) {
            const lastDateStr  = getLocalDateStr(setting.lastNotifiedAt, setting.timezone);
            const todayDateStr = getLocalDateStr(now, setting.timezone);
            if (lastDateStr === todayDateStr) {
              console.log(`[Notification] Already sent today for ${setting.user.email}, skipping.`);
              continue;
            }
          }

          // ── 3. Already submitted a report today (in user's timezone)? ───────
          const [dayStart, dayEnd] = getDayBoundsUTC(now, setting.timezone);
          const existingReport = await prisma.report.findFirst({
            where: {
              userId: setting.userId,
              createdAt: { gte: dayStart, lt: dayEnd },
            },
          });

          if (existingReport) {
            console.log(`[Notification] Report already submitted today for ${setting.user.email}, skipping.`);
            continue;
          }

          // ── 4. Send email ────────────────────────────────────────────────────
          const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
          const toEmail = setting.notificationEmail ?? setting.user.email;
          await sendReportReminderEmail({
            toEmail,
            toName: setting.user.name,
            appUrl,
          });

          await prisma.notificationSetting.update({
            where: { id: setting.id },
            data:  { lastNotifiedAt: now },
          });

          console.log(`[Notification] Email sent to ${setting.user.email}`);
        }
      } catch (err) {
        console.error("[Notification] Cron error:", err);
      }
    });

    console.log("[Notification] Daily reminder cron scheduler started.");
  }
}
