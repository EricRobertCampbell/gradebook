import type Database from "better-sqlite3";

const structureTables = ["categories", "subcategories", "works"] as const;

type StructureTable = (typeof structureTables)[number];

export function ensureStructureSortOrder(sqlite: Database.Database): void {
  const missing = structureTables.filter((table) => !hasColumn(sqlite, table, "sort_order"));

  if (missing.length === 0) {
    return;
  }

  const repair = sqlite.transaction(() => {
    for (const table of missing) {
      sqlite.exec(`ALTER TABLE \`${table}\` ADD \`sort_order\` integer DEFAULT 0 NOT NULL`);
    }

    if (missing.includes("categories")) {
      sqlite.exec(categorySortOrderBackfill);
    }

    if (missing.includes("subcategories")) {
      sqlite.exec(subcategorySortOrderBackfill);
    }

    if (missing.includes("works")) {
      sqlite.exec(workSortOrderBackfill);
    }
  });

  repair();
}

const categorySortOrderBackfill = `
UPDATE \`categories\` SET \`sort_order\` = (
	SELECT COUNT(*) FROM \`categories\` AS \`other\`
	WHERE \`other\`.\`class_id\` = \`categories\`.\`class_id\`
		AND (
			\`other\`.\`name\` < \`categories\`.\`name\`
			OR (\`other\`.\`name\` = \`categories\`.\`name\` AND \`other\`.\`id\` <= \`categories\`.\`id\`)
		)
) - 1
`;

const subcategorySortOrderBackfill = `
UPDATE \`subcategories\` SET \`sort_order\` = (
	SELECT COUNT(*) FROM \`subcategories\` AS \`other\`
	WHERE \`other\`.\`category_id\` = \`subcategories\`.\`category_id\`
		AND (
			\`other\`.\`name\` < \`subcategories\`.\`name\`
			OR (\`other\`.\`name\` = \`subcategories\`.\`name\` AND \`other\`.\`id\` <= \`subcategories\`.\`id\`)
		)
) - 1
`;

const workSortOrderBackfill = `
UPDATE \`works\` SET \`sort_order\` = (
	SELECT COUNT(*) FROM \`works\` AS \`other\`
	WHERE \`other\`.\`subcategory_id\` IS NOT NULL
		AND \`other\`.\`subcategory_id\` = \`works\`.\`subcategory_id\`
		AND (
			\`other\`.\`name\` < \`works\`.\`name\`
			OR (\`other\`.\`name\` = \`works\`.\`name\` AND \`other\`.\`id\` <= \`works\`.\`id\`)
		)
) - 1
WHERE \`subcategory_id\` IS NOT NULL;
UPDATE \`works\` SET \`sort_order\` = (
	SELECT COUNT(*) FROM \`subcategories\`
	WHERE \`subcategories\`.\`category_id\` = \`works\`.\`category_id\`
) + (
	SELECT COUNT(*) FROM \`works\` AS \`other\`
	WHERE \`other\`.\`category_id\` IS NOT NULL
		AND \`other\`.\`category_id\` = \`works\`.\`category_id\`
		AND (
			\`other\`.\`name\` < \`works\`.\`name\`
			OR (\`other\`.\`name\` = \`works\`.\`name\` AND \`other\`.\`id\` <= \`works\`.\`id\`)
		)
) - 1
WHERE \`category_id\` IS NOT NULL
`;

function hasColumn(sqlite: Database.Database, table: StructureTable, column: string): boolean {
  const rows: unknown = sqlite.pragma(`table_info(${table})`);

  return Array.isArray(rows) && rows.some((row) => isColumnInfo(row) && row.name === column);
}

function isColumnInfo(value: unknown): value is { name: string } {
  return (
    typeof value === "object" && value !== null && "name" in value && typeof value.name === "string"
  );
}
