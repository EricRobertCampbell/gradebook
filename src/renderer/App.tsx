import { Link, Outlet, useLocation } from "react-router-dom";
import "./App.css";
import { GearIcon } from "./components/common/icons/GearIcon";
import "./components/common/icons/icon-button.css";
import { hasPreloadDatabaseApi } from "./database-status";

export function App() {
  const location = useLocation();
  const isDevelopment = import.meta.env.DEV;
  const usesBrowserFallback = isDevelopment && !hasPreloadDatabaseApi();
  const onDatabase =
    location.pathname === "/database" || location.pathname === "/settings";
  const onClassGrades = isClassGradesPath(location.pathname);

  return (
    <div className="page">
      {isDevelopment ? (
        <div className="dev-banner" role="status">
          {usesBrowserFallback
            ? "DEVELOPMENT MODE — BROWSER FALLBACK"
            : "DEVELOPMENT MODE — TEST DATA"}
        </div>
      ) : null}

      <header className="app-bar">
        <Link to="/" className="app-bar-title">
          Local Gradebook
        </Link>
        <Link
          to="/database"
          className="icon-button"
          aria-label="Database operations"
          aria-current={onDatabase ? "page" : undefined}
        >
          <GearIcon />
        </Link>
      </header>

      <main className={onClassGrades ? "panel panel--wide" : "panel"}>
        <Outlet />
      </main>
    </div>
  );
}

function isClassGradesPath(pathname: string): boolean {
  return /^\/[1-9]\d*\/[1-9]\d*$/.test(pathname);
}
