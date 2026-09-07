CREATE TABLE `classes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`internal_name` text NOT NULL,
	`school_year_id` integer NOT NULL,
	FOREIGN KEY (`school_year_id`) REFERENCES `school_years`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classes_school_year_internal_name_unique` ON `classes` (`school_year_id`,`internal_name`);