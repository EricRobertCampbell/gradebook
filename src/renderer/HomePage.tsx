import { useState } from "react";
import "./HomePage.css";
import { SchoolYearsPanel } from "./SchoolYearsPanel";
import { StudentsPanel } from "./StudentsPanel";

type HomeTab = "school-years" | "students";

export function HomePage() {
  const [tab, setTab] = useState<HomeTab>("school-years");

  return (
    <>
      <p className="eyebrow">{tab === "school-years" ? "School years" : "Students"}</p>
      <h1>Local Gradebook</h1>

      <div className="home-tabs" role="tablist" aria-label="Gradebook sections">
        <button
          type="button"
          role="tab"
          id="school-years-tab"
          className="home-tab"
          aria-selected={tab === "school-years"}
          onClick={() => setTab("school-years")}
        >
          School years
        </button>
        <button
          type="button"
          role="tab"
          id="students-tab"
          className="home-tab"
          aria-selected={tab === "students"}
          onClick={() => setTab("students")}
        >
          Students
        </button>
      </div>

      <div role="tabpanel" aria-labelledby={tab === "school-years" ? "school-years-tab" : "students-tab"}>
        {tab === "school-years" ? <SchoolYearsPanel /> : <StudentsPanel />}
      </div>
    </>
  );
}
