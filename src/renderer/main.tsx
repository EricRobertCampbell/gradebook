import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { App } from "./App";
import { ClassDataPage } from "./ClassDataPage";
import { ClassPage } from "./ClassPage";
import { WorkDataPage } from "./WorkDataPage";
import { ClassSettingsPage } from "./ClassSettingsPage";
import { HomePage } from "./HomePage";
import { SchoolYearPage } from "./SchoolYearPage";
import { SchoolYearSettingsPage } from "./SchoolYearSettingsPage";
import { DatabasePage } from "./DatabasePage";
import { SettingsPage } from "./SettingsPage";
import { StudentClassDataPage } from "./StudentClassDataPage";
import { StudentClassReportPage } from "./StudentClassReportPage";
import { StudentPage } from "./StudentPage";
import { StudentSettingsPage } from "./StudentSettingsPage";
import "./styles.css";

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "database", element: <DatabasePage /> },
      { path: "students/:studentId/settings", element: <StudentSettingsPage /> },
      { path: "students/:studentId", element: <StudentPage /> },
      { path: ":schoolYearId/settings", element: <SchoolYearSettingsPage /> },
      { path: ":classId/data/:workId", element: <WorkDataPage /> },
      { path: ":classId/data", element: <ClassDataPage /> },
      { path: ":schoolYearId", element: <SchoolYearPage /> },
      { path: ":studentId/:classId/data", element: <StudentClassDataPage /> },
      { path: ":studentId/:classId/individualreport", element: <StudentClassReportPage /> },
      { path: ":schoolYearId/:classId", element: <ClassPage /> },
      { path: ":schoolYearId/:classId/settings", element: <ClassSettingsPage /> },
    ],
  },
]);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The renderer root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
