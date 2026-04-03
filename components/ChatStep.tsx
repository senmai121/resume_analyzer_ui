"use client";

import { useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";
import { CandidateInfo } from "@/lib/api";
import { validateField, MAX_LENGTHS } from "@/lib/inputValidation";

export interface Message {
  role: "assistant" | "user";
  content: string;
}

interface Props {
  messages: Message[];
  loading: boolean;
  onSend: (message: string) => void;
  onGetReport: () => void;
  isAnalysisComplete: boolean;
  reportLoading: boolean;
  candidateInfo?: CandidateInfo | null;
}

export default function ChatStep({
  messages,
  loading,
  onSend,
  onGetReport,
  isAnalysisComplete,
  reportLoading,
  candidateInfo,
}: Props) {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;
    const error = validateField(input, "chatMessage");
    if (error) {
      setInputError(error);
      return;
    }
    setInputError("");
    setInput("");
    onSend(msg);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Candidate Info Card */}
      {candidateInfo && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3 shrink-0">
          <p className="text-xs font-semibold text-blue-700 mb-2">Candidate Info</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-800">{candidateInfo.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Age</p>
              <p className="text-sm font-medium text-gray-800">{candidateInfo.age}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Title</p>
              <p className="text-sm font-medium text-gray-800">{candidateInfo.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-800">{candidateInfo.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-800">{candidateInfo.tel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed
                ${msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
            >
              {/* Strip [ANALYSIS_COMPLETE] tag from display */}
              {msg.content.replace(/\[ANALYSIS_COMPLETE\]/gi, "").trim()}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
              AI
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Analysis complete banner + report button */}
      {isAnalysisComplete && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Analysis complete
          </div>
          <button
            onClick={onGetReport}
            disabled={reportLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0"
          >
            {reportLoading ? (
              <>
                <Spinner className="h-4 w-4" />
                Generating report...
              </>
            ) : (
              "View summary report →"
            )}
          </button>
        </div>
      )}

      {/* Input */}
      {!isAnalysisComplete && (
        <div className="shrink-0">
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !loading) handleSend(e as never);
                }
              }}
              placeholder="Answer questions or provide additional information..."
              disabled={loading}
              maxLength={MAX_LENGTHS.chatMessage}
              rows={2}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 resize-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          {inputError && (
            <p className="text-red-500 text-sm mt-1">{inputError}</p>
          )}
        </div>
      )}
    </div>
  );
}
