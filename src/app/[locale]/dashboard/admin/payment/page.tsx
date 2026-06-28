"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

export default function AdminApiSettingsPage() {
  // Static data
  const title = "API Settings";
  const summaryCards = [
    { id: "1", title: "API Key Status", value: "Active" },
    { id: "2", title: "Requests Today", value: "1,234" },
    { id: "3", title: "Requests This Month", value: "23,456" },
  ];

  return (
    <div className="py-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.id} className="p-4">
            <h2 className="font-semibold">{card.title}</h2>
            <p className="text-lg">{card.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
