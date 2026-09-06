CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`order_date` text NOT NULL,
	`title` text NOT NULL,
	`supplier_name` text NOT NULL,
	`supplier_id` text DEFAULT '' NOT NULL,
	`supplier_contact` text DEFAULT '' NOT NULL,
	`supplier_phone` text DEFAULT '' NOT NULL,
	`supplier_email` text DEFAULT '' NOT NULL,
	`supplier_address` text DEFAULT '' NOT NULL,
	`delivery_date` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`cost` text DEFAULT '' NOT NULL,
	`vat_included` text DEFAULT 'לא' NOT NULL,
	`price_includes` text DEFAULT '' NOT NULL,
	`payment_terms` text DEFAULT '45 יום' NOT NULL,
	`approver` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'טיוטה' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_orders_updated_at` ON `orders` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_status` ON `orders` (`status`);