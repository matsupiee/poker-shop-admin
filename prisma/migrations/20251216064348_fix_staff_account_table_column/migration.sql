-- AlterTable
ALTER TABLE "staff_accounts" ALTER COLUMN "access_token" DROP NOT NULL,
ALTER COLUMN "refresh_token" DROP NOT NULL,
ALTER COLUMN "access_token_expires_at" DROP NOT NULL,
ALTER COLUMN "refresh_token_expires_at" DROP NOT NULL;
