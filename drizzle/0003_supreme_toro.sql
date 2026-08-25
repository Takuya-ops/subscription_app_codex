CREATE TABLE `gmail_import_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`last_charged_on` text NOT NULL,
	`subscription_id` text NOT NULL,
	`imported_at` text NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_gmail_events_user_charge` ON `gmail_import_events` (`user_id`,`fingerprint`,`last_charged_on`);--> statement-breakpoint
CREATE INDEX `idx_gmail_events_user_subscription` ON `gmail_import_events` (`user_id`,`subscription_id`);--> statement-breakpoint
ALTER TABLE `google_connections` ADD `scan_started_at` text;--> statement-breakpoint
ALTER TABLE `google_connections` ADD `gmail_page_token` text;--> statement-breakpoint
PRAGMA defer_foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_gmail_import_candidates` (
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
	FOREIGN KEY (`user_id`) REFERENCES `google_connections`(`user_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "gmail_candidates_price_positive" CHECK("__new_gmail_import_candidates"."price_minor" > 0),
	CONSTRAINT "gmail_candidates_currency_jpy" CHECK("__new_gmail_import_candidates"."currency" = 'JPY'),
	CONSTRAINT "gmail_candidates_cycle_values" CHECK("__new_gmail_import_candidates"."billing_cycle" IN ('weekly', 'monthly', 'yearly')),
	CONSTRAINT "gmail_candidates_evidence_positive" CHECK("__new_gmail_import_candidates"."evidence_count" > 0),
	CONSTRAINT "gmail_candidates_confidence_range" CHECK("__new_gmail_import_candidates"."confidence" BETWEEN 0 AND 100)
);
--> statement-breakpoint
INSERT INTO `__new_gmail_import_candidates`("id", "user_id", "fingerprint", "google_message_id", "name", "merchant", "price_minor", "currency", "billing_cycle", "first_charged_on", "last_charged_on", "evidence_count", "confidence", "imported_at", "expires_at", "created_at", "updated_at") SELECT "id", "user_id", "fingerprint", "google_message_id", "name", "merchant", "price_minor", "currency", "billing_cycle", "first_charged_on", "last_charged_on", "evidence_count", "confidence", "imported_at", "expires_at", "created_at", "updated_at" FROM `gmail_import_candidates`;--> statement-breakpoint
DROP TABLE `gmail_import_candidates`;--> statement-breakpoint
ALTER TABLE `__new_gmail_import_candidates` RENAME TO `gmail_import_candidates`;--> statement-breakpoint
PRAGMA defer_foreign_keys=OFF;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_gmail_candidates_user_fingerprint` ON `gmail_import_candidates` (`user_id`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_gmail_candidates_user_imported` ON `gmail_import_candidates` (`user_id`,`imported_at`,`expires_at`);
