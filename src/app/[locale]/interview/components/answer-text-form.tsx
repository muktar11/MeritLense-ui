"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

interface AnswerTextFormProps {
  onSubmit: (text: string) => Promise<void>;
  submitting: boolean;
}

export function AnswerTextForm({ onSubmit, submitting }: AnswerTextFormProps) {
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your answer here..."
        rows={5}
        disabled={submitting}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !text.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Submit Answer
      </button>
    </div>
  );
}
