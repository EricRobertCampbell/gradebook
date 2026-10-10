CREATE TABLE `excuses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`category_id` integer,
	`subcategory_id` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "excuses_one_target" CHECK((
        ("excuses"."category_id" IS NOT NULL AND "excuses"."subcategory_id" IS NULL)
        OR ("excuses"."category_id" IS NULL AND "excuses"."subcategory_id" IS NOT NULL)
      ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `excuses_student_category_unique` ON `excuses` (`student_id`,`category_id`) WHERE "excuses"."category_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `excuses_student_subcategory_unique` ON `excuses` (`student_id`,`subcategory_id`) WHERE "excuses"."subcategory_id" IS NOT NULL;