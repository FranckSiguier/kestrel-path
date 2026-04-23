DROP INDEX `transcripts_blobPathname_idx`;--> statement-breakpoint
ALTER TABLE `transcripts` DROP COLUMN `blob_pathname`;--> statement-breakpoint
ALTER TABLE `transcripts` DROP COLUMN `blob_url`;--> statement-breakpoint
ALTER TABLE `transcripts` DROP COLUMN `content_type`;--> statement-breakpoint
ALTER TABLE `transcripts` DROP COLUMN `size_bytes`;