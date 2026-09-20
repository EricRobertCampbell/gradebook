import type {
  Class,
  ClassCreateInput,
  ClassDeleteResult,
  ClassLookupInput,
  ClassSchoolYearInput,
  Adjustment,
  AdjustmentCreateInput,
  AdjustmentUpdateInput,
  Assessment,
  AssessmentLookupInput,
  AssessmentUpsertInput,
  Category,
  CategoryCreateInput,
  CategoryReorderChildrenInput,
  CategoryReorderInput,
  CategoryUpdateInput,
  ClassGradebook,
  ClassGradingStructure,
  ClassStudentInput,
  ClassUpdateInput,
  DatabaseExportResult,
  DatabaseImportResult,
  DatabaseStatus,
  DeleteResult,
  EnrolledClass,
  RecordIdInput,
  ReorderResult,
  Parent,
  ParentCreateInput,
  ParentDeleteInput,
  ParentUpdateInput,
  SchoolYear,
  SchoolYearDeleteResult,
  SchoolYearNameInput,
  Student,
  StudentCreateInput,
  StudentIdInput,
  StudentUpdateInput,
  Subcategory,
  SubcategoryCreateInput,
  SubcategoryReorderWorksInput,
  SubcategoryUpdateInput,
  Work,
  WorkCreateInput,
  WorkUpdateInput,
} from "./ipc";

export type GradebookApi = {
  database: {
    getStatus: () => Promise<DatabaseStatus>;
    export: () => Promise<DatabaseExportResult>;
    import: () => Promise<DatabaseImportResult>;
  };
  schoolYears: {
    list: () => Promise<Array<SchoolYear>>;
    get: (input: RecordIdInput) => Promise<SchoolYear>;
    create: (input: SchoolYearNameInput) => Promise<SchoolYear>;
    delete: (input: SchoolYearNameInput) => Promise<SchoolYearDeleteResult>;
  };
  classes: {
    list: (input: ClassSchoolYearInput) => Promise<Array<Class>>;
    listSubjects: () => Promise<Array<string>>;
    get: (input: ClassLookupInput) => Promise<Class>;
    getById: (input: RecordIdInput) => Promise<Class>;
    create: (input: ClassCreateInput) => Promise<Class>;
    update: (input: ClassUpdateInput) => Promise<Class>;
    delete: (input: ClassLookupInput) => Promise<ClassDeleteResult>;
    listStudents: (input: ClassLookupInput) => Promise<Array<Student>>;
    addStudent: (input: ClassStudentInput) => Promise<Student>;
    removeStudent: (input: ClassStudentInput) => Promise<DeleteResult>;
  };
  grading: {
    getStructure: (input: ClassLookupInput) => Promise<ClassGradingStructure>;
    getGradebook: (input: ClassLookupInput) => Promise<ClassGradebook>;
  };
  categories: {
    create: (input: CategoryCreateInput) => Promise<Category>;
    update: (input: CategoryUpdateInput) => Promise<Category>;
    delete: (input: RecordIdInput) => Promise<DeleteResult>;
    copy: (input: RecordIdInput) => Promise<Category>;
    reorder: (input: CategoryReorderInput) => Promise<ReorderResult>;
    reorderChildren: (input: CategoryReorderChildrenInput) => Promise<ReorderResult>;
  };
  subcategories: {
    create: (input: SubcategoryCreateInput) => Promise<Subcategory>;
    update: (input: SubcategoryUpdateInput) => Promise<Subcategory>;
    delete: (input: RecordIdInput) => Promise<DeleteResult>;
    copy: (input: RecordIdInput) => Promise<Subcategory>;
    reorderWorks: (input: SubcategoryReorderWorksInput) => Promise<ReorderResult>;
  };
  works: {
    create: (input: WorkCreateInput) => Promise<Work>;
    update: (input: WorkUpdateInput) => Promise<Work>;
    delete: (input: RecordIdInput) => Promise<DeleteResult>;
    copy: (input: RecordIdInput) => Promise<Work>;
  };
  assessments: {
    upsert: (input: AssessmentUpsertInput) => Promise<Assessment>;
    delete: (input: AssessmentLookupInput) => Promise<DeleteResult>;
  };
  adjustments: {
    create: (input: AdjustmentCreateInput) => Promise<Adjustment>;
    update: (input: AdjustmentUpdateInput) => Promise<Adjustment>;
    delete: (input: RecordIdInput) => Promise<DeleteResult>;
  };
  students: {
    list: () => Promise<Array<Student>>;
    get: (input: StudentIdInput) => Promise<Student>;
    create: (input: StudentCreateInput) => Promise<Student>;
    update: (input: StudentUpdateInput) => Promise<Student>;
    delete: (input: StudentIdInput) => Promise<DeleteResult>;
    listClasses: (input: StudentIdInput) => Promise<Array<EnrolledClass>>;
  };
  parents: {
    listForStudent: (input: StudentIdInput) => Promise<Array<Parent>>;
    createForStudent: (input: ParentCreateInput) => Promise<Parent>;
    update: (input: ParentUpdateInput) => Promise<Parent>;
    delete: (input: ParentDeleteInput) => Promise<DeleteResult>;
  };
};
