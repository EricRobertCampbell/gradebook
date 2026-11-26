# Requirements

Source: [GitHub issue 60](https://github.com/EricRobertCampbell/gradebook/issues/60) — “Email students directly from the program”.

## Objective

A teacher can start an email to a student from Local Gradebook, and can optionally include that student’s parents and counsellors as carbon copy (Cc) or blind carbon copy (Bcc) recipients.

## Background

The teacher uses a local desktop gradebook. Student and parent records stay on the teacher’s machine in SQLite. There is no cloud account, mail server, or outbound messaging today.

Contact data already on the student:

| Person   | Where stored                         | Email fields                                      | Linked how                                      |
| -------- | ------------------------------------ | ------------------------------------------------- | ----------------------------------------------- |
| Student  | `students`                           | One optional email                                  | N/A                                             |
| Parent   | `parents`, via `student_parents`     | Up to two optional emails (`emailAddress1`, `2`)    | Many-to-many with the student                   |
| Counsellor | Not modelled                       | None                                              | The product has no counsellor entity or fields  |

The teacher adds and edits the student’s email on student create/update (`Students` tab modal; student settings). The student page (`#/students/<id>`) shows that email when present, lists linked parents with their emails, and is where parents are added, updated, or removed. Class enrolment and the grade table do not expose email actions.

Email addresses are optional. Empty strings are allowed; non-empty values must be valid email addresses. There is no in-app compose UI, no `mailto:` hand-off, and no use of the OS mail client from the app today.

The issue asks to email a student from the program, optionally including parents and counsellors as Cc or Bcc. It does not say how the message is sent, where the action starts, whether several students can be mailed in one action, or how counsellor contacts are stored.

## Functional Requirements

1. **Requested.** The teacher can start an email to a student from the program.
2. **Requested.** The teacher can optionally include that student’s parents as Cc or Bcc recipients on that email.
3. **Requested.** The teacher can optionally include counsellors as Cc or Bcc recipients on that email.
4. **Implied.** The student is the primary recipient (To) when the teacher emails that student.
5. **Implied.** Including parents or counsellors is optional for each send; the teacher can email the student alone.
6. **Implied.** When parents or counsellors are included, the teacher chooses whether each included group (or person) is placed on Cc or on Bcc.
7. **Implied.** Parent recipients come from the parents linked to that student and from the email addresses stored on those parent records.
8. **Implied.** Only addresses that exist for the chosen people are used. Empty email fields are not treated as recipients.
9. **Implied.** The teacher can complete the email outside or after the gradebook’s start action (subject, body, and final send remain available to the teacher in whatever mail path is chosen once that path is decided).

## Non-functional Requirements

- Student, parent, and counsellor contact details remain local gradebook data. Starting an email must not upload the gradebook database or invent a remote gradebook account.
- Any hand-off of addresses to a mail client or mail service is an intentional leave of the local-only boundary for those addresses and the message the teacher writes. The rest of the gradebook stays local.
- The teacher must be able to see which addresses will be used before the mail action proceeds, so they do not Cc or Bcc the wrong people.

## Business Rules

- A student has at most one stored email address.
- A parent has at most two stored email addresses. Either or both may be empty.
- Parents are linked to students many-to-many. Only parents linked to the student being emailed are candidates for that send.
- Counsellors are named in the request but are not part of the current data model. Counsellor recipients depend on how counsellor contacts are recorded (see Open Questions).
- Email fields that are empty are not recipients. Invalid addresses are already rejected when student or parent records are saved.

## Acceptance Criteria

- From the program, the teacher can start an email whose To recipient is the chosen student’s stored email when that student has one.
- When the teacher chooses to include parents, each non-empty email on parents linked to that student can be placed on Cc or on Bcc as the teacher chose for that send.
- When the teacher chooses not to include parents, no parent address is added as Cc or Bcc.
- When the teacher chooses to include counsellors, counsellor addresses for that send can be placed on Cc or on Bcc as the teacher chose.
- When the teacher chooses not to include counsellors, no counsellor address is added as Cc or Bcc.
- A parent or counsellor with no stored email is not added as a recipient.
- The teacher can still start an email to the student when that student has parents but the teacher leaves parents and counsellors out.

## Edge Cases

- The student has no email. The teacher cannot use that student as the To recipient until an email is stored (exact messaging and recovery path are open).
- The student has parents, but every parent email field is empty. Parent inclusion adds no addresses.
- A parent has one email filled and one empty. Only the filled address is a candidate recipient.
- A parent is linked to several students. Only the link to the student being emailed matters for that send.
- The student has several linked parents. All of those parents’ non-empty addresses are candidates when parents are included.
- Counsellor contacts are missing or incomplete. Counsellor inclusion cannot add addresses that do not exist.
- The OS or mail client is missing or fails to open. The teacher gets a clear failure path once the send mechanism is decided.

## Out of Scope

- Sending email that is not about contacting a student (for example school-wide announcements with no student To).
- Changing how student or parent emails are validated or stored, except as needed to support counsellor contacts if that is accepted later.
- Built-in chat, SMS, or push notification.
- Automatic emails on mark entry, missing work, or report generation.
- Mail merge of grades, comments, or report content into the message body, unless accepted later as an improvement.
- Replacing the teacher’s mail account or storing the teacher’s mail password in the gradebook.

## Suggested Improvements

1. **Technical — Prefer the OS mail client over in-app SMTP.** Opening the teacher’s existing mail app with To/Cc/Bcc filled (for example via a controlled external open of a `mailto` URL) avoids storing SMTP credentials in a local PII database and keeps the gradebook from becoming a mail server. Outcome: lower security surface and a familiar compose window. Non-binding until accepted.

2. **User experience — Put the email action on the student page.** That page already shows the student email and linked parents. Outcome: the teacher starts mail where the contacts already are, without hunting through class settings. Non-binding until accepted.

3. **User experience — Let the teacher pick which parent addresses to include.** A student may have several parents and up to two addresses each. Outcome: avoids copying every household address when the teacher only needs one guardian. Non-binding until accepted.

4. **User experience — Clear empty-email guidance.** When the student has no email, tell the teacher and link or point them to edit student details. Outcome: fewer dead-end clicks. Non-binding until accepted.

5. **Technical / User experience — Add counsellor contacts to the product.** The request names counsellors, but none exist today. A per-student counsellor link, or a reusable counsellor directory teachers can attach per student, would make Cc/Bcc possible. Outcome: counsellor inclusion becomes real data rather than free-typed addresses each time. Non-binding until accepted; choosing the model is still an open question.

6. **User experience — Optional class-roster entry point.** Allow starting the same student email from a class enrolment list for teachers who work from the class, not the Students tab. Outcome: fewer context switches during class work. Non-binding until accepted.

7. **User experience — Optional subject prefills.** Offer a blank subject, or a simple prefill such as the student display name and class name when a class context exists. Outcome: faster starts without forcing template language. Non-binding until accepted.

## Open Questions

1. **High.** How should the program send or start the email? Options include handing off to the OS mail client, an in-app compose that uses a teacher-configured SMTP account, or another path. This blocks planning of IPC, security, and UI.
2. **High.** How are counsellor contacts stored and chosen? There is no counsellor model today. Until this is decided, counsellor Cc/Bcc cannot be planned beyond a placeholder.
3. **High.** Where must the teacher be able to start the email (student page only, class roster, grade table, elsewhere)? At least one entry point is required for planning.
4. **Medium.** When parents are included, is the default Cc, Bcc, or an explicit choice with no default preference? Same question for counsellors.
5. **Medium.** If the student has no email, should the teacher be blocked, or allowed to open a message with only parent/counsellor recipients?
6. **Medium.** Is one student per send enough for this issue, or must the teacher email several students in one action (for example a whole class)?
7. **Low.** Should the gradebook remember the teacher’s last Cc/Bcc choices for parents or counsellors, or start fresh each time?
8. **Low.** May the teacher type an extra ad-hoc address (for example a temporary counsellor email) for one send without saving it on a record?

## Assumptions

- “Email a student” means the student’s stored email is the To recipient when present.
- “Optionally including parents as cc / bcc” means the teacher can add linked parents’ addresses on Cc or Bcc for that send, not that every email must include them.
- “Counsellors as cc / bcc” is requested even though counsellors are not in the product yet; delivering that part depends on Open Question 2.
- The issue body is a product wish, not an implementation design. Mentions of Cc/Bcc describe recipient roles, not a mandate for a particular mail API.
- The teacher reviews and sends the message in their normal mail workflow once the gradebook has started it; the gradebook need not prove delivery unless a later decision says otherwise.
- British spelling “counsellor” matches the issue and project language.

## Changes

- 2026-11-26: Initial requirements from issue 60.
`)