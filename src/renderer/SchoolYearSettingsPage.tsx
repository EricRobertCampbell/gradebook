import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { SchoolYear } from "../shared/ipc";
import "./components/common/ActionButton.css";
import "./components/common/BackLink.css";
import { ConfirmDeleteModal } from "./components/common/ConfirmDeleteModal";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { describeError, type DisplayError } from "./errors";
import { parseRouteId, schoolYearPath } from "./paths";
import { deleteSchoolYear, getSchoolYear } from "./school-years";
import "./SchoolYearSettingsPage.css";

export function SchoolYearSettingsPage() {
  const navigate = useNavigate();
  const schoolYearId = parseRouteId(useParams().schoolYearId);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadYear = useCallback(async () => {
    if (!schoolYearId) {
      setError("That school year was not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setSchoolYear(await getSchoolYear({ id: schoolYearId }));
    } catch (caught) {
      setSchoolYear(null);
      setError(describeError(caught, "That school year was not found."));
    } finally {
      setLoading(false);
    }
  }, [schoolYearId]);

  useEffect(() => {
    void loadYear();
  }, [loadYear]);

  async function onConfirmDelete(): Promise<void> {
    if (!schoolYear) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteSchoolYear(schoolYear.name);
      navigate("/");
    } catch (caught) {
      setError(describeError(caught, "The school year could not be deleted."));
      setPendingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  const yearHref = schoolYearId ? schoolYearPath(schoolYearId) : "/";

  return (
    <>
      <p className="eyebrow">School year settings</p>
      <h1>{schoolYear?.name ?? "School year"}</h1>
      <p className="lede">Delete this school year and every class in it.</p>

      {loading ? (
        <p className="muted" aria-live="polite">
          Loading school year…
        </p>
      ) : null}

      {deleting ? (
        <p className="muted" aria-live="polite">
          Deleting school year…
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && schoolYear ? (
        <section className="settings-danger">
          <h2 className="settings-danger-heading">Delete school year</h2>
          <p className="muted">
            This permanently deletes {schoolYear.name} and all of its classes, assessments, and
            marks.
          </p>
          <button
            type="button"
            className="action-button action-button--danger"
            disabled={deleting}
            onClick={() => setPendingDelete(true)}
          >
            Delete school year
          </button>
        </section>
      ) : null}

      <ConfirmDeleteModal
        title="Delete school year"
        open={pendingDelete}
        subjectName={schoolYear?.name ?? ""}
        prompt={`This will permanently delete ${schoolYear?.name ?? "this school year"}. Type the school year name to confirm.`}
        deleting={deleting}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(false);
          }
        }}
        onConfirm={() => void onConfirmDelete()}
      />

      <p className="back-link">
        <Link to={yearHref}>Back to school year</Link>
      </p>
    </>
  );
}
