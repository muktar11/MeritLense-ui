import { Suspense } from "react";
import { AssessmentResultsPage } from "@/components/evaluations/AssessmentResultsPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "ar" ? "نتائج التقييم" : "Assessment Results" };
}

export default function Page() {
  return <Suspense><AssessmentResultsPage scope="business" /></Suspense>;
}
