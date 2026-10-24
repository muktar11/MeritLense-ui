"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import liveCallService from "@/app/api/live-calls/endpoints";
import type { LiveCallGuide } from "@/app/api/live-calls/types";
import { apiErrorMessage } from "@/lib/api-error-message";
import { useAssessmentText } from "@/components/evaluations/assessment-ui";
import { ScheduledInterviewRoom } from "./ScheduledInterviewRoom";
import { ScheduledScorecard } from "./ScheduledScorecard";

// The evaluator's scheduled assessment: Interview -> Scorecard, then
// Results in Assessment Results (score-management?assessment=...). Opened
// from Evaluations ("Join as evaluator"); the same page resumes at the
// scorecard once the call has ended.
export function ScheduledAssessmentFlow({ scope }: { scope: "business" | "indivisual" }) {
  const text = useAssessmentText();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") ?? "";
  const [guide, setGuide] = useState<LiveCallGuide | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"interview" | "scorecard" | null>(null);

  const loadGuide = useCallback(async () => {
    const loaded = await liveCallService.getGuide(sessionId);
    setGuide(loaded);
    return loaded;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    loadGuide().then((loaded) => {
      if (!active) return;
      const ended = loaded.call?.state === "ENDED" || params.get("stage") === "scorecard";
      setStage(ended ? "scorecard" : "interview");
    }).catch((err) => { if (active) setError(apiErrorMessage(err) || text("Unable to open this scheduled assessment.", "تعذر فتح هذا التقييم المجدول.")); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const movedRef = useRef(false);
  const toScorecard = useCallback(() => {
    if (movedRef.current) return;
    movedRef.current = true;
    router.replace(`${pathname}?sessionId=${encodeURIComponent(sessionId)}&stage=scorecard`);
    // The scorecard needs every turn of the call, including the last ones.
    setGuide(null);
    loadGuide().catch((err) => setError(apiErrorMessage(err) || text("Unable to open the scorecard.", "تعذر فتح بطاقة التقييم.")));
    setStage("scorecard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadGuide, pathname, router, sessionId]);

  const toResults = useCallback(() => {
    if (guide?.evaluation_id) router.push(`/${locale}/dashboard/${scope}/score-management?assessment=${encodeURIComponent(guide.evaluation_id)}`);
  }, [guide?.evaluation_id, locale, router, scope]);

  let body;
  if (!sessionId) body = <Notice message={text("No session was selected. Open the assessment from Evaluations.", "لم يتم اختيار جلسة. افتح التقييم من صفحة التقييمات.")} />;
  else if (error) body = <Notice message={error} />;
  else if (!guide || !stage) body = <div role="status" className="p-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-600" /></div>;
  else if (stage === "interview") body = <ScheduledInterviewRoom sessionId={sessionId} guide={guide} onContinue={toScorecard} />;
  else if (!guide.evaluation_id) body = <Notice message={text("This session has no linked evaluation to rate.", "لا يوجد تقييم مرتبط بهذه الجلسة.")} />;
  else body = <ScheduledScorecard guide={guide} evaluationId={guide.evaluation_id} onSubmitted={toResults} />;

  return <main className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-sky-50/70 via-white to-violet-50/40 p-4 text-blue-950 md:p-7"><div className="mx-auto max-w-7xl">{body}</div></main>;
}

function Notice({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
      <p className="text-slate-700">{message}</p>
    </div>
  );
}
