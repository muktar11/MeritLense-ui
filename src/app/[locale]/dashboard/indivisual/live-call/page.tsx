"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LiveCallRoom } from "@/components/live-call/LiveCallRoom";

// Query-param based (?sessionId=...) rather than a dynamic route segment,
// matching the candidate /interview page - this app is a static export
// (NEXT_PUBLIC_STATIC_EXPORT=true), so a [sessionId] segment would need
// generateStaticParams() to pre-enumerate every possible session, which
// isn't practical for values created at runtime.
export default function IndividualLiveCallPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-4rem)] bg-gray-900 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
        </div>
      }
    >
      <IndividualLiveCallContent />
    </Suspense>
  );
}

function IndividualLiveCallContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";

  if (!sessionId) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gray-900 flex items-center justify-center text-white">
        Missing session ID.
      </div>
    );
  }

  // No candidateToken - the evaluator authenticates as a normal logged-in
  // staff user (Bearer token via apiClient), same as everywhere else in
  // this dashboard.
  return <LiveCallRoom sessionId={sessionId} embedded />;
}
