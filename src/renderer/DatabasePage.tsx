import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { DatabaseStatus } from "../shared/ipc";
import "./components/common/ActionButton.css";
import "./components/common/BackLink.css";
import { ConfirmDeleteModal } from "./components/common/ConfirmDeleteModal";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { requestDatabaseStatus } from "./database-status";
import { exportGradebook, importGradebook } from "./database-transfer";
import "./DatabasePage.css";
import { describeError, type DisplayError } from "./errors";

const IMPORT_CONFIRMATION = "replace";

type QueryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: DatabaseStatus }
  | { status: "error"; message: DisplayError };

export function DatabasePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<QueryState>({ status: "idle" });
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<DisplayError | null>(null);

  async function checkDatabase(): Promise<void> {
    setQuery({ status: "loading" });

    try {
      const result = await requestDatabaseStatus();

      if (!result.connected) {
        setQuery({ status: "error", message: result.message });
        return;
      }

      setQuery({ status: "success", result });
    } catch (error) {
      setQuery({
        status: "error",
        message: describeError(
          error,
          "The database status request failed. Confirm that the main process is running.",
        ),
      });
    }
  }

  async function onExport(): Promise<void> {
    setExporting(true);
    setTransferError(null);
    setExportMessage(null);

    try {
      const result = await exportGradebook();

      if (result.cancelled) {
        return;
      }

      setExportMessage(
        result.path ? `Saved the gradebook to ${result.path}.` : "Saved a copy of the gradebook.",
      );
    } catch (error) {
      setTransferError(describeError(error, "The gradebook could not be saved."));
    } finally {
      setExporting(false);
    }
  }

  function onImportClick(): void {
    setTransferError(null);
    setImportMessage(null);
    setConfirmImport(true);
  }

  function closeImportModal(): void {
    if (importing) {
      return;
    }

    setConfirmImport(false);
  }

  async function onConfirmImport(): Promise<void> {
    setConfirmImport(false);

    if (typeof window.gradebook?.database.import === "function") {
      await runImport();
      return;
    }

    fileInputRef.current?.click();
  }

  async function onImportFile(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    await runImport(file);
  }

  async function runImport(file?: File): Promise<void> {
    setImporting(true);
    setTransferError(null);
    setImportMessage(null);

    try {
      const result = await importGradebook(file);

      if (result.cancelled) {
        return;
      }

      setImportMessage("Imported the gradebook. Open a school year or student list to see the new data.");
      setQuery({ status: "idle" });
    } catch (error) {
      setTransferError(describeError(error, "The gradebook could not be imported."));
    } finally {
      setImporting(false);
    }
  }

  const busyMessage = exporting
    ? "Saving gradebook…"
    : importing
      ? "Importing gradebook…"
      : query.status === "loading"
        ? "Checking database…"
        : null;

  return (
    <>
      <p className="eyebrow">Settings</p>
      <h1>Database operations</h1>
      <p className="lede">
        Check the local SQLite connection, save a copy of this gradebook, or replace it from a
        SQLite file.
      </p>

      {busyMessage ? (
        <p className="muted" aria-live="polite">
          {busyMessage}
        </p>
      ) : null}

      <ErrorDisplay error={transferError} />

      <section className="database-section">
        <h2>Connection</h2>
        <p className="muted">
          Confirm that the main process can reach SQLite through Drizzle. This does not expose a
          generic SQL API to the renderer.
        </p>
        <button
          type="button"
          className="action-button"
          onClick={() => void checkDatabase()}
          disabled={query.status === "loading" || exporting || importing}
        >
          {query.status === "loading" ? "Checking…" : "Check Database"}
        </button>
        <div className="status" aria-live="polite">
          {query.status === "idle" ? (
            <p className="muted">Select Check Database to query SQLite through the main process.</p>
          ) : null}
          {query.status === "loading" ? <p className="muted">Contacting the local database…</p> : null}
          {query.status === "success" ? <p className="success">{query.result.message}</p> : null}
          {query.status === "error" ? <ErrorDisplay error={query.message} /> : null}
        </div>
      </section>

      <section className="database-section">
        <h2>Save</h2>
        <p className="muted">
          Write a standalone SQLite copy of the current gradebook. This does not change the live
          database.
        </p>
        <button
          type="button"
          className="action-button"
          onClick={() => void onExport()}
          disabled={exporting || importing}
        >
          {exporting ? "Saving…" : "Save gradebook"}
        </button>
        {exportMessage ? <p className="success">{exportMessage}</p> : null}
      </section>

      <section className="database-section">
        <h2>Import</h2>
        <p className="muted">
          Replace this gradebook with a SQLite file previously saved from Gradebook. Current data
          will be overwritten.
        </p>
        <button
          type="button"
          className="action-button action-button--danger"
          onClick={onImportClick}
          disabled={exporting || importing}
        >
          {importing ? "Importing…" : "Import gradebook"}
        </button>
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept=".sqlite,.db,application/vnd.sqlite3,application/x-sqlite3"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void onImportFile(file);
          }}
        />
        {importMessage ? <p className="success">{importMessage}</p> : null}
      </section>

      <ConfirmDeleteModal
        title="Replace gradebook"
        open={confirmImport}
        subjectName={IMPORT_CONFIRMATION}
        prompt="This will replace all current gradebook data with the chosen SQLite file. Type replace to confirm."
        confirmLabel="Import"
        busyLabel="Importing…"
        deleting={importing}
        onClose={closeImportModal}
        onConfirm={() => void onConfirmImport()}
      />

      <p className="back-link">
        <Link to="/">Back to gradebook</Link>
      </p>
    </>
  );
}
