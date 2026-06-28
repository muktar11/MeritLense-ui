"use client"

import { useState } from "react"
import { Send, X } from "lucide-react"

interface ChatBotProps {
  onClose: () => void
}

export default function ChatBot({ onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I'm your AI Assistant. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([
        ...messages,
        { role: "user", content: input },
        { role: "assistant", content: "Thanks for your message! I'm processing your request." },
      ])
      setInput("")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-end p-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-96 h-96 flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              AI
            </div>
            <span className="font-semibold text-gray-900">AI Chat Bot</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="What's your question?"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
          />
          <button
            onClick={handleSendMessage}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
