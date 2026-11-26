# Requirements

Source: [GitHub issue 80](https://github.com/EricRobertCampbell/gradebook/issues/80) — “Import csv / excel of students”.

## Objective

A teacher can bring many student records into the local gradebook from a CSV or Excel spreadsheet in one import, choosing which spreadsheet columns map to which student fields, instead of entering each student by hand.

## Background

The primary user is the teacher using the local desktop gradebook. Student records live on the Students tab of the home screen (`StudentsPanel`). Today the teacher adds one student at a time through a modal that collects first name, last name, preferred name, email, and notes. Each student is a global record (not owned by a school year or class). Enrolment into a class is a separate step on class settings (`ClassSettingsPage`), where the teacher picks from existing students.

Current student fields are:

| Field           | Required when creating | Notes                                      |
| --------------- | ---------------------- | ------------------------------------------ |
| First name      | Yes                    | Non-empty after trim                       |
| Last name       | Yes                    | Non-empty after trim                       |
| Preferred name  | No                     | May be empty                               |
| Email           | No                     | Empty or a valid email                     |
| Notes           | No                     | Free text                                  |

There is already a Database page that imports and exports a full SQLite gradebook file. That replaces the whole database. It is not a student list import, and it does not read CSV or Excel.

Issue 80 asks for spreadsheet import of students with user-selectable column mapping to first name, last name, preferred name, and other student qualities. It does not say whether the import should enrol students into a class, update existing students, or only create new records.

## Functional Requirements

1. **Requested.** The teacher can import student records from a CSV file.
2. **Requested.** The teacher can import student records from an Excel workbook (`.xlsx`).
3. **Requested.** Before the import runs, the teacher chooses which spreadsheet column maps to each student field they want to fill.
4. **Requested.** The mapping can target first name, last name, and preferred name.
5. **Requested.** The mapping can target the other student qualities the gradebook already stores for a student (email and notes).
6. **Implied.** First name and last name must be mapped to columns before the import can create students, because those fields are required when creating a student by hand.
7. **Implied.** Preferred name, email, and notes may be left unmapped. Unmapped optional fields are treated as empty for each imported row, in the same way as leaving them blank on the add-student form.
8. **Implied.** Each successful import row creates a student record in the local gradebook with the mapped values, subject to the same field rules as manual create (trimmed text; required names; email empty or valid).
9. **Implied.** After a successful import, the new students appear in the student list without a separate manual create for each one.
10. **Implied.** Spreadsheet columns that the teacher does not map are ignored.
11. **Implied.** The teacher can cancel before the import is applied, leaving existing students unchanged.
12. **Implied.** If some rows cannot be imported, the teacher is told which rows failed and why, and rows that are valid still create students (partial success), unless the human decides otherwise in Open Questions.

## Non-functional Requirements

- Spreadsheet contents and resulting student records stay on the teacher’s machine with the rest of the gradebook. Student names, emails, and notes are local PII and follow the same local-only boundary as manual student entry.
- The teacher can complete the import offline.
- Import must not replace or wipe the existing gradebook the way Database import of a SQLite file does; it only adds (or, if later accepted, updates) student records from the spreadsheet.

## Business Rules

- A student is a global person record. Spreadsheet import creates those records. It does not by itself enrol a student in a class, link parents, or create assessments.
- Student field validation for import matches manual create: first and last name required and non-empty after trim; preferred name, notes, and email optional; email must be empty or valid.
- Database SQLite import/export remains a separate whole-gradebook operation and is not this feature.
- One spreadsheet row corresponds to one candidate student. Header or label rows are not student records when the teacher treats them as headers for mapping.

## Acceptance Criteria

- Given a CSV with columns the teacher can map to first and last name, when the teacher maps those columns and confirms the import, each valid data row becomes a student in the student list with those names.
- Given an `.xlsx` file with the same kind of columns, the teacher can map and import in the same way.
- When the teacher maps preferred name, email, and notes as well, the created students show those values on the student settings page.
- When preferred name, email, or notes are left unmapped, the created students have empty values for those fields.
- When a column is not mapped to any student field, its values do not appear on any student field.
- When first name or last name is not mapped, the import does not create students until those mappings are provided.
- When a data row has an empty first or last name after mapping and trim, that row does not create a student, and the teacher is told that the row failed.
- When the teacher cancels before confirming, no new students are created from that spreadsheet.
- After import, existing students that were not part of the import remain unchanged.
- A saved database copy after import still contains the newly created students.

## Edge Cases

- Spreadsheet with only a header row and no data rows: no students created; the teacher is told nothing was imported.
- Spreadsheet with extra columns beyond student fields: ignored unless mapped.
- Empty cells in optional mapped columns: stored as empty optional fields.
- Duplicate names across rows or matching an existing student: behaviour depends on Open Questions (create duplicates vs skip vs update).
- Invalid email in a mapped email column: that row fails validation and does not create a student; other valid rows still import if partial success is kept.
- Multi-sheet Excel workbook: which sheet is used is an Open Question; until decided, assume the first sheet unless the teacher can choose.
- Very large files: no size target is requested; if import is slow or fails, that is an Open Question for planning limits.
- CSV encoding and delimiter variants (UTF-8 vs other, comma vs semicolon): Open Question if anything beyond common UTF-8 comma-separated files must work.

## Out of Scope

- Importing parents, parent–student links, enrolments, grades, assessments, or class structure from the spreadsheet.
- Replacing the whole gradebook (existing Database SQLite import).
- Exporting students to CSV or Excel (not requested).
- Importing from Google Sheets, SIS APIs, or formats other than CSV and `.xlsx`.
- Matching or merging against external student IDs (no such field exists on students today).
- Changing the manual one-at-a-time add-student flow, except that imported students use the same stored fields.

## Suggested Improvements

1. **User experience.** Offer an optional “enrol imported students into this class” step when the teacher starts the import from class settings. Teachers often receive a class list and otherwise must enrol each new student by hand after import. Accepting this would extend Functional Requirements; until then enrolment stays out of scope.
2. **User experience.** Show a short preview of the first few mapped rows before confirm, so the teacher can catch a swapped first/last name column before writing to the database.
3. **User experience.** Remember the last column mapping for the same header names, so a teacher who imports the same school export format more than once does not remap every time.
4. **Technical.** Detect a header row automatically from the first row when it looks like labels, and use those labels in the mapping UI, while still allowing the teacher to treat the first row as data if needed.
5. **User experience.** After import, summarise created count, skipped/failed count, and a way to open or filter the new students, so the teacher can verify the batch quickly.
6. **Technical.** Support updating an existing student when the teacher explicitly chooses a match rule (for example same email, or same first and last name), instead of always creating duplicates. Only becomes a requirement if the human accepts a duplicate/update policy.

## Open Questions

1. **High.** When a spreadsheet row matches an existing student (same first and last name, and/or same email), should the import create another student, skip the row, or update the existing record? The issue does not say.
2. **High.** Should this import only create global student records, or should the teacher also be able to enrol the imported students into a chosen class in the same flow?
3. **Medium.** Where should the teacher start the import: Students tab only, class settings (class list context), or both?
4. **Medium.** For `.xlsx` files with multiple sheets, must the teacher pick a sheet, or is the first sheet enough for v1?
5. **Medium.** Must every valid row commit even when some rows fail (partial success), or should a validation failure block the whole import until the file is fixed?
6. **Low.** Which CSV dialects are in scope beyond UTF-8 with a header row and comma separators (semicolon, tab, BOM, non-UTF-8)?
7. **Low.** Is `.xls` (legacy Excel) required, or only `.xlsx` as stated in the issue?

## Assumptions

- “Other student qualities” means the remaining student fields already in the product: email and notes. No new student attributes are required for this issue.
- Preferred name is one of the explicitly named mapping targets; it stays optional and may be empty.
- Import creates new students only until the human answers the duplicate/update question; this spec does not require matching or merging.
- Enrolment into classes stays a separate workflow until the human accepts the enrolment suggested improvement or answers Open Question 2.
- The existing Database SQLite import is unrelated and stays as it is.
- Stakeholder wording “csv or xlsx” means CSV text files and modern Excel workbooks; legacy `.xls` is not assumed unless requested.
`)