CREATE TABLE `product_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
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
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE TABLE `products` (
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
CREATE UNIQUE INDEX `products_handler_unique` ON `products` (`handler`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_product_group_id_unique` ON `products` (`product_group_id`);