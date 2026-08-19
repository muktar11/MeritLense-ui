# E2E tests

Playwright tests that drive the real UI, by default against the QA environment
(`qa.meritlense.com` / `api-qa.meritlense.com`). This is a starting scaffold,
not full coverage — extend it as features are added.

## Running

```bash
npm ci
npx playwright install --with-deps chromium   # first time only
npm run test:e2e
```

Runs against QA by default. To run against a local dev server instead:

```bash
# terminal 1
npm run dev
# terminal 2, with a local backend running on :8000
QA_BASE_URL=http://localhost:3000 npm run test:e2e
```

`npm run test:e2e:ui` opens Playwright's UI mode for debugging a single spec.

## Login

Tests log in as `qa-admin@meritlense.com` (password `MeritLenseQA2026!` by
default). This account is guaranteed to exist by the
`anonymize_qa_data` management command — see
`api/core/management/commands/anonymize_qa_data.py` in the backend repo.
Override via `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD` if these change.

## Session fixtures

`interview-async.spec.ts` and `live-call.spec.ts` point at specific
session IDs/tokens from whatever production snapshot was last restored into
`meritlense_qa_db` (see `e2e/fixtures.ts`). **These will go stale the next
time QA's data is refreshed** — if those specs start failing, look up a
fresh session ID/token from the QA database and either update the defaults
in `fixtures.ts` or set `QA_ASYNC_SESSION_ID` / `QA_ASYNC_SESSION_TOKEN` /
`QA_LIVE_SESSION_ID` / `QA_LIVE_SESSION_TOKEN` in the environment running
the tests.

## Known limitation: camera/mic capture

Real `getUserMedia` (camera/mic) can't be reliably driven headless in this
environment — confirmed during manual investigation. Specs that would need
an actual in-progress call (recording a turn, exercising the language
dropdowns) are marked `test.skip` with a TODO rather than faked. If you get
this working (e.g. via `--use-fake-device-for-media-stream` in a headed
run), please fill these in and remove this note.

## Language accuracy vs. language UI

`language-coverage.spec.ts` only checks that `src/lib/languages.ts` is
internally consistent (unique codes, valid BCP-47 format, required fields).
It does **not** test whether a given language actually transcribes/
translates correctly — that's a backend/provider concern, covered by a
separate audit script (`stt_language_audit.py`, run from the backend repo
against `SpeechToTextService`/`TextToSpeechService` directly). Don't
conflate the two when deciding what "language support" means for a bug
report.
