import type { ClassFields } from "../../shared/ipc";
import "./common/Field.css";

type ClassDetailsFieldsProps = {
  values: ClassFields;
  disabled?: boolean;
  onChange: (values: ClassFields) => void;
};

export function ClassDetailsFields({ values, disabled, onChange }: ClassDetailsFieldsProps) {
  return (
    <div className="fields">
      <label className="field">
        <span className="field-label">Display name</span>
        <input
          type="text"
          name="displayName"
          value={values.displayName}
          onChange={(event) => onChange({ ...values, displayName: event.target.value })}
          autoComplete="off"
          disabled={disabled}
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Internal name</span>
        <input
          type="text"
          name="internalName"
          value={values.internalName}
          onChange={(event) => onChange({ ...values, internalName: event.target.value })}
          autoComplete="off"
          disabled={disabled}
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Subject</span>
        <input
          type="text"
          name="subject"
          value={values.subject}
          onChange={(event) => onChange({ ...values, subject: event.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </label>
      <label className="field">
        <span className="field-label">Section</span>
        <input
          type="text"
          name="section"
          value={values.section}
          onChange={(event) => onChange({ ...values, section: event.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </label>
      <label className="field">
        <span className="field-label">Description</span>
        <textarea
          name="notes"
          value={values.notes}
          onChange={(event) => onChange({ ...values, notes: event.target.value })}
          disabled={disabled}
          required
        />
      </label>
    </div>
  );
}

export function emptyClassFields(): ClassFields {
  return {
    displayName: "",
    internalName: "",
    subject: "",
    section: "",
    notes: "",
  };
}
