// Turns a language file (interview/locales/*.json: plain strings with
// {placeholders}) into the CandidateStrings / LanguageStrings the candidate
// page uses. Shared by the built-in Arabic (candidate-lang.ts,
// language-strings.ts) and the languages loaded on demand
// (candidate-messages.ts).
import type { CandidateStrings } from "./candidate-lang";
import type { LanguageStrings } from "./language-strings";

type Step = { title: string; description: string };

export interface CandidateMessages {
  common: CandidateStrings["common"];
  precheck: {
    preparing: string;
    liveCallBanner: string;
    consent: CandidateStrings["precheck"]["consent"];
    privacy: CandidateStrings["precheck"]["privacy"];
    deviceCheck: CandidateStrings["precheck"]["deviceCheck"];
    verbalConfirmation: Omit<CandidateStrings["precheck"]["verbalConfirmation"], "recording"> & { recording: string };
  };
  identity: Omit<CandidateStrings["identity"], "verifyingLabel" | "matchPassed" | "matchFailed"> & {
    verifyingLabel: string;
    matchPassed: string;
    matchFailed: string;
  };
  orientation: { steps: Step[]; skip: string; next: string; start: string };
  interviewPage: Omit<
    CandidateStrings["interviewPage"],
    "scheduledBody" | "cancelledMessage" | "completedMessage" | "interviewTitle" | "audioUnavailableMessage"
  > & {
    scheduledBodyAt: string;
    scheduledBodyPending: string;
    scheduledBodyContinue: string;
    cancelledMessage: string;
    completedMessage: string;
    completedMessageRole: string;
    interviewTitle: string;
    audioUnavailableMessage: string;
  };
  questionCard: Omit<CandidateStrings["questionCard"], "questionOf" | "domainLabel" | "skillTagLabel"> & {
    questionOf: string;
    domainLabel: string;
    skillTagLabel: string;
  };
  answerRecorder: Omit<CandidateStrings["answerRecorder"], "recordingLabel"> & { recordingLabel: string };
  answerTextForm: CandidateStrings["answerTextForm"];
  integrityMonitor: { problemLabels: CandidateStrings["integrityMonitor"]["problemLabels"]; willBeFlagged: string };
  testTimer: Omit<CandidateStrings["testTimer"], "remaining"> & { remaining: string };
  liveCallRoom: Omit<CandidateStrings["liveCallRoom"], "isSpeaking" | "waitingToFinish" | "recording"> & {
    isSpeaking: string;
    waitingToFinish: string;
    recording: string;
  };
  callControlsIntro: CandidateStrings["callControlsIntro"];
  // The site cookie banner, shown over this page (components/app/CookieConsentBanner.tsx).
  cookie: {
    title: string;
    body: string;
    policyLink: string;
    acceptAll: string;
    justThisTime: string;
    reject: string;
    managePreferences: string;
    preferencesTitle: string;
    rejectOptional: string;
    save: string;
    alwaysOn: string;
    close: string;
    necessary: string;
    necessaryDescription: string;
    analytics: string;
    analyticsDescription: string;
    marketing: string;
    marketingDescription: string;
  };
  language: {
    originalLabel: string;
    approvedLabel: string;
    translationLabel: string;
    listenIn: string;
    stop: string;
    showIn: string;
    translating: string;
    translationUnavailable: string;
    audioUnavailable: string;
    yourLanguageTitle: string;
    yourLanguageHint: string;
    howItWorksTitle: string;
    howItWorks: string[];
    audioSupportTitle: string;
    audioSupportBody: string;
    support: LanguageStrings["support"];
    yourAnswerTitle: string;
    yourAnswerHint: string;
    voiceSupported: string;
    voiceUnsupported: string;
    recordingIn: string;
    answerKept: string;
    timeRemaining: string;
    timeContinues: string;
    verbalTranslationLabel: string;
    statementTranslationUnavailable: string;
  };
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

export function buildCandidateStrings(m: CandidateMessages): CandidateStrings {
  const page = m.interviewPage;
  return {
    common: m.common,
    precheck: {
      ...m.precheck,
      verbalConfirmation: {
        ...m.precheck.verbalConfirmation,
        recording: (seconds) => fill(m.precheck.verbalConfirmation.recording, { seconds }),
      },
    },
    identity: {
      ...m.identity,
      verifyingLabel: (seconds) => fill(m.identity.verifyingLabel, { seconds }),
      matchPassed: (score) => fill(m.identity.matchPassed, { score: score.toFixed(0) }),
      matchFailed: (score) => fill(m.identity.matchFailed, { score: score.toFixed(0) }),
    },
    orientation: m.orientation,
    interviewPage: {
      ...page,
      scheduledBody: (dateTime) =>
        `${dateTime ? fill(page.scheduledBodyAt, { dateTime }) : page.scheduledBodyPending} ${page.scheduledBodyContinue}`,
      cancelledMessage: (reason) => fill(page.cancelledMessage, { reason }),
      completedMessage: (roleName) => (roleName ? fill(page.completedMessageRole, { roleName }) : page.completedMessage),
      interviewTitle: (roleName) => fill(page.interviewTitle, { roleName }),
      audioUnavailableMessage: (language) => fill(page.audioUnavailableMessage, { language }),
    },
    questionCard: {
      ...m.questionCard,
      questionOf: (n, total) => fill(m.questionCard.questionOf, { n, total }),
      domainLabel: (domain) => fill(m.questionCard.domainLabel, { domain }),
      skillTagLabel: (skill) => fill(m.questionCard.skillTagLabel, { skill }),
    },
    answerRecorder: { ...m.answerRecorder, recordingLabel: (time) => fill(m.answerRecorder.recordingLabel, { time }) },
    answerTextForm: m.answerTextForm,
    integrityMonitor: {
      problemLabels: m.integrityMonitor.problemLabels,
      willBeFlagged: (label, secondsLeft) => fill(m.integrityMonitor.willBeFlagged, { label, secondsLeft }),
    },
    testTimer: { ...m.testTimer, remaining: (mm, ss) => fill(m.testTimer.remaining, { mm, ss }) },
    liveCallRoom: {
      ...m.liveCallRoom,
      isSpeaking: (role) => fill(m.liveCallRoom.isSpeaking, { role }),
      waitingToFinish: (role) => fill(m.liveCallRoom.waitingToFinish, { role }),
      recording: (time) => fill(m.liveCallRoom.recording, { time }),
    },
    callControlsIntro: m.callControlsIntro,
  };
}

export function buildLanguageStrings(m: CandidateMessages["language"]): LanguageStrings {
  const one = (template: string) => (language: string) => fill(template, { language });
  return {
    ...m,
    originalLabel: one(m.originalLabel),
    approvedLabel: one(m.approvedLabel),
    translationLabel: one(m.translationLabel),
    listenIn: one(m.listenIn),
    showIn: one(m.showIn),
    translationUnavailable: one(m.translationUnavailable),
    audioUnavailable: one(m.audioUnavailable),
    yourAnswerTitle: one(m.yourAnswerTitle),
    yourAnswerHint: one(m.yourAnswerHint),
    voiceSupported: one(m.voiceSupported),
    voiceUnsupported: one(m.voiceUnsupported),
    recordingIn: one(m.recordingIn),
    verbalTranslationLabel: one(m.verbalTranslationLabel),
    statementTranslationUnavailable: one(m.statementTranslationUnavailable),
  };
}
