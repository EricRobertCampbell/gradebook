# Requirements

Source: [GitHub issue 33](https://github.com/EricRobertCampbell/gradebook/issues/33) — “Ability to add notes to a student’s assessment”.

## Objective

A teacher can record a note that belongs to one student and one assessment, see on the grade table which assessments have a note, save that note before there is a counted mark, keep it when the mark is cleared, and read the note again later in the gradebook. The individual report does not include that note.

## Background

The teacher uses a local desktop gradebook. Marking happens on the class grade table (`#/<school-year-id>/<class-id>`). Each cell is one student’s result on one piece of work. The pencil on that cell opens the assessment editor, which saves the score, date, weight, status, and notes, and lists adjustments. The individual report (`#/<student-id>/<class-id>/individualreport`) prints that student’s results for the class.

Several different notes already exist:

| Note             | Belongs to                           | Where the teacher edits it                             |
| ---------------- | ------------------------------------ | ------------------------------------------------------ |
| Student notes    | The student, across classes          | Student settings                                       |
| Class notes      | The class                            | Class settings                                         |
| Category notes   | The unit, for every student          | Grading structure                                      |
| Work notes       | The piece of work, for every student | Grading structure                                      |
| Assessment notes | One student on one piece of work     | Assessment editor                                      |
| Adjustment notes | One adjustment on that assessment    | Assessment editor; a percent or raw change is required |

Assessment notes are already stored on the assessment row (`assessments.notes`), one row per student per piece of work. The assessment editor includes a Notes field and saves it with the assessment. On update, omitting notes keeps the stored text. Typing a mark straight into the grade table saves the score without sending notes, so an existing note stays. The individual report prints the assessment note under the work name, in the same line as the work’s own notes and each adjustment’s description.

The grade table shows the mark, the percent, and a marker when adjustments exist. The assessment editor is where the teacher sees the assessment note.

Counted assessments require a mark before they can be saved. Exempt and not-handed-in assessments can be saved without a counted score. Emptying a grade-table cell deletes that assessment. Adjustments are removed with it, and so is the assessment note.

## Functional Requirements

1. **Requested.** The teacher can add note text for one student on one assessment.
2. **Requested.** That note is specific to that student and that piece of work. Other students’ assessments for the same work stay unchanged.
3. **Implied.** The teacher can read the note again after leaving and returning to the class.
4. **Implied.** The teacher can change the note and can clear it.
5. **Implied.** Saving, changing, or clearing the note leaves the score, status, weight, and computed percent unchanged, except where the teacher edits those fields in the same action.
6. **Implied.** The note is kept in the local gradebook with the rest of the teacher’s data, including a database copy saved from Database operations.
7. **Implied.** Deleting the assessment, the piece of work, or the student removes that note with the record it belongs to.
8. **Requested.** On the class grade table, the teacher can see which assessments have a note without opening the assessment editor.
9. **Requested.** The teacher can save a note when the assessment has no counted mark, and can add the counted mark later. The note remains when that mark is saved.
10. **Implied.** An empty note does not show as a note on the grade table.
11. **Implied.** Saving a note with no counted mark does not create a counted score or a percent for that assessment.
12. **Requested.** Clearing the mark on the grade table removes that mark and leaves the note.
13. **Implied.** After that clear, the grade table still shows that a note exists, and the cell has no counted mark and no percent from that assessment.
14. **Requested.** Clearing the mark on the grade table also removes that assessment’s adjustments.
15. **Implied.** After that clear, the grade table no longer shows an adjustment marker for that cell.
16. **Requested.** The individual report does not show the student’s assessment note.
17. **Requested.** Saving an assessment note removes leading and trailing whitespace, in the same way as category, work, and adjustment notes.
18. **Implied.** A note that is empty after trimming is an empty note. It does not show as a note on the grade table.
19. **Requested.** Each student has one note on each assessment.

## Non-functional Requirements

- The note stays on the teacher’s machine with the rest of the gradebook. It is student data and is handled with the same local-only boundary as names, marks, and other notes.
- The teacher can read and write the note offline.

## Business Rules

- An assessment is one student’s result on one piece of work. The note attaches to that result.
- Work notes and category notes describe the grading structure for the whole class. They are separate from this note.
- Adjustment notes describe a mark change. They stay separate from the assessment note, and they still require a percent change, a raw change, or both.
- Percent calculations ignore the note.
- Clearing the grade-table mark removes the mark and that assessment’s adjustments. The note stays.
- The individual report can still show category notes, work notes, and adjustment details. It leaves out the student’s assessment note.
- One student has one note on one assessment. There is no history of earlier notes.

## Acceptance Criteria

- Given a class with two enrolled students and one piece of work, when the teacher saves a note on the first student’s assessment, the second student’s assessment for that work has no copy of that note.
- When the teacher leaves the class and opens it again, the same note is still on that student’s assessment.
- When the teacher replaces the note text and saves, the assessment shows the new text.
- When the teacher clears the note text and saves, the assessment has no note text, and the mark is unchanged.
- When the teacher saves a mark from the grade-table cell on an assessment that already has a note, the note is still there afterwards.
- A saved database copy still contains the note.
- When the teacher saves a non-empty note, the grade table shows that this student has a note on that piece of work, without opening the assessment editor.
- When the teacher clears that note and saves, the grade table no longer shows a note on that cell.
- When the teacher saves a note and leaves the counted mark empty, the note is kept, the grade table shows the note, and that cell has no counted mark and no percent from that assessment.
- When the teacher later saves a counted mark on that assessment, the note is still present and the grade table still shows that a note exists.
- When an assessment has a note and a mark, and the teacher clears that mark on the grade table, the mark is gone, the note text is unchanged, and the grade table still shows that a note exists.
- After that clear, the cell has no counted mark and no percent from that assessment.
- When that assessment also has adjustments, those adjustments are gone after the mark is cleared, and the grade table no longer shows an adjustment marker for that cell.
- The individual report for that student does not include the assessment note. Category notes, work notes, and adjustment details on that report still appear as they do today.
- When the teacher saves an assessment note with spaces before or after the text, the stored note has those spaces removed.
- When the teacher saves a note that is only spaces, the assessment has no note text, and the grade table does not show a note for that cell.

## Edge Cases

- A note may be empty. An empty note means the teacher has not recorded one.
- Exempt and not-handed-in assessments can carry a note.
- A note may be long. The teacher can still read the full text where the note is edited.
- A note that is only whitespace is empty after trimming, so the grade table does not show a note.
- A note saved with no counted mark still shows on the grade table.
- Clearing the note text removes that grade-table indication. The counted mark, when one exists, stays as it was. Adjustments stay as they were, because the mark was not cleared.
- Clearing a counted mark, an exempt mark, or a not-handed-in mark on the grade table leaves the note and removes that assessment’s adjustments.
- Clearing a mark when the assessment has no note still removes that assessment, including its adjustments.
- The individual report omits the assessment note even when the grade table shows that the note exists.

## Out of Scope

- Changing student, parent, class, category, or work notes, and changing the text of an adjustment note. Removing an adjustment when its assessment mark is cleared is in scope.
- Sending the note to students, parents, or any service outside the machine.
- Rich text, attachments, a comment thread, or several notes over time on the same assessment.

## Suggested Improvements

None. The earlier proposals have been accepted or declined.

## Open Questions

None.

## Assumptions

- “A student’s assessment” means that student’s result on a piece of work, which matches “student-specific”. Category, sub-category, and work notes belong to the class grading structure.
- The teacher is the only reader. Notes stay in the local database with other student data.
- The note is plain text.
- “Don’t show notes on the individual report” means the student’s assessment note. Category notes, work notes, and adjustment details on that report stay.
- The grade-table indication shows that a note exists. The note text stays available in the assessment editor.
- The issue contains no implementation suggestion.

## Changes

- 2026-10-10: Accepted the previous suggested improvements 1 and 2. Moved them into Functional Requirements as **Requested** (the grade table shows which assessments have a note; a note can be saved with no counted mark). Removed them from Suggested Improvements. Added the acceptance criteria and edge cases that follow. Removed the open questions those improvements answered, including the high question about which gap issue 33 should close. The earlier statement that a counted assessment cannot be saved without a mark remains as current behaviour in Background.
- 2026-10-10: Accepted that clearing the grade-table mark keeps the note. Moved that outcome into Functional Requirements as **Requested**. Removed the suggestion that offered either keeping the note or warning before the clear; the warning alternative was not accepted. Removed the open question asking whether the note should be kept. Added the acceptance criteria and edge cases that follow. Left open what happens to adjustments on that assessment.
- 2026-10-10: Accepted three decisions. Clearing the mark also removes that assessment’s adjustments. The individual report does not show the student’s assessment note; the suggestion to present that note separately on the report was declined. Saving an assessment note trims leading and trailing whitespace, the same way as the other note fields; that technical suggestion is now **Requested**. Removed those items from Suggested Improvements and from Open Questions. The earlier edge case that whitespace-only notes are stored as entered no longer applies.
- 2026-10-10: Confirmed one note per student per assessment. Moved that into Functional Requirements as **Requested**. Removed the open question about several notes over time, and recorded several notes, rich text, attachments, and comment threads as out of scope.
