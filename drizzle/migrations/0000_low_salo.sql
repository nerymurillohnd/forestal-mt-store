CREATE TABLE `product_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`handler` text NOT NULL,
	`product_group_id` text NOT NULL,
	`name` text NOT NULL,
	`catalog` text NOT NULL,
	`botanical_name` text,
	`availability` text DEFAULT 'InStock',
	`quality_badge` text,
	`tags` text,
	`common_names` text,
	`short_description` text,
	`content_json` text,
	`media_json` text,
	`seo_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_groups_handler_unique` ON `product_groups` (`handler`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_groups_product_group_id_unique` ON `product_groups` (`product_group_id`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_group_id` integer NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`size` text NOT NULL,
	`weight_kg` real,
	`packaging` text,
	`tare_weight_g` real,
	`net_weight_g` real,
	`gross_weight_g` real,
	`price` real NOT NULL,
	`currency` text DEFAULT 'USD',
	`stock_qty` integer DEFAULT 0,
	`availability` text DEFAULT 'InStock',
	`min_order_qty` integer DEFAULT 1,
	`max_order_qty` integer DEFAULT 50,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`product_group_id`) REFERENCES `product_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE TABLE `return_policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_key` text NOT NULL,
	`name` text NOT NULL,
	`return_days` integer NOT NULL,
	`return_method` text NOT NULL,
	`return_fees` text NOT NULL,
	`applicable_country` text NOT NULL,
	`merchant_return_link` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `return_policies_policy_key_unique` ON `return_policies` (`policy_key`);--> statement-breakpoint
CREATE TABLE `shipping_zones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zone_key` text NOT NULL,
	`label` text NOT NULL,
	`country_codes` text NOT NULL,
	`handling_min` integer DEFAULT 1 NOT NULL,
	`handling_max` integer DEFAULT 2 NOT NULL,
	`transit_min` integer NOT NULL,
	`transit_max` integer NOT NULL,
	`time_unit` text DEFAULT 'd' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipping_zones_zone_key_unique` ON `shipping_zones` (`zone_key`);