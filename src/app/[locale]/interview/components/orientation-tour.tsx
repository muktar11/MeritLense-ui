"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Clock, Mic, ShieldCheck, Sparkles, Type, Volume2 } from "lucide-react";
import { candidateDir, getCandidateStrings, resolveCandidateLanguage } from "../candidate-lang";

interface OrientationTourProps {
  onDone: () => void;
  uiLanguage?: string | null;
}

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  mock: React.ReactNode;
}

// Deliberately brief - four short beats plus a closing screen, each a
// simplified mock of the real element it's pointing at (question card,
// audio/text toggle, timer) rather than trying to spotlight the live DOM.
// The candidate hasn't seen the real question view yet when this renders
// (it runs before the first QuestionCard mounts), so a live spotlight isn't
// available anyway - these mocks are illustrative, not literal screenshots.
function buildSteps(t: ReturnType<typeof getCandidateStrings>): Step[] {
  const s = t.orientation.steps;
  return [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: s[0].title,
      description: s[0].description,
      mock: (
        <div className="flex items-center justify-center h-full text-purple-200">
          <Sparkles className="w-16 h-16" strokeWidth={1.2} />
        </div>
      ),
    },
    {
      icon: <Volume2 className="w-6 h-6" />,
      title: s[1].title,
      description: s[1].description,
      mock: (
        <div className="w-full px-5">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2">
            <div className="h-2.5 w-4/5 rounded bg-gray-200" />
            <div className="h-2.5 w-3/5 rounded bg-gray-200" />
            <div className="flex items-center gap-1.5 pt-1">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white">
                <Volume2 className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] text-purple-600 font-medium">{t.questionCard.readAloudTitle}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <Mic className="w-6 h-6" />,
      title: s[2].title,
      description: s[2].description,
      mock: (
        <div className="w-full px-5 flex gap-2">
          <div className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-lg border-2 border-purple-500 bg-purple-50 text-purple-700">
            <Mic className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t.interviewPage.recordAnswerButton}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-lg border border-gray-200 text-gray-400">
            <Type className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t.interviewPage.typeAnswerButton}</span>
          </div>
        </div>
      ),
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: s[3].title,
      description: s[3].description,
      mock: (
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-gray-700">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-mono font-medium">29:58</span>
          </div>
        </div>
      ),
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: s[4].title,
      description: s[4].description,
      mock: (
        <div className="flex items-center justify-center h-full text-green-200">
          <ShieldCheck className="w-16 h-16" strokeWidth={1.2} />
        </div>
      ),
    },
  ];
}

// Slide-in-from-the-right / slide-out-to-the-left, matching the direction
// of travel through the steps regardless of which step number we're on -
// keyed by index so AnimatePresence treats each step as a distinct element
// to transition between rather than mutating one in place.
const slideVariants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
};

export function OrientationTour({ onDone, uiLanguage }: OrientationTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const t = getCandidateStrings(uiLanguage);
  const dir = candidateDir(resolveCandidateLanguage(uiLanguage));
  const steps = buildSteps(t);
  const isLast = stepIndex === steps.length - 1;
  const step = steps[stepIndex];
  const NextIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const handleNext = () => {
    if (isLast) {
      onDone();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={dir}>
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        <div className="relative h-40 bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {step.mock}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
                {step.icon}
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-1.5">{step.title}</h1>
              <p className="text-sm text-gray-600">{step.description}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-1.5 mt-5 mb-5">
            {steps.map((s, i) => (
              <span
                key={s.title}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? "w-5 bg-purple-500" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={onDone}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                {t.orientation.skip}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
            >
              {isLast ? t.orientation.start : t.orientation.next}
              <NextIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
