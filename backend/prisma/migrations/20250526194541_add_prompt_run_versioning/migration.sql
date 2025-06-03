-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('PLAYGROUND', 'VERSIONED');

-- AlterTable
ALTER TABLE "prompt_runs" ADD COLUMN     "prompt_version_id" TEXT,
ADD COLUMN     "run_type" "RunType" NOT NULL DEFAULT 'PLAYGROUND';

-- AddForeignKey
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_prompt_version_id_fkey" FOREIGN KEY ("prompt_version_id") REFERENCES "prompt_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
