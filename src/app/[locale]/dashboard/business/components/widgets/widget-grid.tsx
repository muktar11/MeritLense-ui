"use client";

import type { ComponentType, ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { useWidgetData } from "./use-widget-data";
import { WidgetFrame } from "./widget-frame";

// Shared by the B2B (company) and B2C (individual) overview dashboards:
// each has its own widget set (see the two widget-registry files) but the
// same grid, loading frame and Customize Dashboard dialog.

export interface WidgetDefinition {
  // "half" widgets sit two to a row on large screens; "full" spans the row.
  span: "half" | "full";
  icon: LucideIcon;
  Component: ComponentType;
}

export interface WidgetCatalog<WidgetId extends string> {
  all: readonly WidgetId[];
  defaults: readonly WidgetId[];
  widgets: Record<WidgetId, WidgetDefinition>;
  // next-intl namespace holding `<id>.title` / `<id>.description`.
  titlesNamespace: string;
}

// Load data for a widget and render it once ready.
export function makeDataWidget<T>(
  titlesNamespace: string,
  id: string,
  fetcher: () => Promise<T>,
  render: (data: T) => ReactNode,
) {
  function DataWidget() {
    const t = useTranslations(titlesNamespace);
    const { data, loading, error, retry } = useWidgetData(fetcher);
    return (
      <WidgetFrame title={t(`${id}.title`)} loading={loading} error={error} onRetry={retry}>
        {() => render(data as T)}
      </WidgetFrame>
    );
  }
  DataWidget.displayName = `Widget(${id})`;
  return DataWidget;
}

// A half-width widget with no half-width partner next to it (because the
// chosen order puts a full-width widget, or nothing, beside it) stretches
// across the row instead of leaving an empty hole.
function resolveSpans<WidgetId extends string>(widgets: readonly WidgetId[], registry: Record<WidgetId, WidgetDefinition>) {
  const spans: ("half" | "full")[] = [];
  let column = 0;
  widgets.forEach((id, index) => {
    const next = widgets[index + 1];
    let span = registry[id].span;
    if (span === "half" && column === 0 && (!next || registry[next].span !== "half")) span = "full";
    spans.push(span);
    column = span === "full" ? 0 : (column + 1) % 2;
  });
  return spans;
}

interface DashboardWidgetGridProps<WidgetId extends string> {
  widgets: readonly WidgetId[];
  registry: Record<WidgetId, WidgetDefinition>;
}

export function DashboardWidgetGrid<WidgetId extends string>({ widgets, registry }: DashboardWidgetGridProps<WidgetId>) {
  const spans = resolveSpans(widgets, registry);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {widgets.map((id, index) => {
        const { Component } = registry[id];
        return (
          <section
            key={id}
            data-widget={id}
            className={`min-w-0 [&>*]:h-full ${spans[index] === "full" ? "lg:col-span-2" : ""}`}
          >
            <Component />
          </section>
        );
      })}
    </div>
  );
}
