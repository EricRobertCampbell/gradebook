CREATE TABLE IF NOT EXISTS `goal_marks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`class_id` integer,
	`category_id` integer,
	`subcategory_id` integer,
	`work_id` integer,
	`goal_mark` real NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "goal_marks_one_target" CHECK((
        ("goal_marks"."class_id" IS NOT NULL AND "goal_marks"."category_id" IS NULL AND "goal_marks"."subcategory_id" IS NULL AND "goal_marks"."work_id" IS NULL)
        OR ("goal_marks"."class_id" IS NULL AND "goal_marks"."category_id" IS NOT NULL AND "goal_marks"."subcategory_id" IS NULL AND "goal_marks"."work_id" IS NULL)
        OR ("goal_marks"."class_id" IS NULL AND "goal_marks"."category_id" IS NULL AND "goal_marks"."subcategory_id" IS NOT NULL AND "goal_marks"."work_id" IS NULL)
        OR ("goal_marks"."class_id" IS NULL AND "goal_marks"."category_id" IS NULL AND "goal_marks"."subcategory_id" IS NULL AND "goal_marks"."work_id" IS NOT NULL)
      ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `goal_marks_student_class_unique` ON `goal_marks` (`student_id`,`class_id`) WHERE "goal_marks"."class_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `goal_marks_student_category_unique` ON `goal_marks` (`student_id`,`category_id`) WHERE "goal_marks"."category_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `goal_marks_student_subcategory_unique` ON `goal_marks` (`student_id`,`subcategory_id`) WHERE "goal_marks"."subcategory_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `goal_marks_student_work_unique` ON `goal_marks` (`student_id`,`work_id`) WHERE "goal_marks"."work_id" IS NOT NULL;
