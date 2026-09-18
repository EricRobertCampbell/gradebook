import { Link, Outlet, useLocation } from "react-router-dom";
import "./App.css";
import { GearIcon } from "./components/common/icons/GearIcon";
import "./components/common/icons/icon-button.css";
import { hasPreloadDatabaseApi } from "./database-status";

export function App() {
  const location = useLocation();
  const isDevelopment = import.meta.env.DEV;
  const usesBrowserFallback = isDevelopment && !hasPreloadDatabaseApi();
  const onDatabase = location.pathname === "/database" || location.pathname === "/settings";
  const onWidePanel = isWidePanelPath(location.pathname);

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

      <main className={onWidePanel ? "panel panel--wide" : "panel"}>
        <Outlet />
      </main>
    </div>
  );
}

function isWidePanelPath(pathname: string): boolean {
  return (
    /^\/[1-9]\d*\/[1-9]\d*$/.test(pathname) ||
    /^\/[1-9]\d*\/data(?:\/[1-9]\d*)?$/.test(pathname) ||
    /^\/[1-9]\d*\/[1-9]\d*\/data$/.test(pathname)
  );
}
