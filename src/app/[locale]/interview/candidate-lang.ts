// Candidate-facing interview language - deliberately separate from the
// next-intl `[locale]` routing system (that covers the marketing site,
// auth, and admin/business dashboards, selected by whoever is browsing
// that URL). This flow is driven by session.ui_language instead, since the
// browser here belongs to the candidate taking a specific interview, and
// that interview's language was chosen by the admin/config, not by the
// candidate's own browser locale.
import { buildCandidateStrings } from "./candidate-builders";
import arMessages from "./locales/ar.json";

// A lowercase LANGUAGES key: "en" and "ar" are built in below; every other
// language is registered once its bundle loads (see candidate-messages.ts).
export type CandidateLanguage = string;

export function resolveCandidateLanguage(uiLanguage?: string | null): CandidateLanguage {
  const key = (uiLanguage ?? "").toLowerCase();
  if (DICTIONARIES[key]) return key;
  return key === "ar" ? "ar" : "en";
}

const RTL_LANGUAGES = ["ar", "ur"];

export function candidateDir(language: CandidateLanguage): "rtl" | "ltr" {
  return RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";
}

interface CandidateStrings {
  common: {
    retry: string;
    continueLabel: string;
  };
  precheck: {
    preparing: string;
    liveCallBanner: string;
    consent: {
      title: string;
      paragraph1: string;
      paragraph2: string;
      signLabel: string;
      namePlaceholder: string;
      agreeLabel: string;
      submitLabel: string;
      errorGeneric: string;
    };
    privacy: {
      title: string;
      paragraph1: string;
      paragraph2: string;
      paragraph3: string;
      paragraph4: string;
      paragraph5: string;
      ackLabel: string;
      submitLabel: string;
      errorGeneric: string;
    };
    deviceCheck: {
      title: string;
      subtitle: string;
      testButton: string;
      checking: string;
      passedMessage: string;
      continueButton: string;
      failedMessage: string;
      retryButton: string;
      errorGeneric: string;
    };
    verbalConfirmation: {
      title: string;
      subtitle: string;
      subtitleNote: string;
      statementLabel: string;
      phrase: string;
      listenButton: string;
      stopListening: string;
      audioUnavailable: string;
      info: string;
      micDenied: string;
      startButton: string;
      recording: (seconds: number) => string;
      stopButton: string;
      retryButton: string;
      submitButton: string;
      errorGeneric: string;
    };
  };
  identity: {
    loading: string;
    unavailableTitle: string;
    unavailableParagraph1: string;
    unavailableParagraph2: string;
    setupFailedTitle: string;
    setupFailedBody: string;
    retryButton: string;
    title: string;
    subtitle: string;
    cameraError: string;
    youLabel: string;
    idOnFileLabel: string;
    startCameraButton: string;
    capturePhotoButton: string;
    verifyingLabel: (seconds: number) => string;
    preparingLabel: string;
    noFaceTitle: string;
    noFaceMessage: string;
    identificationFailedTitle: string;
    multipleFacesMessage: string;
    verifiedTitle: string;
    matchPassed: (score: number) => string;
    matchFailed: (score: number) => string;
    continueButton: string;
    tipsTitle: string;
    tips: string[];
  };
  orientation: {
    steps: { title: string; description: string }[];
    skip: string;
    next: string;
    start: string;
  };
  interviewPage: {
    notReadyTitle: string;
    notReadyBody: string;
    scheduledTitle: string;
    scheduledBody: (formattedDateTime: string | null) => string;
    pausedTitle: string;
    pausedBody: string;
    terminatedTitle: string;
    terminatedBody: string;
    expiredTitle: string;
    inactiveTitle: string;
    cancelledMessage: (reason: string) => string;
    expiredMessage: string;
    genericUnavailableMessage: string;
    completedTitle: string;
    completedMessage: (roleName: string | null) => string;
    errorTitle: string;
    interviewTitle: (roleName: string) => string;
    answeringInLabel: string;
    recordAnswerButton: string;
    typeAnswerButton: string;
    audioUnavailableMessage: (languageLabel: string) => string;
    thisLanguage: string;
    submitAnswerError: string;
    submitRecordingError: string;
    loadQuestionError: string;
    startError: string;
    uploadingLabel: string;
    missingLinkError: string;
    notFoundError: string;
  };
  questionCard: {
    questionOf: (n: number, total: number) => string;
    domainLabel: (domain: string) => string;
    skillTagLabel: (skill: string) => string;
    readAloudTitle: string;
    listenTitle: string;
    audioUnavailable: string;
  };
  answerRecorder: {
    micError: string;
    tapToRecord: string;
    recordingLabel: (time: string) => string;
    stopButton: string;
    reRecordButton: string;
    submitButton: string;
  };
  answerTextForm: {
    placeholder: string;
    submitButton: string;
  };
  integrityMonitor: {
    problemLabels: {
      NO_FACE_DETECTED: string;
      MULTIPLE_FACES_DETECTED: string;
      CAMERA_UNAVAILABLE: string;
    };
    willBeFlagged: (label: string, secondsLeft: number) => string;
  };
  testTimer: {
    remaining: (mm: number, ss: string) => string;
    warning5Min: string;
    warning1Min: string;
    warning30Sec: string;
  };
  liveCallRoom: {
    missingSessionId: string;
    callEnded: string;
    callEndedMessage: string;
    returnToDashboard: string;
    couldntJoin: string;
    refreshAndTryAgain: string;
    opensAt: string;
    yourLocalTime: string;
    statusJoining: string;
    statusWaiting: string;
    statusPendingAdmission: string;
    statusReconnecting: string;
    statusConnecting: string;
    candidateWantsToJoin: string;
    letThemIn: string;
    deny: string;
    admit: string;
    manualTranslationActive: string;
    youreEvaluator: string;
    youreCandidate: string;
    manualTranslationLabel: string;
    messageFeed: string;
    isSpeaking: (role: string) => string;
    waitingToFinish: (role: string) => string;
    tapToRecord: string;
    recording: (time: string) => string;
    stop: string;
    reRecord: string;
    sending: string;
    send: string;
    noSegmentsYet: string;
    you: string;
    otherParticipant: string;
    original: string;
    translated: string;
    iSpeak: string;
    iWantToHear: string;
    endCall: string;
    candidateLabel: string;
    evaluatorLabel: string;
  };
  callControlsIntro: {
    recordBeat: string;
    languageBeat: string;
    gotIt: string;
  };
}

const en: CandidateStrings = {
  common: {
    retry: "Retry",
    continueLabel: "Continue",
  },
  precheck: {
    preparing: "Preparing your interview…",
    liveCallBanner: "Live interview — you'll join a video call with your evaluator once you're ready",
    consent: {
      title: "Your Consent",
      paragraph1:
        "You have been invited to complete a workforce-readiness assessment through MeritLense. Taking part is voluntary, and by continuing you confirm that you choose to participate of your own free will.",
      paragraph2:
        "Your responses, audio, and identity-verification data will be processed to conduct this assessment, and the resulting report will be shared with the employer or organization that requested it. MeritLense does not make the hiring decision — the employer does.",
      signLabel: "Signing as",
      namePlaceholder: "Your name is not available - please contact support",
      agreeLabel: "I consent to participate in this assessment and to my data being processed as described above.",
      submitLabel: "Sign & Continue",
      errorGeneric: "Something went wrong saving your consent. Please try again.",
    },
    privacy: {
      title: "Privacy Notice",
      paragraph1:
        "MeritLense collects and processes your spoken and/or written responses (including audio recordings and transcripts where you answer by voice), a photo captured for identity verification, and the scores, indicators, and other outputs our AI-assisted analysis generates from your responses. If your session includes a live video interview, the call itself is not recorded — only your spoken responses are transcribed for evaluation.",
      paragraph2:
        "This data is used to verify your identity, conduct your workforce-readiness assessment, analyze your responses and competency performance, and generate your assessment report and, where applicable, a certificate.",
      paragraph3:
        "Some parts of this assessment use AI and automated analysis to transcribe, translate, and evaluate your responses. Results are decision-support information, not a final decision — the employer or organization that invited you to this assessment remains solely responsible for any hiring decision.",
      paragraph4:
        "MeritLense does not sell your data. Authorized service providers (for example, speech-to-text, translation, and AI-analysis providers) may process your data only as necessary to deliver this assessment service, under appropriate data-protection safeguards. Your results are also shared with the employer or agency that requested this assessment.",
      paragraph5: "Your data is retained according to MeritLense's data retention policy.",
      ackLabel:
        "I confirm that I have read and understood this Privacy Notice and acknowledge that my personal data, including video, audio, transcripts and identity-verification information, will be processed for the purposes described above.",
      submitLabel: "Acknowledge & Continue",
      errorGeneric: "Something went wrong saving your acknowledgement. Please try again.",
    },
    deviceCheck: {
      title: "Camera & Microphone Check",
      subtitle: "We need to confirm your camera and microphone both work before you begin.",
      testButton: "Test Camera & Microphone",
      checking: "Checking devices…",
      passedMessage: "Camera and microphone are working.",
      continueButton: "Continue",
      failedMessage: "We couldn't access both your camera and microphone. Please allow access to both and try again.",
      retryButton: "Retry",
      errorGeneric: "Something went wrong saving your device check. Please try again.",
    },
    verbalConfirmation: {
      title: "Verbal Confirmation",
      subtitle: "Please read the statement below and record your voice.",
      subtitleNote: "This confirms that you are the person completing this assessment.",
      statementLabel: "English (Original)",
      phrase: "I confirm that I am completing this assessment myself and that these are my own answers.",
      listenButton: "Listen in English",
      stopListening: "Stop",
      audioUnavailable: "Audio playback isn't available on this device. Please read the statement on screen.",
      info: "You can listen to the statement, re-record if needed, and then submit to continue.",
      micDenied: "We couldn't access your microphone. Please allow microphone access in your browser and try again.",
      startButton: "Start Recording",
      recording: (seconds) => `Recording… ${seconds}s`,
      stopButton: "Stop Recording",
      retryButton: "Re-record",
      submitButton: "Submit & Continue",
      errorGeneric: "Something went wrong submitting your recording. Please try again.",
    },
  },
  identity: {
    loading: "Preparing identity verification…",
    unavailableTitle: "Identification Failed",
    unavailableParagraph1: "We couldn't find a readable reference photo on file for this session.",
    unavailableParagraph2:
      "Please contact the person who invited you to this interview — your session cannot proceed until this is resolved.",
    setupFailedTitle: "Couldn't load verification",
    setupFailedBody: "This is usually a temporary connection issue. Please check your internet connection and try again.",
    retryButton: "Retry",
    title: "Verify your identity",
    subtitle: "Take a quick photo so we can confirm it's you. You won't be able to start the interview until this passes.",
    cameraError: "Couldn't access your camera. Please allow camera access and try again.",
    youLabel: "You",
    idOnFileLabel: "ID on file",
    startCameraButton: "Start Camera",
    capturePhotoButton: "Capture Photo",
    verifyingLabel: (seconds) => `Verifying identity… ${seconds}s`,
    preparingLabel: "Preparing…",
    noFaceTitle: "No Face Detected",
    noFaceMessage:
      "We couldn't find a clear face in that photo — this isn't a match result, we simply couldn't analyze the image.",
    identificationFailedTitle: "Identification Failed",
    multipleFacesMessage: "More than one person was detected. Please make sure only you are visible, then try again.",
    verifiedTitle: "Identity Verified",
    matchPassed: (score) => `${score.toFixed(0)}% match.`,
    matchFailed: (score) => `${score.toFixed(0)}% match — this doesn't meet the required threshold.`,
    continueButton: "Continue to Interview",
    tipsTitle: "For a successful match:",
    tips: [
      "Face a light source — avoid sitting with a window or light behind you",
      "Look directly at the camera with your full face visible",
      "Remove sunglasses or anything covering your face",
      "Make sure only you are in frame",
    ],
  },
  orientation: {
    steps: [
      {
        title: "Before you begin",
        description: "A quick look at how this interview works — this takes about 20 seconds.",
      },
      {
        title: "Read or listen to each question",
        description: "Every question is shown on screen — tap the speaker icon if you'd rather have it read aloud.",
      },
      {
        title: "Answer by voice or by typing",
        description: "Choose whichever feels natural — you can switch between recording and typing on any question.",
      },
      {
        title: "Keep an eye on the timer",
        description:
          "Your remaining time is always visible at the top of the page — the interview submits automatically when it runs out.",
      },
      {
        title: "You're all set",
        description: "Answer at your own pace within the time limit. Good luck!",
      },
    ],
    skip: "Skip",
    next: "Next",
    start: "Start Test",
  },
  interviewPage: {
    notReadyTitle: "Your interview isn't ready yet",
    notReadyBody:
      "Please contact the person who invited you to this interview — they'll need to start your session before you can begin.",
    scheduledTitle: "Your interview is scheduled",
    scheduledBody: (formattedDateTime) =>
      (formattedDateTime
        ? `This interview will begin on ${formattedDateTime} (your device's local time).`
        : "This interview hasn't started yet.") +
      " This page will continue automatically once it's time — you can leave it open, or come back later.",
    pausedTitle: "Interview paused",
    pausedBody:
      "We noticed more than one person in view. Please make sure you're alone in front of the camera — your interview will resume automatically.",
    terminatedTitle: "Interview ended",
    terminatedBody:
      "This interview was ended due to repeated integrity violations. Please contact the person who invited you if you believe this is a mistake.",
    expiredTitle: "This interview link has expired",
    inactiveTitle: "This interview link is no longer active",
    cancelledMessage: (reason) => `This interview was cancelled: ${reason}`,
    expiredMessage: "Please contact the person who invited you to request a new link.",
    genericUnavailableMessage: "This session has expired or is no longer available.",
    completedTitle: "Interview complete",
    completedMessage: (roleName) =>
      `Thank you${roleName ? ` for completing your ${roleName} interview` : ""}. Your responses have been submitted.`,
    errorTitle: "Something went wrong",
    interviewTitle: (roleName) => `${roleName} Interview`,
    answeringInLabel: "Answering in:",
    recordAnswerButton: "Record Answer",
    typeAnswerButton: "Type Answer",
    audioUnavailableMessage: (languageLabel) => `Audio answers aren't available in ${languageLabel} yet — please type your answer.`,
    thisLanguage: "this language",
    submitAnswerError: "Failed to submit your answer. Please try again.",
    submitRecordingError: "Failed to submit your recording. Please try again.",
    loadQuestionError: "Something went wrong loading your next question. Please refresh the page.",
    startError: "Your interview couldn't be started. Please refresh the page or contact the person who invited you.",
    uploadingLabel: "Uploading & transcribing…",
    missingLinkError: "This interview link is missing required information.",
    notFoundError: "We couldn't find this interview session. The link may be invalid.",
  },
  questionCard: {
    questionOf: (n, total) => `Question ${n} of ${total}`,
    domainLabel: (domain) => `Domain: ${domain}`,
    skillTagLabel: (skill) => `Skill Tag: ${skill}`,
    readAloudTitle: "Read-aloud language",
    listenTitle: "Listen to question",
    audioUnavailable: "Audio isn't available for this question right now. Please read the question on screen.",
  },
  answerRecorder: {
    micError: "Couldn't access your microphone. Please allow microphone access and try again.",
    tapToRecord: "Tap to record your answer",
    recordingLabel: (time) => `Recording… ${time}`,
    stopButton: "Stop",
    reRecordButton: "Re-record",
    submitButton: "Submit Answer",
  },
  answerTextForm: {
    placeholder: "Type your answer here...",
    submitButton: "Submit Answer",
  },
  integrityMonitor: {
    problemLabels: {
      NO_FACE_DETECTED: "We can't see you",
      MULTIPLE_FACES_DETECTED: "Multiple faces detected",
      CAMERA_UNAVAILABLE: "Your camera appears to be off or unavailable",
    },
    willBeFlagged: (label, secondsLeft) => `${label} — this will be flagged as an integrity violation in ${secondsLeft}s unless resolved.`,
  },
  testTimer: {
    remaining: (mm, ss) => `${mm}:${ss} remaining`,
    warning5Min: "5 minutes remaining",
    warning1Min: "1 minute remaining",
    warning30Sec: "30 seconds remaining",
  },
  liveCallRoom: {
    missingSessionId: "Missing session ID.",
    callEnded: "Call ended",
    callEndedMessage: "This live interview call has ended.",
    returnToDashboard: "Return to dashboard",
    couldntJoin: "Couldn't join the call",
    refreshAndTryAgain: "Please refresh and try again.",
    opensAt: "This call opens 15 minutes before its scheduled time:",
    yourLocalTime: "(your local time).",
    statusJoining: "Joining the call…",
    statusWaiting: "Waiting for the other participant to join…",
    statusPendingAdmission: "Waiting for the evaluator to let you in…",
    statusReconnecting: "Reconnecting…",
    statusConnecting: "Connecting…",
    candidateWantsToJoin: "Candidate wants to join",
    letThemIn: "Let them into the interview?",
    deny: "Deny",
    admit: "Admit",
    manualTranslationActive: "Manual translation mode is active",
    youreEvaluator: "You're the evaluator",
    youreCandidate: "You're the candidate",
    manualTranslationLabel: "Manual translation",
    messageFeed: "Message feed",
    isSpeaking: (role) => `${role} is speaking…`,
    waitingToFinish: (role) => `Waiting for ${role} to finish…`,
    tapToRecord: "Tap to record a turn",
    recording: (time) => `Recording… ${time}`,
    stop: "Stop",
    reRecord: "Re-record",
    sending: "Sending…",
    send: "Send",
    noSegmentsYet: "Record a speaking turn to send it to the other participant in their language.",
    you: "You",
    otherParticipant: "Other participant",
    original: "Original",
    translated: "Translated",
    iSpeak: "I speak",
    iWantToHear: "I want to hear",
    endCall: "End Call",
    candidateLabel: "Candidate",
    evaluatorLabel: "Evaluator",
  },
  callControlsIntro: {
    recordBeat: "Tap here to record your turn when it's your turn to speak.",
    languageBeat: "Set the language you speak and the one you want to hear here.",
    gotIt: "Got it",
  },
};

// Arabic lives in locales/ar.json like every other language, so it can be
// reviewed and corrected without touching code.
const ar: CandidateStrings = buildCandidateStrings(arMessages);

const DICTIONARIES: Record<CandidateLanguage, CandidateStrings> = { en, ar };

/** Adds a bundled language once it has loaded (candidate-messages.ts). */
export function registerCandidateStrings(language: CandidateLanguage, strings: CandidateStrings) {
  DICTIONARIES[language] = strings;
}

export function getCandidateStrings(uiLanguage?: string | null): CandidateStrings {
  return DICTIONARIES[resolveCandidateLanguage(uiLanguage)];
}

export type { CandidateStrings };
