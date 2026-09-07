CREATE TABLE `school_years` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `school_years_name_unique` ON `school_years` (`name`);