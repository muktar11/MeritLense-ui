// Shared fixtures for the QA e2e suite.
//
// QA_ADMIN_* comes from the anonymize_qa_data management command
// (api/core/management/commands/anonymize_qa_data.py), which always
// guarantees this exact login exists after a data refresh - safe to rely
// on without needing per-run setup.
//
// The session fixtures below point at specific rows from the production
// snapshot that was restored into meritlense_qa_db on 2026-08-19. Their
// precheck-progress fields were deliberately reset (identity_verified,
// device_check_completed_at, verbal_confirmation_recorded_at,
// privacy_notice_acknowledged_at) so each starts fresh at "privacy" rather
// than resuming wherever the real candidate had gotten to, and their
// token_expires_at was pushed out ~5 years so they don't go stale just
// from time passing. The live-call fixture's scheduled_start_at is ~90
// days out for the same reason - it must stay outside
// LIVE_CALL_EARLY_JOIN_MINUTES no matter when the suite runs. A future
// data refresh will still very likely change these IDs/tokens entirely -
// override via the env vars if the defaults start failing, rather than
// editing the specs.
export const QA_ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || "qa-admin@meritlense.com";
export const QA_ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD || "MeritLenseQA2026!";

export const ASYNC_SESSION_ID = process.env.QA_ASYNC_SESSION_ID || "107";
export const ASYNC_SESSION_TOKEN =
  process.env.QA_ASYNC_SESSION_TOKEN || "15mNs0vNdmAY2fXJUu32JdTYdM20vSwCUcRMZLxB0GQ";

export const LIVE_CALL_SESSION_ID = process.env.QA_LIVE_SESSION_ID || "119";
export const LIVE_CALL_SESSION_TOKEN =
  process.env.QA_LIVE_SESSION_TOKEN || "x9Ur4Ui2EJvTqwNqt0X6XmnmC4poLLh7TfqNu5vaCe4";
