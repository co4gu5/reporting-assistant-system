import {
  getCurrentHHMM,
  getDayBoundsUTC,
  getLocalDateStr,
  normalizeTimezone,
} from "@/lib/timezone";

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
          const timezone = normalizeTimezone(setting.timezone, "UTC");

          // ── 1. Does the current local time match the alarm? ─────────────────
          const currentHHMM = getCurrentHHMM(now, timezone);
          console.log(
            `[Notification] ${setting.user.email} → local=${currentHHMM} alarm=${setting.alarmTime} tz=${timezone}`
          );

          if (currentHHMM !== setting.alarmTime) continue;

          // ── 2. Already notified today? ──────────────────────────────────────
          if (setting.lastNotifiedAt) {
            const lastDateStr  = getLocalDateStr(setting.lastNotifiedAt, timezone);
            const todayDateStr = getLocalDateStr(now, timezone);
            if (lastDateStr === todayDateStr) {
              console.log(`[Notification] Already sent today for ${setting.user.email}, skipping.`);
              continue;
            }
          }

          // ── 3. Already submitted a report today (in user's timezone)? ───────
          const [dayStart, dayEnd] = getDayBoundsUTC(now, timezone);
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
