import { z } from "zod";

export const RESERVED_SCHOOL_YEAR_NAMES = ["settings", "students", "database"] as const;

export const ipcChannels = {
  databaseGetStatus: "database:getStatus",
  databaseExport: "database:export",
  databaseImport: "database:import",
  schoolYearList: "schoolYear:list",
  schoolYearGet: "schoolYear:get",
  schoolYearCreate: "schoolYear:create",
  schoolYearDelete: "schoolYear:delete",
  classList: "class:list",
  classGet: "class:get",
  classGetById: "class:getById",
  classCreate: "class:create",
  classUpdate: "class:update",
  classDelete: "class:delete",
  studentList: "student:list",
  studentGet: "student:get",
  studentCreate: "student:create",
  studentUpdate: "student:update",
  studentDelete: "student:delete",
  studentClassList: "student:listClasses",
  parentListForStudent: "parent:listForStudent",
  parentCreateForStudent: "parent:createForStudent",
  parentUpdate: "parent:update",
  parentDelete: "parent:delete",
  classStudentList: "class:listStudents",
  classStudentAdd: "class:addStudent",
  classStudentRemove: "class:removeStudent",
  gradingGetStructure: "grading:getStructure",
  gradingGetGradebook: "grading:getGradebook",
  categoryCreate: "category:create",
  categoryUpdate: "category:update",
  categoryDelete: "category:delete",
  categoryCopy: "category:copy",
  subcategoryCreate: "subcategory:create",
  subcategoryUpdate: "subcategory:update",
  subcategoryDelete: "subcategory:delete",
  subcategoryCopy: "subcategory:copy",
  workCreate: "work:create",
  workUpdate: "work:update",
  workDelete: "work:delete",
  workCopy: "work:copy",
  assessmentUpsert: "assessment:upsert",
  assessmentDelete: "assessment:delete",
  adjustmentCreate: "adjustment:create",
  adjustmentUpdate: "adjustment:update",
  adjustmentDelete: "adjustment:delete",
} as const;

export const databaseStatusSchema = z.object({
  connected: z.boolean(),
  message: z.string(),
});

export type DatabaseStatus = z.infer<typeof databaseStatusSchema>;

export const databaseExportResultSchema = z.object({
  exported: z.boolean(),
  cancelled: z.boolean(),
  path: z.string().optional(),
});

export const databaseImportResultSchema = z.object({
  imported: z.boolean(),
  cancelled: z.boolean(),
  path: z.string().optional(),
});

export type DatabaseExportResult = z.infer<typeof databaseExportResultSchema>;
export type DatabaseImportResult = z.infer<typeof databaseImportResultSchema>;

export const schoolYearNameSchema = z
  .string()
  .trim()
  .min(1, "A school year name is required.")
  .refine(
    (name) =>
      !RESERVED_SCHOOL_YEAR_NAMES.some((reserved) => reserved.toLowerCase() === name.toLowerCase()),
    "That name is reserved.",
  )
  .refine((name) => !name.includes("/") && !name.includes("#"), {
    message: "A school year name cannot contain / or #.",
  });

export const schoolYearNameInputSchema = z.object({
  name: schoolYearNameSchema,
});

export const schoolYearSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
});

export const schoolYearListSchema = z.array(schoolYearSchema);

export const schoolYearDeleteResultSchema = z.object({
  deleted: z.boolean(),
});

export type SchoolYear = z.infer<typeof schoolYearSchema>;
export type SchoolYearNameInput = z.infer<typeof schoolYearNameInputSchema>;
export type SchoolYearDeleteResult = z.infer<typeof schoolYearDeleteResultSchema>;

export const classDisplayNameSchema = z.string().trim().min(1, "A class display name is required.");

export const classInternalNameSchema = z
  .string()
  .trim()
  .min(1, "An internal class name is required.")
  .refine((name) => !name.includes("/") && !name.includes("#"), {
    message: "An internal class name cannot contain / or #.",
  });

export const classSubjectSchema = z.string().trim();

export const classSectionSchema = z.string().trim();

export const classNotesSchema = z.string().trim();

export const classDescriptionSchema = z.string().trim().min(1, "A description is required.");

export const classFieldsSchema = z.object({
  displayName: classDisplayNameSchema,
  internalName: classInternalNameSchema,
  subject: classSubjectSchema,
  section: classSectionSchema,
  notes: classDescriptionSchema,
});

export const classSchema = z.object({
  id: z.number().int(),
  schoolYearId: z.number().int(),
  displayName: classDisplayNameSchema,
  internalName: classInternalNameSchema,
  subject: classSubjectSchema,
  section: classSectionSchema,
  notes: classNotesSchema,
});

export const classListSchema = z.array(classSchema);

export const classSchoolYearInputSchema = z.object({
  schoolYearName: schoolYearNameSchema,
});

export const classCreateInputSchema = classFieldsSchema.extend({
  schoolYearName: schoolYearNameSchema,
});

export const classUpdateInputSchema = classFieldsSchema.extend({
  schoolYearName: schoolYearNameSchema,
  currentInternalName: classInternalNameSchema,
});

export const classLookupInputSchema = z.object({
  schoolYearName: schoolYearNameSchema,
  internalName: classInternalNameSchema,
});

export const classDeleteResultSchema = z.object({
  deleted: z.boolean(),
});

export type Class = z.infer<typeof classSchema>;
export type ClassSchoolYearInput = z.infer<typeof classSchoolYearInputSchema>;
export type ClassFields = z.infer<typeof classFieldsSchema>;
export type ClassCreateInput = z.infer<typeof classCreateInputSchema>;
export type ClassUpdateInput = z.infer<typeof classUpdateInputSchema>;
export type ClassLookupInput = z.infer<typeof classLookupInputSchema>;
export type ClassDeleteResult = z.infer<typeof classDeleteResultSchema>;

export const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    message: "Enter a valid email address.",
  });

export const studentFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "A first name is required."),
  lastName: z.string().trim().min(1, "A last name is required."),
  preferredName: z.string().trim(),
  notes: z.string().trim(),
  email: optionalEmailSchema,
});

export const studentSchema = studentFieldsSchema.extend({
  id: z.number().int(),
  goalMark: z.number().nullable(),
});

export const studentListSchema = z.array(studentSchema);

export const studentIdInputSchema = z.object({
  id: z.number().int().positive(),
});

export const studentCreateInputSchema = studentFieldsSchema;

export const studentUpdateInputSchema = studentFieldsSchema.extend({
  id: z.number().int().positive(),
});

export const parentFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "A first name is required."),
  lastName: z.string().trim().min(1, "A last name is required."),
  preferredName: z.string().trim(),
  notes: z.string().trim(),
  emailAddress1: optionalEmailSchema,
  emailAddress2: optionalEmailSchema,
});

export const parentSchema = parentFieldsSchema.extend({
  id: z.number().int(),
});

export const parentListSchema = z.array(parentSchema);

export const parentCreateInputSchema = parentFieldsSchema.extend({
  studentId: z.number().int().positive(),
});

export const parentUpdateInputSchema = parentFieldsSchema.extend({
  id: z.number().int().positive(),
});

export const parentDeleteInputSchema = z.object({
  id: z.number().int().positive(),
  studentId: z.number().int().positive(),
});

export const enrolledClassSchema = classSchema.extend({
  schoolYearName: z.string().min(1),
});

export const enrolledClassListSchema = z.array(enrolledClassSchema);

export const classStudentInputSchema = classLookupInputSchema.extend({
  studentId: z.number().int().positive(),
});

export const deleteResultSchema = z.object({
  deleted: z.boolean(),
});

export type Student = z.infer<typeof studentSchema>;
export type StudentFields = z.infer<typeof studentFieldsSchema>;
export type StudentIdInput = z.infer<typeof studentIdInputSchema>;
export type StudentCreateInput = z.infer<typeof studentCreateInputSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateInputSchema>;
export type Parent = z.infer<typeof parentSchema>;
export type ParentFields = z.infer<typeof parentFieldsSchema>;
export type ParentCreateInput = z.infer<typeof parentCreateInputSchema>;
export type ParentUpdateInput = z.infer<typeof parentUpdateInputSchema>;
export type ParentDeleteInput = z.infer<typeof parentDeleteInputSchema>;
export type EnrolledClass = z.infer<typeof enrolledClassSchema>;
export type ClassStudentInput = z.infer<typeof classStudentInputSchema>;
export type DeleteResult = z.infer<typeof deleteResultSchema>;

export const recordIdInputSchema = z.object({
  id: z.number().int().positive(),
});

export const requiredNameSchema = z.string().trim().min(1, "A name is required.");

export const weightSchema = z
  .number({ error: "A weight is required." })
  .finite({ error: "A weight must be a number." })
  .min(0, "A weight cannot be negative.");

export const maximumScoreSchema = z
  .number({ error: "A maximum score is required." })
  .finite({ error: "A maximum score must be a number." })
  .positive("A maximum score must be greater than 0.");

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date as YYYY-MM-DD.");

export const assessmentStatusSchema = z.enum(["counted", "exempt", "nhi"]);

export const categoryFieldsSchema = z.object({
  name: requiredNameSchema,
  notes: z.string().trim(),
  weight: weightSchema,
});

export const categorySchema = z.object({
  id: z.number().int(),
  classId: z.number().int(),
  name: z.string(),
  notes: z.string(),
  weight: z.number(),
});

export const categoryCreateInputSchema = categoryFieldsSchema.extend({
  schoolYearName: schoolYearNameSchema,
  internalName: classInternalNameSchema,
});

export const categoryUpdateInputSchema = categoryFieldsSchema.extend({
  id: z.number().int().positive(),
});

export const subcategoryFieldsSchema = z.object({
  name: requiredNameSchema,
  weight: weightSchema,
});

export const subcategorySchema = z.object({
  id: z.number().int(),
  categoryId: z.number().int(),
  name: z.string(),
  weight: z.number(),
});

export const subcategoryCreateInputSchema = subcategoryFieldsSchema.extend({
  categoryId: z.number().int().positive(),
});

export const subcategoryUpdateInputSchema = subcategoryFieldsSchema.extend({
  id: z.number().int().positive(),
});

export const workFieldsSchema = z.object({
  name: requiredNameSchema,
  notes: z.string().trim(),
  maximumScore: maximumScoreSchema,
  weight: weightSchema,
});

export const workSchema = z
  .object({
    id: z.number().int(),
    categoryId: z.number().int().nullable(),
    subcategoryId: z.number().int().nullable(),
    name: z.string(),
    notes: z.string(),
    maximumScore: z.number(),
    weight: z.number(),
  })
  .refine((value) => (value.categoryId != null) !== (value.subcategoryId != null), {
    message: "Work must belong to a category or a sub-category, but not both.",
  });

export const workCreateInputSchema = workFieldsSchema
  .extend({
    categoryId: z.number().int().positive().optional(),
    subcategoryId: z.number().int().positive().optional(),
  })
  .refine((value) => (value.categoryId != null) !== (value.subcategoryId != null), {
    message: "Work must belong to a category or a sub-category, but not both.",
  });

export const workUpdateInputSchema = workFieldsSchema.extend({
  id: z.number().int().positive(),
});

export const assessmentSchema = z.object({
  id: z.number().int(),
  workId: z.number().int(),
  studentId: z.number().int(),
  score: z.number(),
  date: z.string(),
  weight: z.number(),
  notes: z.string(),
  status: assessmentStatusSchema,
});

export const assessmentUpsertInputSchema = z.object({
  workId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  score: z.number().finite(),
  date: isoDateSchema.optional(),
  weight: weightSchema.optional(),
  notes: z.string().optional(),
  status: assessmentStatusSchema.optional(),
});

export const assessmentLookupInputSchema = z.object({
  workId: z.number().int().positive(),
  studentId: z.number().int().positive(),
});

export const adjustmentFieldsSchema = z.object({
  percentChange: z.number().finite().nullable(),
  rawChange: z.number().finite().nullable(),
  description: z.string().trim().min(1, "A description is required."),
  notes: z.string().trim(),
});

export const adjustmentSchema = z.object({
  id: z.number().int(),
  assessmentId: z.number().int(),
  percentChange: z.number().nullable(),
  rawChange: z.number().nullable(),
  description: z.string(),
  notes: z.string(),
});

export const adjustmentCreateInputSchema = adjustmentFieldsSchema
  .extend({
    assessmentId: z.number().int().positive(),
  })
  .refine((value) => value.percentChange !== null || value.rawChange !== null, {
    message: "Enter a percent change, a raw change, or both.",
  });

export const adjustmentUpdateInputSchema = adjustmentFieldsSchema
  .extend({
    id: z.number().int().positive(),
  })
  .refine((value) => value.percentChange !== null || value.rawChange !== null, {
    message: "Enter a percent change, a raw change, or both.",
  });

export const gradeWorkSchema = workSchema;

export const gradeSubcategorySchema = subcategorySchema.extend({
  works: z.array(gradeWorkSchema),
});

export const gradeCategorySchema = categorySchema.extend({
  subcategories: z.array(gradeSubcategorySchema),
  works: z.array(gradeWorkSchema),
});

export const classGradingStructureSchema = z.object({
  categories: z.array(gradeCategorySchema),
});

export const studentWorkGradeSchema = z.object({
  workId: z.number().int(),
  assessment: assessmentSchema.nullable(),
  adjustments: z.array(adjustmentSchema),
  percent: z.number().nullable(),
});

export const studentSubcategoryGradeSchema = z.object({
  subcategoryId: z.number().int(),
  percent: z.number().nullable(),
  works: z.array(studentWorkGradeSchema),
});

export const studentCategoryGradeSchema = z.object({
  categoryId: z.number().int(),
  percent: z.number().nullable(),
  subcategories: z.array(studentSubcategoryGradeSchema),
  works: z.array(studentWorkGradeSchema),
});

export const studentGradeRowSchema = z.object({
  student: studentSchema,
  coursePercent: z.number().nullable(),
  categories: z.array(studentCategoryGradeSchema),
});

export const classGradebookSchema = z.object({
  categories: z.array(gradeCategorySchema),
  students: z.array(studentGradeRowSchema),
});

export type RecordIdInput = z.infer<typeof recordIdInputSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CategoryFields = z.infer<typeof categoryFieldsSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateInputSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateInputSchema>;
export type Subcategory = z.infer<typeof subcategorySchema>;
export type SubcategoryFields = z.infer<typeof subcategoryFieldsSchema>;
export type SubcategoryCreateInput = z.infer<typeof subcategoryCreateInputSchema>;
export type SubcategoryUpdateInput = z.infer<typeof subcategoryUpdateInputSchema>;
export type Work = z.infer<typeof workSchema>;
export type WorkFields = z.infer<typeof workFieldsSchema>;
export type WorkCreateInput = z.infer<typeof workCreateInputSchema>;
export type WorkUpdateInput = z.infer<typeof workUpdateInputSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentStatus = z.infer<typeof assessmentStatusSchema>;
export type AssessmentUpsertInput = z.infer<typeof assessmentUpsertInputSchema>;
export type AssessmentLookupInput = z.infer<typeof assessmentLookupInputSchema>;
export type Adjustment = z.infer<typeof adjustmentSchema>;
export type AdjustmentFields = z.infer<typeof adjustmentFieldsSchema>;
export type AdjustmentCreateInput = z.infer<typeof adjustmentCreateInputSchema>;
export type AdjustmentUpdateInput = z.infer<typeof adjustmentUpdateInputSchema>;
export type GradeCategory = z.infer<typeof gradeCategorySchema>;
export type GradeSubcategory = z.infer<typeof gradeSubcategorySchema>;
export type GradeWork = z.infer<typeof gradeWorkSchema>;
export type ClassGradingStructure = z.infer<typeof classGradingStructureSchema>;
export type StudentWorkGrade = z.infer<typeof studentWorkGradeSchema>;
export type StudentSubcategoryGrade = z.infer<typeof studentSubcategoryGradeSchema>;
export type StudentCategoryGrade = z.infer<typeof studentCategoryGradeSchema>;
export type StudentGradeRow = z.infer<typeof studentGradeRowSchema>;
export type ClassGradebook = z.infer<typeof classGradebookSchema>;

export const ipcContracts = {
  [ipcChannels.databaseGetStatus]: {
    input: z.undefined(),
    output: databaseStatusSchema,
  },
  [ipcChannels.databaseExport]: {
    input: z.undefined(),
    output: databaseExportResultSchema,
  },
  [ipcChannels.databaseImport]: {
    input: z.undefined(),
    output: databaseImportResultSchema,
  },
  [ipcChannels.schoolYearList]: {
    input: z.undefined(),
    output: schoolYearListSchema,
  },
  [ipcChannels.schoolYearGet]: {
    input: recordIdInputSchema,
    output: schoolYearSchema,
  },
  [ipcChannels.schoolYearCreate]: {
    input: schoolYearNameInputSchema,
    output: schoolYearSchema,
  },
  [ipcChannels.schoolYearDelete]: {
    input: schoolYearNameInputSchema,
    output: schoolYearDeleteResultSchema,
  },
  [ipcChannels.classList]: {
    input: classSchoolYearInputSchema,
    output: classListSchema,
  },
  [ipcChannels.classGet]: {
    input: classLookupInputSchema,
    output: classSchema,
  },
  [ipcChannels.classGetById]: {
    input: recordIdInputSchema,
    output: classSchema,
  },
  [ipcChannels.classCreate]: {
    input: classCreateInputSchema,
    output: classSchema,
  },
  [ipcChannels.classUpdate]: {
    input: classUpdateInputSchema,
    output: classSchema,
  },
  [ipcChannels.classDelete]: {
    input: classLookupInputSchema,
    output: classDeleteResultSchema,
  },
  [ipcChannels.studentList]: {
    input: z.undefined(),
    output: studentListSchema,
  },
  [ipcChannels.studentGet]: {
    input: studentIdInputSchema,
    output: studentSchema,
  },
  [ipcChannels.studentCreate]: {
    input: studentCreateInputSchema,
    output: studentSchema,
  },
  [ipcChannels.studentUpdate]: {
    input: studentUpdateInputSchema,
    output: studentSchema,
  },
  [ipcChannels.studentDelete]: {
    input: studentIdInputSchema,
    output: deleteResultSchema,
  },
  [ipcChannels.studentClassList]: {
    input: studentIdInputSchema,
    output: enrolledClassListSchema,
  },
  [ipcChannels.parentListForStudent]: {
    input: studentIdInputSchema,
    output: parentListSchema,
  },
  [ipcChannels.parentCreateForStudent]: {
    input: parentCreateInputSchema,
    output: parentSchema,
  },
  [ipcChannels.parentUpdate]: {
    input: parentUpdateInputSchema,
    output: parentSchema,
  },
  [ipcChannels.parentDelete]: {
    input: parentDeleteInputSchema,
    output: deleteResultSchema,
  },
  [ipcChannels.classStudentList]: {
    input: classLookupInputSchema,
    output: studentListSchema,
  },
  [ipcChannels.classStudentAdd]: {
    input: classStudentInputSchema,
    output: studentSchema,
  },
  [ipcChannels.classStudentRemove]: {
    input: classStudentInputSchema,
    output: deleteResultSchema,
  },
  [ipcChannels.gradingGetStructure]: {
    input: classLookupInputSchema,
    output: classGradingStructureSchema,
  },
  [ipcChannels.gradingGetGradebook]: {
    input: classLookupInputSchema,
    output: classGradebookSchema,
  },
  [ipcChannels.categoryCreate]: {
    input: categoryCreateInputSchema,
    output: categorySchema,
  },
  [ipcChannels.categoryUpdate]: {
    input: categoryUpdateInputSchema,
    output: categorySchema,
  },
  [ipcChannels.categoryDelete]: {
    input: recordIdInputSchema,
    output: deleteResultSchema,
  },
  [ipcChannels.categoryCopy]: {
    input: recordIdInputSchema,
    output: categorySchema,
  },
  [ipcChannels.subcategoryCreate]: {
    input: subcategoryCreateInputSchema,
    output: subcategorySchema,
  },
  [ipcChannels.subcategoryUpdate]: {
    input: subcategoryUpdateInputSchema,
    output: subcategorySchema,
  },
  [ipcChannels.subcategoryDelete]: {
    input: recordIdInputSchema,
    output: deleteResultSchema,
  },
  [ipcChannels.subcategoryCopy]: {
    input: recordIdInputSchema,
    output: subcategorySchema,
  },
  [ipcChannels.workCreate]: {
    input: workCreateInputSchema,
    output: workSchema,
  },
  [ipcChannels.workUpdate]: {
    input: workUpdateInputSchema,
    output: workSchema,
  },
  [ipcChannels.workDelete]: {
    input: recordIdInputSchema,
    output: deleteResultSchema,
  },
  [ipcChannels.workCopy]: {
    input: recordIdInputSchema,
    output: workSchema,
  },
  [ipcChannels.assessmentUpsert]: {
    input: assessmentUpsertInputSchema,
    output: assessmentSchema,
  },
  [ipcChannels.assessmentDelete]: {
    input: assessmentLookupInputSchema,
    output: deleteResultSchema,
  },
  [ipcChannels.adjustmentCreate]: {
    input: adjustmentCreateInputSchema,
    output: adjustmentSchema,
  },
  [ipcChannels.adjustmentUpdate]: {
    input: adjustmentUpdateInputSchema,
    output: adjustmentSchema,
  },
  [ipcChannels.adjustmentDelete]: {
    input: recordIdInputSchema,
    output: deleteResultSchema,
  },
} as const;

export type IpcContracts = typeof ipcContracts;
export type IpcChannel = keyof IpcContracts;
export type IpcInput<C extends IpcChannel> = z.infer<IpcContracts[C]["input"]>;
export type IpcOutput<C extends IpcChannel> = z.infer<IpcContracts[C]["output"]>;
