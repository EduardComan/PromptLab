/*
  Warnings:

  - You are about to drop the column `rendered_prompt` on the `prompt_runs` table. All the data in the column will be lost.
  - You are about to drop the column `version_id` on the `prompt_runs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "prompt_runs" DROP CONSTRAINT "prompt_runs_prompt_id_fkey";

-- DropForeignKey
ALTER TABLE "prompt_runs" DROP CONSTRAINT "prompt_runs_version_id_fkey";

-- AlterTable
ALTER TABLE "prompt_runs" DROP COLUMN "rendered_prompt",
DROP COLUMN "version_id",
ADD COLUMN     "prompt_content" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "prompt_id" DROP NOT NULL,
ALTER COLUMN "input_variables" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
