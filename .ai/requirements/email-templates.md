# Requirements

Source: [GitHub issue 61](https://github.com/EricRobertCampbell/gradebook/issues/61) — “Email templates”. Related: [GitHub issue 60](https://github.com/EricRobertCampbell/gradebook/issues/60) — “Email students directly from the program”.

## Objective

A teacher can keep a collection of reusable email templates in the local gradebook, edit each template’s addressing and body fields, attach templates to a chosen scope (the whole gradebook, one school year, or one class), and copy templates from another school year or class. Templates support merge fields so a later send flow can fill in student-specific values. The set of merge fields is not decided yet.

## Background

The teacher uses a local desktop gradebook. Students are global records with an optional email address. Parents are linked to students and can each store two optional email addresses. There is no counsellor record, no email-send action, and no template store today. Email addresses are validated when entered and otherwise only shown on student and parent screens.

School years hold classes (the product and code usually say “class”; issue 61 says “course” for the same thing). Students enrol in classes. Copying already exists only for grading structure inside one class (category, sub-category, and work). There is no copy of records across school years or across classes.

Issue 60 asks to email a student from the program, optionally including parents and counsellors on cc or bcc. Issue 61 asks for templates that support that kind of emailing. This specification covers managing templates. Actually sending mail is issue 60 and stays out of scope here unless the human expands this work.

## Functional Requirements

1. **Requested.** The teacher can keep a collection of email templates in the gradebook.
2. **Requested.** Each template has a subject, to, cc, bcc, and body that the teacher can set and change.
3. **Requested.** Each template has a scope of global, school year, or class (“course” in the issue).
4. **Requested.** The teacher can create, read, update, and delete templates.
5. **Requested.** The teacher can copy a template from another school year or from another class into the place they are working.
6. **Requested.** Templates may include merge fields. Which fields exist is still to be decided (see Open Questions).
7. **Implied.** Templates stay in the local gradebook with the rest of the teacher’s data, including a database copy saved from Database operations.
8. **Implied.** A global template is available regardless of which school year or class the teacher is in.
9. **Implied.** A school-year template belongs to one school year. Removing that school year removes those templates with it, or the teacher is prevented from removing the year while they exist — exact lifecycle behaviour is open if not accepted from Suggested Improvements.
10. **Implied.** A class template belongs to one class. Removing that class removes those templates with it, or the teacher is prevented from removing the class while they exist — same open lifecycle point as above.
11. **Implied.** Copying a template creates a new template; changing the copy does not change the source.
12. **Implied.** The teacher can list the templates that apply in the context they are managing (global, a year, or a class), at least enough to open, edit, copy, and delete them.

## Non-functional Requirements

- Template content stays on the teacher’s machine with the rest of the gradebook. It may name students or use merge fields that resolve to student and parent contact data, so it is handled with the same local-only boundary as other student data.
- The teacher can create and edit templates offline. This specification does not require the app to send mail.

## Business Rules

- “Course” in issue 61 means a class in the current product (a row in `classes` under a school year).
- Scope is one of: global, one school year, or one class. A template has exactly one scope.
- Subject, to, cc, bcc, and body are part of the template the teacher edits. How to, cc, and bcc are expressed (literal addresses, roles such as student or parents, merge fields, or a mix) is not decided yet.
- Merge fields are placeholders the teacher can put in template text. The catalogue of fields is TBD.
- Copying from another year or class produces a separate template under the destination scope the teacher chooses for that copy.
- Sending mail, choosing recipients at send time, and opening an external mail client belong to issue 60, not to this template-management outcome.

## Acceptance Criteria

- The teacher can create an email template and later open it again with the same subject, to, cc, bcc, body, and scope.
- The teacher can change subject, to, cc, bcc, and body on an existing template and see the new values after leaving and returning.
- The teacher can delete a template so it no longer appears in the collection.
- The teacher can create a template scoped as global, one scoped to a school year, and one scoped to a class.
- A school-year-scoped template is associated with that school year; a class-scoped template is associated with that class.
- The teacher can copy a template that belongs to another school year into a chosen destination scope, and the copy is a separate template from the source.
- The teacher can copy a template that belongs to another class into a chosen destination scope, and the copy is a separate template from the source.
- After a copy, editing the copy leaves the source unchanged, and editing the source leaves the copy unchanged.
- A saved database export still contains the teacher’s templates.
- When merge fields are defined, the teacher can include those fields in a template’s editable text fields that support them; unresolved catalogue details stay under Open Questions until decided.

## Edge Cases

- Subject, to, cc, bcc, or body may be empty when the teacher saves a template, unless a later decision requires otherwise.
- A class may have no templates; a school year may have no templates; the gradebook may have no global templates.
- Copying when the destination already has a template with the same name (if names exist) needs a clear outcome once naming is decided.
- Deleting a school year or class that still has scoped templates must follow the lifecycle rule once that rule is chosen.
- Students or parents with blank email addresses do not block template editing; missing addresses matter at send time (issue 60).
- There is no counsellor entity today. Templates must not assume counsellor data exists until that gap is addressed for issue 60 or accepted here.

## Out of Scope

- Actually sending email, opening a mail client, SMTP, or any network mail delivery (issue 60).
- Adding counsellor records, unless the human accepts that as part of this work or of issue 60.
- Deciding the full merge-field catalogue beyond recording that merge fields are required and listing open questions.
- Bulk email to a whole class as a separate product feature beyond what templates enable for issue 60.
- Rich text, attachments, or HTML email design, unless later accepted.
- Copying an entire school year or class; only copying email templates across years or classes is in scope.

## Suggested Improvements

1. **User experience.** Let the teacher insert merge fields from a picker instead of typing field names by hand, so templates stay valid when the catalogue is small and easy to mistype.
2. **User experience.** Show which templates apply when composing or preparing an email in the issue 60 flow (global plus the current year and class), so the teacher does not hunt across scopes at send time.
3. **Technical.** On delete of a school year or class, remove its scoped templates with the same cascade style as other year- and class-owned data, so teachers are not blocked by orphan template rows and export/import stay consistent.
4. **User experience.** Give each template a display name separate from the subject, so the teacher can tell “progress concern” templates apart when subjects are similar or empty.
5. **Technical / user experience.** Support role-based addressing in to, cc, and bcc (for example student, parents) in addition to literal addresses, so templates stay reusable across students the way issue 60 describes optional parent cc/bcc.

## Open Questions

1. **High.** Which merge fields are available (issue says “actual fields TBD”)? Until this is answered, planning can sketch storage and editing but cannot lock the substitution catalogue or validation rules.
2. **High.** What may the teacher put in to, cc, and bcc on a template: literal email addresses, role placeholders (student, each parent email, counsellor), merge fields, or a combination?
3. Should templates have a display name distinct from subject?
4. When a school year or class is deleted, should its templates be deleted automatically, blocked until the teacher removes them, or reassigned?
5. Can a class-scoped template be listed and copied from a different school year without opening that class first?
6. Does “copy from other years / courses” allow changing scope on the copy (for example year template → global), or must the copy keep the same kind of scope?
7. Is managing templates useful to ship before issue 60’s send flow, or must both land together?
8. Should counsellor support wait entirely for issue 60, or must templates reserve cc/bcc roles for counsellors now?

## Assumptions

- Issue 61’s “course” means the existing class entity under a school year.
- The primary user is the teacher on their local machine; templates are not shared across teachers or devices except via the existing database export/import.
- Templates are plain text unless a later decision adds rich content.
- Stakeholder wording that lists subject, to, cc, bcc, body, scopes, CRUD, and copy is **Requested** behaviour; how addressing and merge fields are modelled beyond that list remains open.
- Issue 60 remains a separate send capability. This document does not require implementing send.
- Suggestion items above are non-binding until the human accepts them into Functional Requirements.
