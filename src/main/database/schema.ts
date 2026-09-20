import { sql } from "drizzle-orm";
import {
  check,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
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
});

export const subcategories = sqliteTable("subcategories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  weight: real("weight").notNull(),
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
