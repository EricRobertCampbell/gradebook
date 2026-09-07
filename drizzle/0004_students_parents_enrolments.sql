CREATE TABLE `class_students` (
	`class_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	PRIMARY KEY(`class_id`, `student_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`preferred_name` text NOT NULL,
	`notes` text NOT NULL,
	`email_address_1` text NOT NULL,
	`email_address_2` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `student_parents` (
	`student_id` integer NOT NULL,
	`parent_id` integer NOT NULL,
	PRIMARY KEY(`student_id`, `parent_id`),
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`preferred_name` text NOT NULL,
	`notes` text NOT NULL,
	`email` text NOT NULL
);
