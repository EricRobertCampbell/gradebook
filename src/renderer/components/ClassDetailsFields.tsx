import { nextClassInternalName } from "../../shared/class-internal-name";
import type { ClassFields } from "../../shared/ipc";
import "./common/Field.css";
import { TextArea } from "./common/TextArea";
import { TextField } from "./common/TextField";

type ClassDetailsFieldsProps = {
  values: ClassFields;
  subjects?: Array<string>;
  disabled?: boolean;
  onChange: (values: ClassFields) => void;
};

export function ClassDetailsFields({
  values,
  subjects = [],
  disabled,
  onChange,
}: ClassDetailsFieldsProps) {
  return (
    <div className="fields">
      <TextField
        label="Display name"
        required
        type="text"
        name="displayName"
        value={values.displayName}
        onChange={(event) => {
          const displayName = event.target.value;
          onChange({
            ...values,
            displayName,
            internalName: nextClassInternalName(
              displayName,
              values.displayName,
              values.internalName,
            ),
          });
        }}
        autoComplete="off"
        disabled={disabled}
      />
      <TextField
        label="Internal name"
        required
        type="text"
        name="internalName"
        value={values.internalName}
        onChange={(event) => onChange({ ...values, internalName: event.target.value })}
        autoComplete="off"
        disabled={disabled}
      />
      <TextField
        label="Subject"
        type="text"
        name="subject"
        list="class-subject-options"
        value={values.subject}
        onChange={(event) => onChange({ ...values, subject: event.target.value })}
        autoComplete="off"
        disabled={disabled}
      />
      <datalist id="class-subject-options">
        {subjects.map((subject) => (
          <option key={subject} value={subject} />
        ))}
      </datalist>
      <TextField
        label="Section"
        type="text"
        name="section"
        value={values.section}
        onChange={(event) => onChange({ ...values, section: event.target.value })}
        autoComplete="off"
        disabled={disabled}
      />
      <TextArea
        label="Description"
        required
        name="notes"
        value={values.notes}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
        disabled={disabled}
      />
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
