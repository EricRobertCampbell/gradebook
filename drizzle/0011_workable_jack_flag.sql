PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`score` real,
	`date` text NOT NULL,
	`weight` real NOT NULL,
	`notes` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_assessments`("id", "work_id", "student_id", "score", "date", "weight", "notes", "status") SELECT "id", "work_id", "student_id", "score", "date", "weight", "notes", "status" FROM `assessments`;--> statement-breakpoint
DROP TABLE `assessments`;--> statement-breakpoint
ALTER TABLE `__new_assessments` RENAME TO `assessments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_work_student_unique` ON `assessments` (`work_id`,`student_id`);