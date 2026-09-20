import type { StudentFields } from "../../shared/ipc";
import "./common/Field.css";
import { TextArea } from "./common/TextArea";
import { TextField } from "./common/TextField";

type StudentDetailsFieldsProps = {
  values: StudentFields;
  disabled?: boolean;
  onChange: (values: StudentFields) => void;
};

export function StudentDetailsFields({ values, disabled, onChange }: StudentDetailsFieldsProps) {
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
        name="email"
        value={values.email}
        onChange={(event) => onChange({ ...values, email: event.target.value })}
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
