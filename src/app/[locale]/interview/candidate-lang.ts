// Candidate-facing interview language - deliberately separate from the
// next-intl `[locale]` routing system (that covers the marketing site,
// auth, and admin/business dashboards, selected by whoever is browsing
// that URL). This flow is driven by session.ui_language instead, since the
// browser here belongs to the candidate taking a specific interview, and
// that interview's language was chosen by the admin/config, not by the
// candidate's own browser locale.
export type CandidateLanguage = "en" | "ar";

export function resolveCandidateLanguage(uiLanguage?: string | null): CandidateLanguage {
  return (uiLanguage ?? "").toUpperCase() === "AR" ? "ar" : "en";
}

export function candidateDir(language: CandidateLanguage): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
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
      phrase: string;
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
      signLabel: "Type your full name to sign",
      namePlaceholder: "Your full name",
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
      subtitle: "Please read the following out loud and record yourself saying it:",
      phrase: "I confirm that I am the person completing this interview and that my answers are my own.",
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

const ar: CandidateStrings = {
  common: {
    retry: "إعادة المحاولة",
    continueLabel: "متابعة",
  },
  precheck: {
    preparing: "جارٍ تجهيز مقابلتك…",
    liveCallBanner: "مقابلة مباشرة — ستنضم إلى مكالمة فيديو مع المقيّم بمجرد استعدادك",
    consent: {
      title: "موافقتك",
      paragraph1:
        "لقد تمت دعوتك لإكمال تقييم جاهزية القوى العاملة عبر منصة ميريت لينس. المشاركة اختيارية، وبمتابعتك فإنك تؤكد أنك تختار المشاركة بمحض إرادتك.",
      paragraph2:
        "سيتم معالجة إجاباتك، والتسجيلات الصوتية، وبيانات التحقق من الهوية لإجراء هذا التقييم، وسيتم مشاركة التقرير الناتج مع صاحب العمل أو الجهة التي طلبت هذا التقييم. لا تتخذ ميريت لينس قرار التوظيف — يبقى ذلك من مسؤولية صاحب العمل.",
      signLabel: "اكتب اسمك الكامل للتوقيع",
      namePlaceholder: "اسمك الكامل",
      agreeLabel: "أوافق على المشاركة في هذا التقييم وعلى معالجة بياناتي كما هو موضح أعلاه.",
      submitLabel: "التوقيع والمتابعة",
      errorGeneric: "حدث خطأ أثناء حفظ موافقتك. يُرجى المحاولة مرة أخرى.",
    },
    privacy: {
      title: "إشعار الخصوصية",
      paragraph1:
        "تقوم ميريت لينس بجمع ومعالجة إجاباتك المنطوقة و/أو المكتوبة (بما في ذلك التسجيلات الصوتية والنصوص المفرغة عند الإجابة صوتيًا)، وصورة يتم التقاطها للتحقق من الهوية، والدرجات والمؤشرات وغيرها من المخرجات التي يولدها تحليلنا المعتمد على الذكاء الاصطناعي من إجاباتك. إذا تضمنت جلستك مقابلة فيديو مباشرة، فإن المكالمة نفسها لا تُسجَّل — تُفرَّغ إجاباتك المنطوقة فقط لأغراض التقييم.",
      paragraph2:
        "تُستخدم هذه البيانات للتحقق من هويتك، وإجراء تقييم جاهزيتك للقوى العاملة، وتحليل إجاباتك وأدائك في الكفاءات، وإصدار تقرير التقييم الخاص بك، وعند الاقتضاء، شهادة.",
      paragraph3:
        "تستخدم بعض أجزاء هذا التقييم الذكاء الاصطناعي والتحليل الآلي لتفريغ إجاباتك وترجمتها وتقييمها. النتائج هي معلومات داعمة لاتخاذ القرار، وليست قرارًا نهائيًا — يبقى صاحب العمل أو الجهة التي دعتك لهذا التقييم المسؤول الوحيد عن أي قرار توظيف.",
      paragraph4:
        "لا تبيع ميريت لينس بياناتك. يجوز لمزوّدي الخدمات المعتمدين (مثل مزوّدي خدمات تحويل الكلام إلى نص، والترجمة، والتحليل بالذكاء الاصطناعي) معالجة بياناتك فقط بالقدر اللازم لتقديم خدمة هذا التقييم، وفق ضمانات مناسبة لحماية البيانات. تُشارَك نتائجك أيضًا مع صاحب العمل أو الجهة التي طلبت هذا التقييم.",
      paragraph5: "يتم الاحتفاظ ببياناتك وفقًا لسياسة الاحتفاظ بالبيانات الخاصة بميريت لينس.",
      ackLabel:
        "أؤكد أنني قرأت وفهمت إشعار الخصوصية هذا، وأقرّ بأن بياناتي الشخصية، بما في ذلك الفيديو والصوت والنصوص المفرغة ومعلومات التحقق من الهوية، ستتم معالجتها للأغراض الموضحة أعلاه.",
      submitLabel: "إقرار ومتابعة",
      errorGeneric: "حدث خطأ أثناء حفظ إقرارك. يُرجى المحاولة مرة أخرى.",
    },
    deviceCheck: {
      title: "فحص الكاميرا والميكروفون",
      subtitle: "نحتاج إلى التأكد من أن كاميرتك وميكروفونك يعملان قبل البدء.",
      testButton: "اختبار الكاميرا والميكروفون",
      checking: "جارٍ فحص الأجهزة…",
      passedMessage: "الكاميرا والميكروفون يعملان بشكل جيد.",
      continueButton: "متابعة",
      failedMessage: "تعذّر الوصول إلى الكاميرا والميكروفون معًا. يُرجى السماح بالوصول إليهما والمحاولة مرة أخرى.",
      retryButton: "إعادة المحاولة",
      errorGeneric: "حدث خطأ أثناء حفظ نتيجة فحص الأجهزة. يُرجى المحاولة مرة أخرى.",
    },
    verbalConfirmation: {
      title: "التأكيد الصوتي",
      subtitle: "يُرجى قراءة النص التالي بصوت عالٍ وتسجيل نفسك وأنت تقوله:",
      phrase: "أؤكد أنني الشخص الذي يُكمل هذه المقابلة وأن إجاباتي هي إجاباتي الخاصة.",
      startButton: "بدء التسجيل",
      recording: (seconds) => `جارٍ التسجيل… ${seconds} ث`,
      stopButton: "إيقاف التسجيل",
      retryButton: "إعادة التسجيل",
      submitButton: "إرسال ومتابعة",
      errorGeneric: "حدث خطأ أثناء إرسال تسجيلك. يُرجى المحاولة مرة أخرى.",
    },
  },
  identity: {
    loading: "جارٍ تجهيز التحقق من الهوية…",
    unavailableTitle: "فشل التحقق من الهوية",
    unavailableParagraph1: "لم نتمكن من العثور على صورة مرجعية واضحة مسجَّلة لهذه الجلسة.",
    unavailableParagraph2:
      "يُرجى التواصل مع الشخص الذي دعاك لهذه المقابلة — لا يمكن لجلستك المتابعة حتى يتم حل هذه المشكلة.",
    setupFailedTitle: "تعذّر تحميل التحقق",
    setupFailedBody: "هذه عادةً مشكلة اتصال مؤقتة. يُرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.",
    retryButton: "إعادة المحاولة",
    title: "تحقق من هويتك",
    subtitle: "التقط صورة سريعة حتى نتمكن من تأكيد أنها أنت. لن تتمكن من بدء المقابلة حتى يتم اجتياز هذه الخطوة.",
    cameraError: "تعذّر الوصول إلى الكاميرا. يُرجى السماح بالوصول إلى الكاميرا والمحاولة مرة أخرى.",
    youLabel: "أنت",
    idOnFileLabel: "الهوية المسجَّلة",
    startCameraButton: "تشغيل الكاميرا",
    capturePhotoButton: "التقاط الصورة",
    verifyingLabel: (seconds) => `جارٍ التحقق من الهوية… ${seconds} ث`,
    preparingLabel: "جارٍ التجهيز…",
    noFaceTitle: "لم يتم اكتشاف وجه",
    noFaceMessage: "لم نتمكن من العثور على وجه واضح في هذه الصورة — هذه ليست نتيجة مطابقة، بل تعذّر تحليل الصورة فقط.",
    identificationFailedTitle: "فشل التحقق من الهوية",
    multipleFacesMessage: "تم اكتشاف أكثر من شخص. يُرجى التأكد من ظهورك أنت فقط في الإطار، ثم المحاولة مرة أخرى.",
    verifiedTitle: "تم التحقق من الهوية",
    matchPassed: (score) => `نسبة التطابق ${score.toFixed(0)}%.`,
    matchFailed: (score) => `نسبة التطابق ${score.toFixed(0)}% — وهذا لا يستوفي الحد الأدنى المطلوب.`,
    continueButton: "المتابعة إلى المقابلة",
    tipsTitle: "لتحقيق مطابقة ناجحة:",
    tips: [
      "واجه مصدر إضاءة — تجنّب الجلوس أمام نافذة أو مصدر ضوء خلفك",
      "انظر مباشرة إلى الكاميرا بحيث يظهر وجهك بالكامل",
      "أزل النظارات الشمسية أو أي شيء يغطي وجهك",
      "تأكد من ظهورك أنت فقط في الإطار",
    ],
  },
  orientation: {
    steps: [
      {
        title: "قبل أن تبدأ",
        description: "نظرة سريعة على طريقة عمل هذه المقابلة — تستغرق حوالي 20 ثانية.",
      },
      {
        title: "اقرأ كل سؤال أو استمع إليه",
        description: "يظهر كل سؤال على الشاشة — اضغط على أيقونة مكبر الصوت إذا كنت تفضّل الاستماع إليه.",
      },
      {
        title: "أجب صوتيًا أو كتابيًا",
        description: "اختر ما يناسبك — يمكنك التبديل بين التسجيل والكتابة في أي سؤال.",
      },
      {
        title: "راقب المؤقت",
        description: "يظهر الوقت المتبقي دائمًا أعلى الصفحة — يتم إرسال المقابلة تلقائيًا عند انتهاء الوقت.",
      },
      {
        title: "أنت جاهز الآن",
        description: "أجب بالوتيرة التي تناسبك ضمن الوقت المحدد. بالتوفيق!",
      },
    ],
    skip: "تخطي",
    next: "التالي",
    start: "بدء الاختبار",
  },
  interviewPage: {
    notReadyTitle: "مقابلتك ليست جاهزة بعد",
    notReadyBody: "يُرجى التواصل مع الشخص الذي دعاك لهذه المقابلة — سيحتاج إلى بدء جلستك قبل أن تتمكن من البدء.",
    scheduledTitle: "مقابلتك مجدولة",
    scheduledBody: (formattedDateTime) =>
      (formattedDateTime
        ? `ستبدأ هذه المقابلة في ${formattedDateTime} (بتوقيت جهازك المحلي).`
        : "لم تبدأ هذه المقابلة بعد.") +
      " ستنتقل هذه الصفحة تلقائيًا عند حلول الموعد — يمكنك تركها مفتوحة أو العودة إليها لاحقًا.",
    pausedTitle: "تم إيقاف المقابلة مؤقتًا",
    pausedBody: "لاحظنا وجود أكثر من شخص أمام الكاميرا. يُرجى التأكد من أنك بمفردك أمام الكاميرا — ستُستأنف مقابلتك تلقائيًا.",
    terminatedTitle: "انتهت المقابلة",
    terminatedBody:
      "تم إنهاء هذه المقابلة بسبب تكرار مخالفات النزاهة. يُرجى التواصل مع الشخص الذي دعاك إذا كنت تعتقد أن هذا خطأ.",
    expiredTitle: "انتهت صلاحية رابط هذه المقابلة",
    inactiveTitle: "رابط هذه المقابلة لم يعد نشطًا",
    cancelledMessage: (reason) => `تم إلغاء هذه المقابلة: ${reason}`,
    expiredMessage: "يُرجى التواصل مع الشخص الذي دعاك لطلب رابط جديد.",
    genericUnavailableMessage: "انتهت صلاحية هذه الجلسة أو لم تعد متاحة.",
    completedTitle: "اكتملت المقابلة",
    completedMessage: (roleName) => `شكرًا لك${roleName ? ` على إكمال مقابلة ${roleName}` : ""}. تم إرسال إجاباتك.`,
    errorTitle: "حدث خطأ ما",
    interviewTitle: (roleName) => `مقابلة ${roleName}`,
    answeringInLabel: "الإجابة باللغة:",
    recordAnswerButton: "تسجيل الإجابة",
    typeAnswerButton: "كتابة الإجابة",
    audioUnavailableMessage: (languageLabel) => `الإجابات الصوتية غير متاحة حاليًا بلغة ${languageLabel} — يُرجى كتابة إجابتك.`,
    thisLanguage: "هذه اللغة",
    submitAnswerError: "تعذّر إرسال إجابتك. يُرجى المحاولة مرة أخرى.",
    submitRecordingError: "تعذّر إرسال تسجيلك. يُرجى المحاولة مرة أخرى.",
    loadQuestionError: "حدث خطأ أثناء تحميل السؤال التالي. يُرجى تحديث الصفحة.",
    startError: "تعذّر بدء مقابلتك. يُرجى تحديث الصفحة أو التواصل مع الشخص الذي دعاك.",
    uploadingLabel: "جارٍ الرفع والتفريغ الصوتي…",
    missingLinkError: "رابط هذه المقابلة يفتقد معلومات مطلوبة.",
    notFoundError: "لم نتمكن من العثور على جلسة المقابلة هذه. قد يكون الرابط غير صحيح.",
  },
  questionCard: {
    questionOf: (n, total) => `السؤال ${n} من ${total}`,
    domainLabel: (domain) => `المجال: ${domain}`,
    skillTagLabel: (skill) => `المهارة: ${skill}`,
    readAloudTitle: "لغة القراءة الصوتية",
    listenTitle: "الاستماع إلى السؤال",
  },
  answerRecorder: {
    micError: "تعذّر الوصول إلى الميكروفون. يُرجى السماح بالوصول إلى الميكروفون والمحاولة مرة أخرى.",
    tapToRecord: "اضغط لتسجيل إجابتك",
    recordingLabel: (time) => `جارٍ التسجيل… ${time}`,
    stopButton: "إيقاف",
    reRecordButton: "إعادة التسجيل",
    submitButton: "إرسال الإجابة",
  },
  answerTextForm: {
    placeholder: "اكتب إجابتك هنا...",
    submitButton: "إرسال الإجابة",
  },
  integrityMonitor: {
    problemLabels: {
      NO_FACE_DETECTED: "لا يمكننا رؤيتك",
      MULTIPLE_FACES_DETECTED: "تم اكتشاف أكثر من وجه",
      CAMERA_UNAVAILABLE: "يبدو أن الكاميرا متوقفة أو غير متاحة",
    },
    willBeFlagged: (label, secondsLeft) => `${label} — سيتم تسجيل هذا كمخالفة نزاهة خلال ${secondsLeft} ث ما لم يتم حل المشكلة.`,
  },
  testTimer: {
    remaining: (mm, ss) => `${mm}:${ss} متبقٍ`,
  },
  liveCallRoom: {
    missingSessionId: "معرّف الجلسة مفقود.",
    callEnded: "انتهت المكالمة",
    callEndedMessage: "انتهت مكالمة المقابلة المباشرة هذه.",
    returnToDashboard: "العودة إلى لوحة التحكم",
    couldntJoin: "تعذر الانضمام إلى المكالمة",
    refreshAndTryAgain: "يرجى تحديث الصفحة والمحاولة مرة أخرى.",
    opensAt: "تُفتح هذه المكالمة قبل 15 دقيقة من موعدها المحدد:",
    yourLocalTime: "(بتوقيتك المحلي).",
    statusJoining: "جارٍ الانضمام إلى المكالمة…",
    statusWaiting: "في انتظار انضمام المشارك الآخر…",
    statusPendingAdmission: "في انتظار سماح المُقيِّم لك بالدخول…",
    statusReconnecting: "جارٍ إعادة الاتصال…",
    statusConnecting: "جارٍ الاتصال…",
    candidateWantsToJoin: "يريد المرشح الانضمام",
    letThemIn: "هل تسمح له بالدخول إلى المقابلة؟",
    deny: "رفض",
    admit: "قبول",
    manualTranslationActive: "وضع الترجمة اليدوية مفعّل",
    youreEvaluator: "أنت المُقيِّم",
    youreCandidate: "أنت المرشح",
    manualTranslationLabel: "الترجمة اليدوية",
    messageFeed: "سجل الرسائل",
    isSpeaking: (role) => `${role} يتحدث الآن…`,
    waitingToFinish: (role) => `في انتظار انتهاء ${role}…`,
    tapToRecord: "اضغط لتسجيل دورك",
    recording: (time) => `جارٍ التسجيل… ${time}`,
    stop: "إيقاف",
    reRecord: "إعادة التسجيل",
    sending: "جارٍ الإرسال…",
    send: "إرسال",
    noSegmentsYet: "سجّل دورك في الحديث لإرساله إلى المشارك الآخر بلغته.",
    you: "أنت",
    otherParticipant: "المشارك الآخر",
    original: "النص الأصلي",
    translated: "الترجمة",
    iSpeak: "أتحدث",
    iWantToHear: "أريد أن أسمع",
    endCall: "إنهاء المكالمة",
    candidateLabel: "المرشح",
    evaluatorLabel: "المُقيِّم",
  },
  callControlsIntro: {
    recordBeat: "اضغط هنا لتسجيل دورك عندما يحين وقت حديثك.",
    languageBeat: "حدد هنا اللغة التي تتحدثها واللغة التي تريد سماعها.",
    gotIt: "فهمت",
  },
};

const DICTIONARIES: Record<CandidateLanguage, CandidateStrings> = { en, ar };

export function getCandidateStrings(uiLanguage?: string | null): CandidateStrings {
  return DICTIONARIES[resolveCandidateLanguage(uiLanguage)];
}

export type { CandidateStrings };
