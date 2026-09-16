PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_works` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer,
	`subcategory_id` integer,
	`name` text NOT NULL,
	`notes` text NOT NULL,
	`maximum_score` real NOT NULL,
	`weight` real NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "works_one_parent" CHECK((
        ("__new_works"."category_id" IS NULL AND "__new_works"."subcategory_id" IS NOT NULL)
        OR ("__new_works"."category_id" IS NOT NULL AND "__new_works"."subcategory_id" IS NULL)
      ))
);
--> statement-breakpoint
INSERT INTO `__new_works`("id", "category_id", "subcategory_id", "name", "notes", "maximum_score", "weight") SELECT "id", NULL, "subcategory_id", "name", "notes", "maximum_score", "weight" FROM `works`;--> statement-breakpoint
DROP TABLE `works`;--> statement-breakpoint
ALTER TABLE `__new_works` RENAME TO `works`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
