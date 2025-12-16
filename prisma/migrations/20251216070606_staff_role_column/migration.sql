-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'STAFF');

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "role" "StaffRole" NOT NULL DEFAULT 'STAFF';
