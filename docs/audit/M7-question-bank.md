# M7 question bank intake

## BNS Test-1

The server-side source snapshot stores 25 Bharatiya Nyaya Sanhita questions with stable IDs and original option order. On 26 November 2026, the user supplied questions 1–18 and 20–25. Those 24 entries match the stored snapshot apart from line wrapping and the difference recorded below. [Source form](https://forms.gle/uDXmfLzNhKAwXEkw7) · [Server-side snapshot](../../lib/server/vls-banks.json)

- Question 1 (`bns-396923611`), option d, reads `Mischie` in the pasted copy and `Mischief` in the stored snapshot. The snapshot spelling is retained pending source confirmation.
- Question 19 (`bns-2012210995`) appears in the stored snapshot and was omitted from the pasted copy. It is retained pending source confirmation.
- All 25 answer keys are pending. The questions remain ineligible for production assignment until their keys are verified and faculty approves them.

## Property Law TEST

All 20 questions supplied by the user match the server-side snapshot after ignoring Markdown formatting and whitespace. The wording, four options per question, original option order, and stable IDs are preserved. All 20 records are awaiting verified answer keys and remain ineligible for production assignment. [Source form](https://forms.gle/Z3MkZiWjhpTRAd1Z7) · [Server-side snapshot](../../lib/server/vls-banks.json)

- Questions 6 (`property-960801775`) and 19 (`property-1476177619`) ask the same lease question with different distractors. Both source records are preserved. Faculty should choose which one to approve for selection.

## Family Law · VLS Law Academy – Bootcamp Assessment

The user supplied 20 numbered questions and confirmed that each has Yes and No options. Source snapshot version `vls-source-2026-11-26.2` preserves the supplied wording, removes paste formatting, and uses stable IDs based on the original numbering. All keys are pending. [Source form](https://forms.gle/2aNwTv6AXWpV291F8) · [Server-side snapshot](../../lib/server/vls-banks.json)

- Faculty should confirm which questions belong in the Family Law bank. Several items concern criminal procedure, company law, tax, or general court procedure. Review the wording in Q2 and Q6 and confirm the legal references in Q7 and Q12 before approval.
- The assignment and submission paths support two-option and four-option questions. Family Law keeps Yes followed by No.

## Submission without scoring

The app saves registration before opening the assessment. With answer collection enabled, it assigns three questions per bank and saves the display order. It excludes the unconfirmed BNS Q19 and uses Property Law Q6 for the repeated lease question. The score and qualification status are deferred.

The updated [Apps Script](../../scripts/google-sheet-intake.gs) appends **Question 1** through **Question 9** after the existing registration columns. Each cell holds the question shown and the selected answer on separate lines. Final submission updates the existing registration row by Request ID. The app shows confirmation after Sheets acknowledges the update. If delivery fails, the saved answers can be retried and a matching retry is accepted without a second row.

For isolated staging, copy the updated script into the authorised Apps Script project, keep its `SPREADSHEET_ID` and `INTAKE_TOKEN` properties, and run `setup()` against the staging spreadsheet. Configure the staging web app URL and token using `DOP_GOOGLE_SHEETS_URL` and `DOP_GOOGLE_SHEETS_TOKEN`.

For Vercel Preview, connect an isolated Neon database or branch, then run [the attempt table migration](../../scripts/dop-assessment-postgres.sql) in its SQL editor. Keep the pooled `DATABASE_URL` server-side. Enable `DOP_UNSCORED_ASSESSMENT=1` for Preview and verify registration, refresh and resume, and the nine answers on the original Sheet row. Production activation requires running the same migration on the approved production database, enabling the production flag, and separately authorising a deployment. Vercel does not use `DOP_ASSESSMENT_STORE`. The existing local SQLite store remains available for loopback and persistent Node hosts. Receipt-only registrations in Google Sheets do not have assessment attempts to migrate.

Nine automated tests, ESLint, TypeScript, and the Apps Script syntax check passed. A spreadsheet service mock verified the Question 1–9 cell layout, row matching, validation, and idempotent retries.

The production build passed with a reduced Node heap limit. Chromium verified landing page layout, images, anchors, and console output at eight widths from 320px to 1920px, with axe checks at 390px and 1440px. The focused loopback run passed registration retry, attribution, nine-question navigation, refresh and resume, submission, and the score-free confirmation. It also exercised the testimonial carousel and dialog by keyboard. The browser checks use fixtures. An authorised Google-hosted staging check remains pending. No live writes were made.

The Postgres migration and storage adapter passed an isolated check using a local PostgreSQL engine with the Neon HTTP transport intercepted. It verified concurrent registration deduplication, stable questions on resume, all nine answers, and acknowledgement state. The Vercel Preview connection and Sheet delivery still need an end-to-end staging check.
