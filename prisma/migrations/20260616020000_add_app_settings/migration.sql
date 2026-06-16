-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- Seed default app timezone
INSERT INTO "AppSetting" ("id", "timezone", "updatedAt")
VALUES ('default', 'America/New_York', CURRENT_TIMESTAMP);
