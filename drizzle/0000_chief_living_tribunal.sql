CREATE TABLE `charges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subscription_id` text NOT NULL,
	`charged_on` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text DEFAULT 'JPY' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "charges_amount_nonnegative" CHECK("charges"."amount_minor" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_charges_user_subscription_date` ON `charges` (`user_id`,`subscription_id`,`charged_on`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
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
	CONSTRAINT "subscriptions_price_nonnegative" CHECK("subscriptions"."price_minor" >= 0),
	CONSTRAINT "subscriptions_importance_range" CHECK("subscriptions"."importance" BETWEEN 1 AND 5),
	CONSTRAINT "subscriptions_satisfaction_range" CHECK("subscriptions"."satisfaction" IS NULL OR "subscriptions"."satisfaction" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE INDEX `idx_subscriptions_user_status` ON `subscriptions` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_subscriptions_user_next_billing` ON `subscriptions` (`user_id`,`next_billing_date`);--> statement-breakpoint
CREATE TABLE `usage_checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subscription_id` text NOT NULL,
	`used_on` text NOT NULL,
	`level` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_checkins_user_subscription_day` ON `usage_checkins` (`user_id`,`subscription_id`,`used_on`);--> statement-breakpoint
CREATE INDEX `idx_checkins_user_date` ON `usage_checkins` (`user_id`,`used_on`);--> statement-breakpoint
CREATE TABLE `user_states` (
	`user_id` text PRIMARY KEY NOT NULL,
	`demo_seeded_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
