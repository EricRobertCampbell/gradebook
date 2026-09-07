import type { StudentFields } from "../../shared/ipc";
import "./common/Field.css";

type StudentDetailsFieldsProps = {
  values: StudentFields;
  disabled?: boolean;
  onChange: (values: StudentFields) => void;
};

export function StudentDetailsFields({ values, disabled, onChange }: StudentDetailsFieldsProps) {
  return (
    <div className="fields">
      <label className="field">
        <span className="field-label">First name</span>
        <input
          type="text"
          name="firstName"
          value={values.firstName}
          onChange={(event) => onChange({ ...values, firstName: event.target.value })}
          autoComplete="off"
          disabled={disabled}
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Last name</span>
        <input
          type="text"
          name="lastName"
          value={values.lastName}
          onChange={(event) => onChange({ ...values, lastName: event.target.value })}
          autoComplete="off"
          disabled={disabled}
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Preferred name</span>
        <input
          type="text"
          name="preferredName"
          value={values.preferredName}
          onChange={(event) => onChange({ ...values, preferredName: event.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </label>
      <label className="field">
        <span className="field-label">Email address</span>
        <input
          type="email"
          name="email"
          value={values.email}
          onChange={(event) => onChange({ ...values, email: event.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </label>
      <label className="field">
        <span className="field-label">Notes</span>
        <textarea
          name="notes"
          value={values.notes}
          onChange={(event) => onChange({ ...values, notes: event.target.value })}
          disabled={disabled}
        />
      </label>
    </div>
  );
}

export function emptyStudentFields(): StudentFields {
  return {
    firstName: "",
    lastName: "",
    preferredName: "",
    notes: "",
    email: "",
  };
}

export function studentFieldsFrom(student: StudentFields): StudentFields {
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    preferredName: student.preferredName,
    notes: student.notes,
    email: student.email,
  };
}
