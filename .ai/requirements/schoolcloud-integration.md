# Requirements

Source: [GitHub issue 59](https://github.com/EricRobertCampbell/gradebook/issues/59) — “Chrome extension to actually integrate with schoolcloud”.

## Objective

A teacher can send marks that already exist in Local Gradebook into SchoolCloud for a chosen piece of work, so the same results do not have to be typed twice. Broader synchronisation of gradebook data with SchoolCloud is desirable if it can be done safely, but the minimum outcome is a controlled push of marks for one assignment the teacher selects.

## Background

The primary user is a teacher who keeps Local Gradebook as the day-to-day marking tool and also has to record results in SchoolCloud, the school’s student information system (an Alberta PASI-approved SIS used for marks, report cards, and related school records).

In Local Gradebook today:

- Marking happens on the class grade table (`#/<school-year-id>/<class-id>`). Each cell is one student’s assessment on one piece of work.
- A piece of work has a name, optional date, maximum score, and weight, and sits under a category or sub-category for that class.
- An assessment stores a score (nullable), status (`counted`, `exempt`, `nhi`, or `unmarked`), date, weight, and notes. Adjustments can change the effective percent.
- Special marks use codes `E` (exempt) and `NHI` (not handed in). Exempt marks are left out of averages. Not handed in counts as zero. Unmarked notes have no counted score.
- Students store first name, last name, preferred name, email, and notes. Classes store display name, internal name, subject, and section. There is no SchoolCloud identifier on any of those records.
- All student and mark data stay on the teacher’s machine in SQLite. The renderer talks only through `window.gradebook`. There is no generic SQL API and no existing SchoolCloud connection.
- Database operations can export or replace the whole SQLite file. That is a full backup/restore path, not a SchoolCloud hand-off.

SchoolCloud and Local Gradebook are separate systems today. The teacher must re-enter or otherwise transfer marks by hand. Issue 59 asks for integration so Local Gradebook marks can reach SchoolCloud, at least for one chosen assignment.

Issue 59 also names a Chrome extension as the delivery idea, and asks how an extension would talk to a running Gradebook instance, how assignment mapping would work, how SchoolCloud handles special values such as NHI, and how hard extension approval is. Those are open questions for planning, not settled product decisions.

## Functional Requirements

1. **Requested.** The teacher can take marks that already exist in Local Gradebook for a chosen piece of work and get those marks into SchoolCloud for the corresponding SchoolCloud assignment, without retyping each student’s score by hand.
2. **Requested.** The teacher chooses which Local Gradebook piece of work is involved. Marks for other work are not sent as part of that action.
3. **Implied.** The teacher can tell which Local Gradebook work and which SchoolCloud assignment are being paired for that push before the marks are written into SchoolCloud.
4. **Implied.** The push covers the enrolled students for that class whose marks should appear on that SchoolCloud assignment. Students without a mark in Local Gradebook for that work are handled in a defined way (see Open Questions), not left silently inconsistent without the teacher knowing.
5. **Implied.** Counted numerical marks in Local Gradebook are represented in SchoolCloud as the mark value the teacher intends for that assignment (see Open Questions for raw score versus adjusted result versus percent).
6. **Implied.** Special Local Gradebook statuses that SchoolCloud cannot accept as typed today (at least NHI, and likely exempt/`E`) are handled in a defined way during the push so the transfer does not fail without explanation. The teacher can see what happened for those students.
7. **Implied.** A failed or partial push leaves Local Gradebook unchanged. SchoolCloud only receives marks the teacher confirmed for that action, or the teacher is shown clearly which SchoolCloud cells were updated and which were not.
8. **Implied.** The teacher remains able to mark and edit entirely inside Local Gradebook when SchoolCloud is unavailable. Integration is an optional hand-off, not a requirement for day-to-day marking.
9. **Implied.** Student and mark data used for the transfer stay under the teacher’s control on their machine except for the marks the teacher explicitly sends into SchoolCloud.
10. **Requested (broader sync, if accepted).** Beyond a single-assignment mark dump, the teacher can keep Local Gradebook and SchoolCloud aligned for the data the product chooses to synchronise. Until the open questions on scope and direction are answered, this remains a goal statement rather than a detailed behaviour list.

## Non-functional Requirements

1. **Implied.** The integration respects Local Gradebook’s local-first boundary: SchoolCloud does not become the system of record for the teacher’s working gradebook unless the teacher chooses a sync model that says otherwise.
2. **Implied.** Mark transfer is something the teacher initiates or clearly controls. Background silent writes into SchoolCloud without teacher intent are out of scope until accepted.
3. **Implied.** Errors from SchoolCloud (including rejection of special values) are visible to the teacher in plain language.
4. **Implied.** The solution must work with the teacher’s normal SchoolCloud workflow in the browser they already use for SchoolCloud, unless a different supported path is accepted later.

## Business Rules

1. Local Gradebook remains the place where the teacher enters and adjusts day-to-day marks, including exempt, NHI, unmarked notes, and adjustments, unless a later sync model says otherwise.
2. SchoolCloud remains the school’s official SIS for whatever marks that school requires there. This feature does not replace SchoolCloud’s reporting or PASI obligations.
3. A Local Gradebook piece of work and a SchoolCloud assignment are different records until the teacher links them for a transfer.
4. Special statuses mean what they already mean in Local Gradebook: exempt is left out of averages; NHI counts as zero; unmarked has no counted score. What SchoolCloud stores for those cases is defined by the answers to the open questions, not by inventing new Local Gradebook statuses.
5. Adjustments affect the Local Gradebook percent. Whether the transferred mark is the raw score, the adjusted effective score, or a percent is a product decision (Open Questions).
6. Parent records, student notes, class notes, category notes, work notes, assessment notes, excuses, and goal marks are not part of the minimum assignment mark dump unless a broader sync scope is accepted later.

## Acceptance Criteria

1. Given a Local Gradebook class with enrolled students and counted marks on one piece of work, when the teacher runs the SchoolCloud transfer for that work against a linked SchoolCloud assignment, those students’ marks appear in SchoolCloud for that assignment without the teacher typing each score into SchoolCloud by hand.
2. When the teacher selects a piece of work for transfer, marks from other pieces of work are not written to SchoolCloud as part of that action.
3. Before marks are written, the teacher can see which Local Gradebook work and which SchoolCloud assignment are paired for the action.
4. When a student’s Local Gradebook assessment is NHI (and, once decided, other special statuses SchoolCloud rejects), the transfer does not fail silently: either a defined SchoolCloud value is written, or that student is skipped and reported, according to the accepted rule.
5. After a partial failure, Local Gradebook still has the original marks, and the teacher can see which SchoolCloud updates succeeded and which did not.
6. The teacher can continue marking in Local Gradebook with no SchoolCloud connection.
7. No SchoolCloud write happens for an assignment until the teacher takes the transfer action for that pairing (unless a later accepted sync model changes this).

## Edge Cases

1. A Local Gradebook student who cannot be matched to a SchoolCloud student for that class list.
2. A SchoolCloud student who has no matching Local Gradebook enrolment for that class.
3. Missing Local Gradebook mark on the chosen work (no assessment, or unmarked note only).
4. Exempt assessment with a stored score, exempt with no score (`E`), NHI, and counted zero.
5. Assessments with adjustments, so the raw score and the effective percent differ.
6. Work maximum in Local Gradebook that does not match the SchoolCloud assignment’s maximum.
7. Duplicate or ambiguous name matches between Local Gradebook and SchoolCloud student lists.
8. Teacher changes a mark in Local Gradebook after a successful push and has not pushed again.
9. Teacher changes a mark in SchoolCloud after a push from Local Gradebook.
10. SchoolCloud UI or validation rejects a value mid-batch after some students have already been updated.
11. Local Gradebook is not running when the teacher is in SchoolCloud, or SchoolCloud is unreachable when the teacher is in Local Gradebook.
12. Class roster differences after students were added or removed in only one system.

## Out of Scope

1. Replacing SchoolCloud as the school SIS, or implementing PASI reporting inside Local Gradebook.
2. Importing the full SchoolCloud gradebook into Local Gradebook as the first required outcome (broader two-way sync is an open product question, not the minimum dump).
3. Syncing parents, notes, excuses, goal marks, grade distributions, rainclouds, or individual reports.
4. Building a public multi-tenant cloud service that hosts teacher gradebooks.
5. Deciding Chrome Web Store approval strategy or extension packaging as a requirement. A browser extension is a stakeholder suggestion, not a mandated architecture.
6. Supporting SIS products other than SchoolCloud in this issue.
7. Changing Local Gradebook mark maths, special-status meaning, or the local SQLite schema solely to mirror SchoolCloud’s storage model.

## Suggested Improvements

1. **User experience.** After a push, show a short summary of how many marks were written, skipped (with reason), and failed. That reduces the risk of silent roster mismatches when names differ between systems.
2. **User experience.** Let the teacher preview the exact value that would be written for each student (including how NHI / exempt / adjusted marks map) before confirming. SchoolCloud’s sensitivity to special values makes a dry run valuable.
3. **Technical.** Persist a teacher-approved mapping between a Local Gradebook work and a SchoolCloud assignment, and between students when automatic matching is ambiguous, so repeated dumps for the same class do not require re-linking every time.
4. **Technical.** Prefer a narrow, teacher-triggered export of one work’s marks over a standing open connection that can write arbitrary gradebook data, unless a later security review accepts a local bridge. That keeps the local-first and least-privilege posture aligned with the existing IPC boundary.
5. **User experience.** Make “push this work to SchoolCloud” reachable from the class grade table or the work’s existing surfaces, so the teacher does not have to leave the marking workflow to find the integration.
6. **Technical.** If a local bridge to a running Gradebook instance is accepted later, keep it loopback-only and scoped to read the marks needed for the confirmed push, consistent with the development HTTP API’s existing “no generic SQL” rule.

## Open Questions

1. **High.** Is the first shippable outcome only “dump marks for one chosen assignment into SchoolCloud”, or is two-way / ongoing synchronisation required in the same delivery?
2. **High.** What value should be written into SchoolCloud for a counted mark: raw score, score after adjustments, percent, or something SchoolCloud-specific?
3. **High.** How should NHI, exempt (`E` / greyed exempt score), unmarked, and missing assessments be represented in SchoolCloud when SchoolCloud rejects or mishandles those special values?
4. **High.** How are Local Gradebook works matched to SchoolCloud assignments, and how are students matched (manual link, name/email match, saved mapping, or something else)?
5. **High.** What should happen for students present in only one of the two systems for that class?
6. **Medium.** Is the Chrome extension the required delivery vehicle, or only a suggestion? Are other paths (in-app export the teacher pastes, local helper, documented manual workflow) acceptable for v1?
7. **Medium.** Can / should an extension or helper talk to a running Local Gradebook instance (Zotero-style local bridge), and if so what is allowed to be read or written?
8. **Medium.** How difficult is Chrome Web Store (or enterprise) approval for the intended distribution, and does this product need store listing for a single-teacher or small-alpha audience?
9. **Medium.** Direction after a conflict: if SchoolCloud and Local Gradebook disagree on a mark, which wins, or is the teacher always forced to choose?
10. **Low.** Which browsers must be supported for the SchoolCloud side (Chrome only, or Edge/Chromium as well)?

## Assumptions

1. “SchoolCloud” in issue 59 means the Alberta SIS the teacher already uses for official marks, not a different product with a similar name.
2. “Synchronize the data” and “marks from gradebook should be dumped into schoolcloud for a certain assignment” describe the same problem at two levels of ambition. The assignment mark dump is the minimum requested outcome; full synchronisation is desired but not specified.
3. The Chrome extension named in the issue title is a **non-binding stakeholder suggestion**, not a mandatory architecture. Planning may choose another delivery shape if it still meets the mark-transfer outcome.
4. “Special values (e.g. NHI) that schoolcloud seems to choke on” means SchoolCloud’s grade entry rejects or mishandles at least some non-numeric or special Local Gradebook statuses. The exact SchoolCloud behaviour still needs confirmation during planning or a short spike.
5. Local Gradebook does not already store SchoolCloud IDs for students, classes, or assignments.
6. Suggested improvements above are proposals only until the human accepts them into Functional Requirements.
7. Existing third-party SchoolCloud browser extensions that only enhance SchoolCloud’s own UI are unrelated products; this issue is about connecting Local Gradebook marks to SchoolCloud.
