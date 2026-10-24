"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ScheduledAssessmentFlow } from "@/components/scheduled/ScheduledAssessmentFlow";

// Query-param based (?sessionId=...&stage=...) rather than a dynamic route
// segment: this app is a static export (NEXT_PUBLIC_STATIC_EXPORT=true), so
// a [sessionId] segment would need generateStaticParams() to pre-enumerate
// every possible session. The evaluator authenticates as the logged-in
// dashboard user; candidates join from their own /interview link.
export default function BusinessLiveCallPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>}>
      <ScheduledAssessmentFlow scope="business" />
    </Suspense>
  );
}
