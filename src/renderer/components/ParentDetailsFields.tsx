import type { ParentFields } from "../../shared/ipc";
import "./common/Field.css";

type ParentDetailsFieldsProps = {
  values: ParentFields;
  disabled?: boolean;
  onChange: (values: ParentFields) => void;
};

export function ParentDetailsFields({ values, disabled, onChange }: ParentDetailsFieldsProps) {
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
          name="emailAddress1"
          value={values.emailAddress1}
          onChange={(event) => onChange({ ...values, emailAddress1: event.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </label>
      <label className="field">
        <span className="field-label">Second email address</span>
        <input
          type="email"
          name="emailAddress2"
          value={values.emailAddress2}
          onChange={(event) => onChange({ ...values, emailAddress2: event.target.value })}
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

export function emptyParentFields(): ParentFields {
  return {
    firstName: "",
    lastName: "",
    preferredName: "",
    notes: "",
    emailAddress1: "",
    emailAddress2: "",
  };
}

export function parentFieldsFrom(parent: ParentFields): ParentFields {
  return {
    firstName: parent.firstName,
    lastName: parent.lastName,
    preferredName: parent.preferredName,
    notes: parent.notes,
    emailAddress1: parent.emailAddress1,
    emailAddress2: parent.emailAddress2,
  };
}
