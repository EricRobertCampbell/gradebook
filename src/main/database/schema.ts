import { sql } from "drizzle-orm";
import {
  check,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const appMetadata = sqliteTable("app_metadata", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const schoolYears = sqliteTable("school_years", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const classes = sqliteTable(
  "classes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    displayName: text("display_name").notNull(),
    internalName: text("internal_name").notNull(),
    subject: text("subject").notNull(),
    section: text("section").notNull(),
    notes: text("notes").notNull(),
    schoolYearId: integer("school_year_id")
      .notNull()
      .references(() => schoolYears.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("classes_school_year_internal_name_unique").on(table.schoolYearId, table.internalName),
  ],
);

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  preferredName: text("preferred_name").notNull(),
  notes: text("notes").notNull(),
  email: text("email").notNull(),
});

export const parents = sqliteTable("parents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  preferredName: text("preferred_name").notNull(),
  notes: text("notes").notNull(),
  emailAddress1: text("email_address_1").notNull(),
  emailAddress2: text("email_address_2").notNull(),
});

export const studentParents = sqliteTable(
  "student_parents",
  {
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    parentId: integer("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.studentId, table.parentId] })],
);

export const classStudents = sqliteTable(
  "class_students",
  {
    classId: integer("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.classId, table.studentId] })],
);

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  notes: text("notes").notNull(),
  weight: real("weight").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const subcategories = sqliteTable("subcategories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  weight: real("weight").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const works = sqliteTable(
  "works",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "cascade" }),
    subcategoryId: integer("subcategory_id").references(() => subcategories.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    notes: text("notes").notNull(),
    date: text("date"),
    maximumScore: real("maximum_score").notNull(),
    weight: real("weight").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    check(
      "works_one_parent",
      sql`(
        (${table.categoryId} IS NULL AND ${table.subcategoryId} IS NOT NULL)
        OR (${table.categoryId} IS NOT NULL AND ${table.subcategoryId} IS NULL)
      )`,
    ),
  ],
);

export const assessments = sqliteTable(
  "assessments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workId: integer("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    date: text("date").notNull(),
    weight: real("weight").notNull(),
    notes: text("notes").notNull(),
    status: text("status").notNull(),
  },
  (table) => [unique("assessments_work_student_unique").on(table.workId, table.studentId)],
);

export const goalMarks = sqliteTable(
  "goal_marks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "cascade" }),
    subcategoryId: integer("subcategory_id").references(() => subcategories.id, {
      onDelete: "cascade",
    }),
    workId: integer("work_id").references(() => works.id, { onDelete: "cascade" }),
    goalMark: real("goal_mark").notNull(),
  },
  (table) => [
    check(
      "goal_marks_one_target",
      sql`(
        (${table.classId} IS NOT NULL AND ${table.categoryId} IS NULL AND ${table.subcategoryId} IS NULL AND ${table.workId} IS NULL)
        OR (${table.classId} IS NULL AND ${table.categoryId} IS NOT NULL AND ${table.subcategoryId} IS NULL AND ${table.workId} IS NULL)
        OR (${table.classId} IS NULL AND ${table.categoryId} IS NULL AND ${table.subcategoryId} IS NOT NULL AND ${table.workId} IS NULL)
        OR (${table.classId} IS NULL AND ${table.categoryId} IS NULL AND ${table.subcategoryId} IS NULL AND ${table.workId} IS NOT NULL)
      )`,
    ),
    uniqueIndex("goal_marks_student_class_unique")
      .on(table.studentId, table.classId)
      .where(sql`${table.classId} IS NOT NULL`),
    uniqueIndex("goal_marks_student_category_unique")
      .on(table.studentId, table.categoryId)
      .where(sql`${table.categoryId} IS NOT NULL`),
    uniqueIndex("goal_marks_student_subcategory_unique")
      .on(table.studentId, table.subcategoryId)
      .where(sql`${table.subcategoryId} IS NOT NULL`),
    uniqueIndex("goal_marks_student_work_unique")
      .on(table.studentId, table.workId)
      .where(sql`${table.workId} IS NOT NULL`),
  ],
);

export const adjustments = sqliteTable("adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assessmentId: integer("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  percentChange: real("percent_change"),
  rawChange: real("raw_change"),
  description: text("description").notNull(),
  notes: text("notes").notNull(),
});
