CREATE TABLE `gmail_import_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`google_message_id` text NOT NULL,
	`name` text NOT NULL,
	`merchant` text NOT NULL,
	`price_minor` integer NOT NULL,
	`currency` text DEFAULT 'JPY' NOT NULL,
	`billing_cycle` text NOT NULL,
	`first_charged_on` text NOT NULL,
	`last_charged_on` text NOT NULL,
	`evidence_count` integer DEFAULT 1 NOT NULL,
	`confidence` integer NOT NULL,
	`imported_at` text,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "gmail_candidates_price_positive" CHECK("gmail_import_candidates"."price_minor" > 0),
	CONSTRAINT "gmail_candidates_currency_jpy" CHECK("gmail_import_candidates"."currency" = 'JPY'),
	CONSTRAINT "gmail_candidates_cycle_values" CHECK("gmail_import_candidates"."billing_cycle" IN ('weekly', 'monthly', 'yearly')),
	CONSTRAINT "gmail_candidates_evidence_positive" CHECK("gmail_import_candidates"."evidence_count" > 0),
	CONSTRAINT "gmail_candidates_confidence_range" CHECK("gmail_import_candidates"."confidence" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_gmail_candidates_user_fingerprint` ON `gmail_import_candidates` (`user_id`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_gmail_candidates_user_imported` ON `gmail_import_candidates` (`user_id`,`imported_at`,`expires_at`);--> statement-breakpoint
CREATE TABLE `google_connections` (
	`user_id` text PRIMARY KEY NOT NULL,
	`google_email` text NOT NULL,
	`access_token_encrypted` text NOT NULL,
	`refresh_token_encrypted` text,
	`access_token_expires_at` text NOT NULL,
	`scope` text NOT NULL,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
