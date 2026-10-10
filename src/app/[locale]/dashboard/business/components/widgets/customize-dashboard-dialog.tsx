"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, EyeOff, Loader2, Plus, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ALL_WIDGETS, DEFAULT_WIDGETS, WIDGETS, type WidgetId } from "./widget-registry";

interface CustomizeDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: readonly WidgetId[];
  onSave: (widgets: WidgetId[]) => Promise<void>;
  onReset: () => Promise<void>;
}

export function CustomizeDashboardDialog({ open, onOpenChange, widgets, onSave, onReset }: CustomizeDashboardDialogProps) {
  const t = useTranslations("dashboard.business.overview.customize");
  const tw = useTranslations("dashboard.business.overview.widgets");
  const locale = useLocale();
  const [draft, setDraft] = useState<WidgetId[]>([...widgets]);
  const [busy, setBusy] = useState<"save" | "reset" | null>(null);

  // Start every editing session from the layout currently on screen.
  useEffect(() => {
    if (open) setDraft([...widgets]);
  }, [open, widgets]);

  const hidden = ALL_WIDGETS.filter((id) => !draft.includes(id));

  const move = (index: number, delta: number) => {
    setDraft((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const run = async (kind: "save" | "reset", action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
      onOpenChange(false);
    } catch {
      // The caller has already surfaced the error; keep the dialog open
      // so the user doesn't lose their unsaved arrangement.
    } finally {
      setBusy(null);
    }
  };

  const isDefault =
    draft.length === DEFAULT_WIDGETS.length && draft.every((id, index) => id === DEFAULT_WIDGETS[index]);

  return (
    <Dialog open={open} onOpenChange={(value) => !busy && onOpenChange(value)}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" dir={locale === "ar" ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <section aria-labelledby="visible-widgets-heading" className="space-y-2">
          <h3 id="visible-widgets-heading" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("visible")} ({draft.length})
          </h3>
          {draft.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500">
              {t("emptyVisible")}
            </p>
          ) : (
            <ol className="space-y-2">
              {draft.map((id, index) => {
                const Icon = WIDGETS[id].icon;
                const title = tw(`${id}.title`);
                return (
                  <li key={id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {index + 1}
                    </span>
                    <Icon className="h-4 w-4 shrink-0 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{title}</p>
                      <p className="truncate text-xs text-gray-500">{tw(`${id}.description`)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button" variant="ghost" size="icon" className="h-8 w-8"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label={t("moveUp", { widget: title })}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button" variant="ghost" size="icon" className="h-8 w-8"
                        disabled={index === draft.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label={t("moveDown", { widget: title })}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600"
                        onClick={() => setDraft((current) => current.filter((item) => item !== id))}
                        aria-label={t("hide", { widget: title })}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section aria-labelledby="hidden-widgets-heading" className="space-y-2">
          <h3 id="hidden-widgets-heading" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("available")}
          </h3>
          {hidden.length === 0 ? (
            <p className="text-sm text-gray-500">{t("allAdded")}</p>
          ) : (
            <ul className="space-y-2">
              {hidden.map((id) => {
                const Icon = WIDGETS[id].icon;
                const title = tw(`${id}.title`);
                return (
                  <li key={id} className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-3 py-2">
                    <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-700">{title}</p>
                      <p className="truncate text-xs text-gray-500">{tw(`${id}.description`)}</p>
                    </div>
                    <Button
                      type="button" variant="outline" size="sm" className="shrink-0 gap-1"
                      onClick={() => setDraft((current) => [...current, id])}
                      aria-label={t("addWidget", { widget: title })}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("add")}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button" variant="ghost" className="gap-1.5 text-gray-600"
            disabled={busy !== null || isDefault}
            onClick={() => run("reset", onReset)}
          >
            {busy === "reset" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            {t("reset")}
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" disabled={busy !== null} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" disabled={busy !== null} onClick={() => run("save", () => onSave(draft))}>
              {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
