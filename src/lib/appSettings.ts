import { prisma } from "@/lib/prisma";
import { DEFAULT_SERVER_TIMEZONE, normalizeTimezone } from "@/lib/timezone";

const APP_SETTING_ID = "default";
const CACHE_TTL_MS = 60_000;

let timezoneCache: { value: string; expiresAt: number } | null = null;

export function invalidateAppTimezoneCache() {
  timezoneCache = null;
}

export async function getAppTimezone(): Promise<string> {
  if (timezoneCache && Date.now() < timezoneCache.expiresAt) {
    return timezoneCache.value;
  }

  const setting = await prisma.appSetting.upsert({
    where: { id: APP_SETTING_ID },
    update: {},
    create: {
      id: APP_SETTING_ID,
      timezone: DEFAULT_SERVER_TIMEZONE,
    },
  });

  const timezone = normalizeTimezone(setting.timezone);
  timezoneCache = { value: timezone, expiresAt: Date.now() + CACHE_TTL_MS };
  return timezone;
}

export async function setAppTimezone(timezone: string): Promise<string> {
  const normalized = normalizeTimezone(timezone);

  await prisma.appSetting.upsert({
    where: { id: APP_SETTING_ID },
    update: { timezone: normalized },
    create: {
      id: APP_SETTING_ID,
      timezone: normalized,
    },
  });

  invalidateAppTimezoneCache();
  return normalized;
}
