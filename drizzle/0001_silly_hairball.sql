PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_charges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subscription_id` text NOT NULL,
	`charged_on` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text DEFAULT 'JPY' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "charges_amount_nonnegative" CHECK("__new_charges"."amount_minor" >= 0),
	CONSTRAINT "charges_source_values" CHECK("__new_charges"."source" IN ('manual', 'csv', 'email'))
);
--> statement-breakpoint
INSERT INTO `__new_charges`("id", "user_id", "subscription_id", "charged_on", "amount_minor", "currency", "source", "created_at") SELECT "id", "user_id", "subscription_id", "charged_on", "amount_minor", "currency", "source", "created_at" FROM `charges`;--> statement-breakpoint
DROP TABLE `charges`;--> statement-breakpoint
ALTER TABLE `__new_charges` RENAME TO `charges`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_charges_user_subscription_date` ON `charges` (`user_id`,`subscription_id`,`charged_on`);--> statement-breakpoint
CREATE TABLE `__new_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`plan` text DEFAULT 'スタンダード' NOT NULL,
	`price_minor` integer NOT NULL,
	`currency` text DEFAULT 'JPY' NOT NULL,
	`billing_cycle` text NOT NULL,
	`start_date` text NOT NULL,
	`next_billing_date` text NOT NULL,
	`category` text DEFAULT 'その他' NOT NULL,
	`importance` integer DEFAULT 3 NOT NULL,
	`satisfaction` integer,
	`usage_level` text DEFAULT 'unknown' NOT NULL,
	`last_used_date` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "subscriptions_price_nonnegative" CHECK("__new_subscriptions"."price_minor" >= 0),
	CONSTRAINT "subscriptions_importance_range" CHECK("__new_subscriptions"."importance" BETWEEN 1 AND 5),
	CONSTRAINT "subscriptions_satisfaction_range" CHECK("__new_subscriptions"."satisfaction" IS NULL OR "__new_subscriptions"."satisfaction" BETWEEN 1 AND 5),
	CONSTRAINT "subscriptions_billing_cycle_values" CHECK("__new_subscriptions"."billing_cycle" IN ('weekly', 'monthly', 'yearly')),
	CONSTRAINT "subscriptions_usage_level_values" CHECK("__new_subscriptions"."usage_level" IN ('often', 'sometimes', 'rarely', 'unknown')),
	CONSTRAINT "subscriptions_source_values" CHECK("__new_subscriptions"."source" IN ('manual', 'csv', 'email', 'store')),
	CONSTRAINT "subscriptions_status_values" CHECK("__new_subscriptions"."status" IN ('active', 'paused', 'cancelled'))
);
--> statement-breakpoint
INSERT INTO `__new_subscriptions`("id", "user_id", "name", "plan", "price_minor", "currency", "billing_cycle", "start_date", "next_billing_date", "category", "importance", "satisfaction", "usage_level", "last_used_date", "source", "status", "notes", "created_at", "updated_at") SELECT "id", "user_id", "name", "plan", "price_minor", "currency", "billing_cycle", "start_date", "next_billing_date", "category", "importance", "satisfaction", "usage_level", "last_used_date", "source", "status", "notes", "created_at", "updated_at" FROM `subscriptions`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_subscriptions` RENAME TO `subscriptions`;--> statement-breakpoint
CREATE INDEX `idx_subscriptions_user_status` ON `subscriptions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_user_next_billing` ON `subscriptions` (`user_id`,`next_billing_date`);--> statement-breakpoint
CREATE TABLE `__new_usage_checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subscription_id` text NOT NULL,
	`used_on` text NOT NULL,
	`level` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "usage_checkins_level_values" CHECK("__new_usage_checkins"."level" IN ('often', 'sometimes', 'rarely'))
);
--> statement-breakpoint
INSERT INTO `__new_usage_checkins`("id", "user_id", "subscription_id", "used_on", "level", "created_at") SELECT "id", "user_id", "subscription_id", "used_on", "level", "created_at" FROM `usage_checkins`;--> statement-breakpoint
DROP TABLE `usage_checkins`;--> statement-breakpoint
ALTER TABLE `__new_usage_checkins` RENAME TO `usage_checkins`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_checkins_user_subscription_day` ON `usage_checkins` (`user_id`,`subscription_id`,`used_on`);--> statement-breakpoint
CREATE INDEX `idx_checkins_user_date` ON `usage_checkins` (`user_id`,`used_on`);