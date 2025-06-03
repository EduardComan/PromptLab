/*
  Warnings:

  - The primary key for the `accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `images` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `file_path` on the `images` table. All the data in the column will be lost.
  - The primary key for the `merge_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `source_version_id` on the `merge_requests` table. All the data in the column will be lost.
  - You are about to drop the column `target_version_id` on the `merge_requests` table. All the data in the column will be lost.
  - The primary key for the `org_memberships` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `organizations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `prompt_runs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `prompt_versions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `prompts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `metadata_json` on the `prompts` table. All the data in the column will be lost.
  - The primary key for the `repo_collaborators` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `repositories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `stars` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[profile_image_id]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[logo_image_id]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content_snapshot` to the `merge_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prompt_id` to the `merge_requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_profile_image_id_fkey";

-- DropForeignKey
ALTER TABLE "merge_requests" DROP CONSTRAINT "merge_requests_created_by_fkey";

-- DropForeignKey
ALTER TABLE "merge_requests" DROP CONSTRAINT "merge_requests_source_version_id_fkey";

-- DropForeignKey
ALTER TABLE "merge_requests" DROP CONSTRAINT "merge_requests_target_version_id_fkey";

-- DropForeignKey
ALTER TABLE "org_memberships" DROP CONSTRAINT "org_memberships_org_id_fkey";

-- DropForeignKey
ALTER TABLE "org_memberships" DROP CONSTRAINT "org_memberships_user_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_logo_image_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "prompt_runs" DROP CONSTRAINT "prompt_runs_prompt_id_fkey";

-- DropForeignKey
ALTER TABLE "prompt_runs" DROP CONSTRAINT "prompt_runs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "prompt_runs" DROP CONSTRAINT "prompt_runs_version_id_fkey";

-- DropForeignKey
ALTER TABLE "prompt_versions" DROP CONSTRAINT "prompt_versions_author_id_fkey";

-- DropForeignKey
ALTER TABLE "prompt_versions" DROP CONSTRAINT "prompt_versions_prompt_id_fkey";

-- DropForeignKey
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_repository_id_fkey";

-- DropForeignKey
ALTER TABLE "repo_collaborators" DROP CONSTRAINT "repo_collaborators_repo_id_fkey";

-- DropForeignKey
ALTER TABLE "repo_collaborators" DROP CONSTRAINT "repo_collaborators_user_id_fkey";

-- DropForeignKey
ALTER TABLE "repositories" DROP CONSTRAINT "repositories_owner_org_id_fkey";

-- DropForeignKey
ALTER TABLE "repositories" DROP CONSTRAINT "repositories_owner_user_id_fkey";

-- DropForeignKey
ALTER TABLE "stars" DROP CONSTRAINT "stars_repo_id_fkey";

-- DropForeignKey
ALTER TABLE "stars" DROP CONSTRAINT "stars_user_id_fkey";

-- AlterTable
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "profile_image_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "images" DROP CONSTRAINT "images_pkey",
DROP COLUMN "file_path",
ADD COLUMN     "data" BYTEA,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "uploaded_by" SET DATA TYPE TEXT,
ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "merge_requests" DROP CONSTRAINT "merge_requests_pkey",
DROP COLUMN "source_version_id",
DROP COLUMN "target_version_id",
ADD COLUMN     "content_snapshot" TEXT NOT NULL,
ADD COLUMN     "merged_at" TIMESTAMP(3),
ADD COLUMN     "metadata_json" JSONB,
ADD COLUMN     "prompt_id" TEXT NOT NULL,
ADD COLUMN     "resulting_version_id" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ADD CONSTRAINT "merge_requests_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "org_memberships" DROP CONSTRAINT "org_memberships_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "org_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "org_memberships_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "logo_image_id" SET DATA TYPE TEXT,
ALTER COLUMN "owner_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "prompt_runs" DROP CONSTRAINT "prompt_runs_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "prompt_id" SET DATA TYPE TEXT,
ALTER COLUMN "version_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "prompt_runs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "prompt_versions" DROP CONSTRAINT "prompt_versions_pkey",
ADD COLUMN     "metadata_json" JSONB,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "prompt_id" SET DATA TYPE TEXT,
ALTER COLUMN "author_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_pkey",
DROP COLUMN "metadata_json",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "repository_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "repo_collaborators" DROP CONSTRAINT "repo_collaborators_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "repo_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "repo_collaborators_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "repositories" DROP CONSTRAINT "repositories_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "owner_user_id" SET DATA TYPE TEXT,
ALTER COLUMN "owner_org_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "repositories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "stars" DROP CONSTRAINT "stars_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "repo_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "stars_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_profile_image_id_key" ON "accounts"("profile_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_logo_image_id_key" ON "organizations"("logo_image_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_profile_image_id_fkey" FOREIGN KEY ("profile_image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_logo_image_id_fkey" FOREIGN KEY ("logo_image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_owner_org_id_fkey" FOREIGN KEY ("owner_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "prompt_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_runs" ADD CONSTRAINT "prompt_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repo_collaborators" ADD CONSTRAINT "repo_collaborators_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "repositories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repo_collaborators" ADD CONSTRAINT "repo_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stars" ADD CONSTRAINT "stars_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "repositories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stars" ADD CONSTRAINT "stars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
