import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { SchoolYear } from "../shared/ipc";
import "./components/common/ActionButton.css";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import "./components/common/RecordList.css";
import "./SchoolYearsPanel.css";
import { describeError, type DisplayError } from "./errors";
import { schoolYearPath } from "./paths";
import { createSchoolYear, listSchoolYears } from "./school-years";

export function SchoolYearsPanel() {
  const navigate = useNavigate();
  const [years, setYears] = useState<Array<SchoolYear>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);
  const [newName, setNewName] = useState("");

  const loadYears = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setYears(await listSchoolYears());
    } catch (caught) {
      setError(describeError(caught, "The school years could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadYears();
  }, [loadYears]);

  async function onAddSchoolYear(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createSchoolYear(newName);
      setNewName("");
      setYears(await listSchoolYears());
    } catch (caught) {
      setError(describeError(caught, "The school year could not be created."));
    } finally {
      setSaving(false);
    }
  }

  const busyMessage = saving ? "Adding school year…" : loading ? "Loading school years…" : null;

  return (
    <>
      <p className="lede">Choose a school year to open it, or add a new one.</p>

      {busyMessage ? (
        <p className="muted" aria-live="polite">
          {busyMessage}
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && years.length === 0 ? <p className="muted">No school years yet.</p> : null}

      {years.length > 0 ? (
        <ul className="record-list">
          {years.map((year) => (
            <li key={year.id} className="record-item">
              <button
                type="button"
                className="record-button"
                onClick={() => navigate(schoolYearPath(year.id))}
              >
                {year.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form className="school-year-form" onSubmit={(event) => void onAddSchoolYear(event)}>
        <label className="school-year-field">
          <span className="visually-hidden">New school year name</span>
          <input
            type="text"
            name="schoolYearName"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="2024-2025"
            autoComplete="off"
            disabled={saving}
          />
        </label>
        <button type="submit" className="action-button" disabled={saving}>
          {saving ? "Adding…" : "Add school year"}
        </button>
      </form>
    </>
  );
}
