ALTER TABLE `categories` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subcategories` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `works` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `categories` SET `sort_order` = (
	SELECT COUNT(*) FROM `categories` AS `other`
	WHERE `other`.`class_id` = `categories`.`class_id`
		AND (
			`other`.`name` < `categories`.`name`
			OR (`other`.`name` = `categories`.`name` AND `other`.`id` <= `categories`.`id`)
		)
) - 1;--> statement-breakpoint
UPDATE `subcategories` SET `sort_order` = (
	SELECT COUNT(*) FROM `subcategories` AS `other`
	WHERE `other`.`category_id` = `subcategories`.`category_id`
		AND (
			`other`.`name` < `subcategories`.`name`
			OR (`other`.`name` = `subcategories`.`name` AND `other`.`id` <= `subcategories`.`id`)
		)
) - 1;--> statement-breakpoint
UPDATE `works` SET `sort_order` = (
	SELECT COUNT(*) FROM `works` AS `other`
	WHERE `other`.`subcategory_id` IS NOT NULL
		AND `other`.`subcategory_id` = `works`.`subcategory_id`
		AND (
			`other`.`name` < `works`.`name`
			OR (`other`.`name` = `works`.`name` AND `other`.`id` <= `works`.`id`)
		)
) - 1
WHERE `subcategory_id` IS NOT NULL;--> statement-breakpoint
UPDATE `works` SET `sort_order` = (
	SELECT COUNT(*) FROM `subcategories`
	WHERE `subcategories`.`category_id` = `works`.`category_id`
) + (
	SELECT COUNT(*) FROM `works` AS `other`
	WHERE `other`.`category_id` IS NOT NULL
		AND `other`.`category_id` = `works`.`category_id`
		AND (
			`other`.`name` < `works`.`name`
			OR (`other`.`name` = `works`.`name` AND `other`.`id` <= `works`.`id`)
		)
) - 1
WHERE `category_id` IS NOT NULL;
