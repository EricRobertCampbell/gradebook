CREATE TABLE `adjustments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assessment_id` integer NOT NULL,
	`percent_change` real,
	`raw_change` real,
	`description` text NOT NULL,
	`notes` text NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`score` real NOT NULL,
	`date` text NOT NULL,
	`weight` real NOT NULL,
	`notes` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_work_student_unique` ON `assessments` (`work_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`class_id` integer NOT NULL,
	`name` text NOT NULL,
	`notes` text NOT NULL,
	`weight` real NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subcategories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`maximum_score` real NOT NULL,
	`weight` real NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `works` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subcategory_id` integer NOT NULL,
	`name` text NOT NULL,
	`notes` text NOT NULL,
	`maximum_score` real NOT NULL,
	`weight` real NOT NULL,
	FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON UPDATE no action ON DELETE cascade
);
