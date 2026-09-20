import type { ParentFields } from "../../shared/ipc";
import "./common/Field.css";
import { TextArea } from "./common/TextArea";
import { TextField } from "./common/TextField";

type ParentDetailsFieldsProps = {
  values: ParentFields;
  disabled?: boolean;
  onChange: (values: ParentFields) => void;
};

export function ParentDetailsFields({ values, disabled, onChange }: ParentDetailsFieldsProps) {
  return (
    <div className="fields">
      <TextField
        label="First name"
        required
        type="text"
        name="firstName"
        value={values.firstName}
        onChange={(event) => onChange({ ...values, firstName: event.target.value })}
        autoComplete="off"
        disabled={disabled}
      />
      <TextField
        label="Last name"
        required
        type="text"
        name="lastName"
        value={values.lastName}
        onChange={(event) => onChange({ ...values, lastName: event.target.value })}
        autoComplete="off"
        disabled={disabled}
      />
      <TextField
        label="Preferred name"
        type="text"
        name="preferredName"
        value={values.preferredName}
        onChange={(event) => onChange({ ...values, preferredName: event.target.value })}
        autoComplete="off"
        disabled={disabled}
      />
      <TextField
        label="Email address"
        type="email"
        name="emailAddress1"
        value={values.emailAddress1}
        onChange={(event) => onChange({ ...values, emailAddress1: event.target.value })}
        autoComplete="off"
        disabled={disabled}
      />
      <TextField
        label="Second email address"
        type="email"
        name="emailAddress2"
        value={values.emailAddress2}
        onChange={(event) => onChange({ ...values, emailAddress2: event.target.value })}
        autoComplete="off"
        disabled={disabled}
      />
      <TextArea
        label="Notes"
        name="notes"
        value={values.notes}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
        disabled={disabled}
      />
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
