import { Suspense } from "react";
import { EvaluationsPage } from "@/components/evaluations/EvaluationsPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "ar" ? "التقييمات" : "Evaluations" };
}

export default function Page() {
  return <Suspense><EvaluationsPage scope="business" /></Suspense>;
}
