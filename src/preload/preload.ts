import { contextBridge, ipcRenderer } from "electron";
import { ipcChannels, type IpcChannel, type IpcInput, type IpcOutput } from "../shared/ipc";
import type { GradebookApi } from "../shared/preload-api";

function invoke<C extends IpcChannel>(
  channel: C,
  ...args: IpcInput<C> extends undefined ? [] : [IpcInput<C>]
): Promise<IpcOutput<C>> {
  return ipcRenderer.invoke(channel, ...args);
}

const gradebookApi: GradebookApi = {
  database: {
    getStatus: () => invoke(ipcChannels.databaseGetStatus),
    export: () => invoke(ipcChannels.databaseExport),
    import: () => invoke(ipcChannels.databaseImport),
  },
  schoolYears: {
    list: () => invoke(ipcChannels.schoolYearList),
    get: (input) => invoke(ipcChannels.schoolYearGet, input),
    create: (input) => invoke(ipcChannels.schoolYearCreate, input),
    delete: (input) => invoke(ipcChannels.schoolYearDelete, input),
  },
  classes: {
    list: (input) => invoke(ipcChannels.classList, input),
    listSubjects: () => invoke(ipcChannels.classListSubjects),
    get: (input) => invoke(ipcChannels.classGet, input),
    getById: (input) => invoke(ipcChannels.classGetById, input),
    create: (input) => invoke(ipcChannels.classCreate, input),
    update: (input) => invoke(ipcChannels.classUpdate, input),
    delete: (input) => invoke(ipcChannels.classDelete, input),
    listStudents: (input) => invoke(ipcChannels.classStudentList, input),
    addStudent: (input) => invoke(ipcChannels.classStudentAdd, input),
    removeStudent: (input) => invoke(ipcChannels.classStudentRemove, input),
  },
  grading: {
    getStructure: (input) => invoke(ipcChannels.gradingGetStructure, input),
    getGradebook: (input) => invoke(ipcChannels.gradingGetGradebook, input),
  },
  categories: {
    create: (input) => invoke(ipcChannels.categoryCreate, input),
    update: (input) => invoke(ipcChannels.categoryUpdate, input),
    delete: (input) => invoke(ipcChannels.categoryDelete, input),
    copy: (input) => invoke(ipcChannels.categoryCopy, input),
  },
  subcategories: {
    create: (input) => invoke(ipcChannels.subcategoryCreate, input),
    update: (input) => invoke(ipcChannels.subcategoryUpdate, input),
    delete: (input) => invoke(ipcChannels.subcategoryDelete, input),
    copy: (input) => invoke(ipcChannels.subcategoryCopy, input),
  },
  works: {
    create: (input) => invoke(ipcChannels.workCreate, input),
    update: (input) => invoke(ipcChannels.workUpdate, input),
    delete: (input) => invoke(ipcChannels.workDelete, input),
    copy: (input) => invoke(ipcChannels.workCopy, input),
  },
  assessments: {
    upsert: (input) => invoke(ipcChannels.assessmentUpsert, input),
    delete: (input) => invoke(ipcChannels.assessmentDelete, input),
  },
  adjustments: {
    create: (input) => invoke(ipcChannels.adjustmentCreate, input),
    update: (input) => invoke(ipcChannels.adjustmentUpdate, input),
    delete: (input) => invoke(ipcChannels.adjustmentDelete, input),
  },
  students: {
    list: () => invoke(ipcChannels.studentList),
    get: (input) => invoke(ipcChannels.studentGet, input),
    create: (input) => invoke(ipcChannels.studentCreate, input),
    update: (input) => invoke(ipcChannels.studentUpdate, input),
    delete: (input) => invoke(ipcChannels.studentDelete, input),
    listClasses: (input) => invoke(ipcChannels.studentClassList, input),
  },
  parents: {
    listForStudent: (input) => invoke(ipcChannels.parentListForStudent, input),
    createForStudent: (input) => invoke(ipcChannels.parentCreateForStudent, input),
    update: (input) => invoke(ipcChannels.parentUpdate, input),
    delete: (input) => invoke(ipcChannels.parentDelete, input),
  },
};

contextBridge.exposeInMainWorld("gradebook", gradebookApi);
