"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { FileText, History, ShieldCheck } from "lucide-react";
import evaluationService from "@/app/api/evaluations/endpoints";
import type { ScheduledOutputs } from "@/app/api/evaluations/types";

export function ScheduledEvaluationOutputs({ evaluationId }: { evaluationId: string }) {
  const ar = useLocale() === "ar";
  const [outputs, setOutputs] = useState<ScheduledOutputs | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  async function record(operation: string) {
    setSaving(true);
    setNotice("");
    try {
      await evaluationService.recordScheduledException(evaluationId, operation, notes);
      setNotes("");
      setNotice(ar ? "تم تسجيل الإجراء" : "Exception action recorded.");
    } catch { setNotice(ar ? "تعذر تسجيل الإجراء" : "Unable to record action. Please retry."); }
    finally { setSaving(false); }
  }
  useEffect(() => {
    let active = true;
    setOutputs(null);
    setError(false);
    evaluationService.getScheduledOutputs(evaluationId).then(data => {
      if (active) setOutputs(data);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [evaluationId, attempt]);
  if (error) return <button type="button" onClick={() => setAttempt(value => value + 1)} className="text-sm text-red-700 underline">{ar ? "تعذر تحميل المستندات. إعادة المحاولة" : "Unable to load documents. Retry"}</button>;
  if (!outputs) return <p role="status" className="text-sm text-gray-500">{ar ? "جار تحميل المستندات…" : "Loading documents…"}</p>;
  return <div className="space-y-4">
    {outputs.can_manage_exceptions && <section className="space-y-3 rounded-xl border border-purple-100 p-4">
      <h5 className="font-semibold">{ar ? "إجراءات الاستثناء للمسؤول" : "Admin exception actions"}</h5>
      <textarea aria-label={ar ? "ملاحظات الاستثناء" : "Exception reason / resolution notes"} value={notes} onChange={event => setNotes(event.target.value)} maxLength={10000} rows={3} className="w-full rounded-lg border p-3 text-sm" />
      <div className="flex flex-wrap gap-2">{["request_correction", "record_resolution"].map(operation => <button key={operation} type="button" disabled={saving || !notes.trim()} onClick={() => record(operation)} className="rounded-lg border border-purple-400 px-3 py-2 text-sm text-purple-800 disabled:opacity-50">{operation === "request_correction" ? (ar ? "طلب تصحيح المقيّم" : "Request evaluator correction") : (ar ? "تسجيل الحل" : "Record resolution")}</button>)}</div>
      {notice && <p role="status" className="text-sm">{notice}</p>}
      <p className="text-xs text-amber-800">{ar ? "لا يمكن تجاوز حالة الجاهزية يدويًا" : "No manual Ready / Not Ready override. Correct verified inputs through the authorized correction workflow."}</p>
    </section>}
    <div className="grid gap-3 sm:grid-cols-2">
      <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <h5 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" />{ar ? "تقرير التقييم" : "Assessment report / summary"}</h5>
        {outputs.reports.filter(report => report.report_status === "ACTIVE").map(report => <p key={report.report_number} className="mt-2 text-sm">{report.pdf_url ? <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" className="text-purple-700 underline">{report.report_number}</a> : report.report_number}</p>)}
        {!outputs.reports.some(report => report.report_status === "ACTIVE") && <p className="mt-2 text-sm text-gray-500">{ar ? "لم يتم إنشاء التقرير بعد" : "Report not generated yet"}</p>}
      </section>
      <section className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
        <h5 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />{ar ? "حالة الشهادة" : "Certificate status"}</h5>
        <p className="mt-2 text-sm">{outputs.certificate_status}</p>
        {outputs.certificate_url && <a href={outputs.certificate_url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-700 underline">{ar ? "عرض الشهادة" : "View certificate"}</a>}
        <p className="mt-2 text-xs text-gray-500">{ar ? "تُفحص أهلية الشهادة بشكل مستقل" : "Certificate eligibility is checked independently."}</p>
      </section>
    </div>
    <details className="rounded-xl border border-purple-100 p-4">
      <summary className="cursor-pointer font-semibold"><History className="mr-2 inline h-4 w-4" />{ar ? "إصدارات المستندات وسجل التصحيحات" : "Document versions & correction history"}</summary>
      <p className="my-3 text-xs text-gray-500">{ar ? "يتم الاحتفاظ بالتقديم الأصلي. تتطلب التصحيحات تصريح المسؤول وإعادة الحساب." : "Original submission retained. Corrections require administrator authorization and recalculation."}</p>
      <div className="overflow-x-auto"><table className="w-full text-start text-sm"><thead className="bg-purple-50"><tr>{(ar ? ["الإصدار", "التغيير", "التاريخ", "سجله"] : ["Version", "Change / status", "Recorded", "Recorded by"]).map(label => <th key={label} className="p-2 text-start">{label}</th>)}</tr></thead><tbody>
        <tr className="border-b"><td className="p-2">v1</td><td className="p-2">{ar ? "التقديم الأصلي محفوظ" : "Original submission retained"}</td><td className="p-2">—</td><td className="p-2">{ar ? "المقيّم" : "Evaluator"}</td></tr>
        {outputs.corrections.map((item, index) => <tr key={`${item.created_at}-${index}`} className="border-b"><td className="p-2">v{index + 2}</td><td className="p-2"><p>{item.reason}</p><details><summary className="cursor-pointer text-purple-700">{ar ? "القيم قبل التصحيح وبعده" : "Before / after evidence"}</summary><pre className="max-w-sm overflow-auto text-xs">{JSON.stringify({ before: item.previous_values, after: item.corrected_values }, null, 2)}</pre></details></td><td className="p-2">{new Date(item.created_at).toLocaleString(ar ? "ar" : "en")}</td><td className="p-2">{item.recorded_by ?? "—"}</td></tr>)}
        {outputs.reports.map(report => <tr key={report.report_number} className="border-b"><td className="p-2">{report.report_number}</td><td className="p-2">{report.report_status}</td><td className="p-2">{new Date(report.generated_at).toLocaleString(ar ? "ar" : "en")}</td><td className="p-2">—</td></tr>)}
      </tbody></table></div>
    </details>
  </div>;
}
