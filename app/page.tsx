"use client";

import { useState } from "react";
import UploadStep from "@/components/UploadStep";
import ChatStep, { Message } from "@/components/ChatStep";
import ReportStep from "@/components/ReportStep";
import {
  extractPdf,
  startAnalysis,
  continueChat,
  getReport,
  extractCandidateInfo,
  ResumeReportResponse,
  CandidateInfo,
} from "@/lib/api";

type Step = "upload" | "chat" | "report";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");

  // Upload step
  const [uploadLoading, setUploadLoading] = useState(false);

  // Chat step
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Candidate info
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(null);

  // Report step
  const [report, setReport] = useState<ResumeReportResponse | null>(null);

  // Upload form data (for pre-filling when navigating back to upload)
  const [uploadFormData, setUploadFormData] = useState<{
    file: File;
    position: string;
    requiredSkills: string;
    qualifications: string;
  } | null>(null);

  async function handleUploadSubmit(
    file: File,
    position: string,
    requiredSkills: string,
    qualifications: string
  ) {
    setError("");
    setUploadLoading(true);
    try {
      const extracted = await extractPdf(file);
      const [candidateInfoResult, chat] = await Promise.all([
        extractCandidateInfo(extracted.fullText),
        startAnalysis(extracted.fullText, position, requiredSkills, qualifications),
      ]);
      setCandidateInfo(candidateInfoResult);
      setUploadFormData({ file, position, requiredSkills, qualifications });
      setSessionId(chat.sessionId);
      setMessages([{ role: "assistant", content: chat.message }]);
      setIsAnalysisComplete(chat.isAnalysisComplete);
      setStep("chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleSend(message: string) {
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatLoading(true);
    try {
      const chat = await continueChat(sessionId, message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: chat.message },
      ]);
      setIsAnalysisComplete(chat.isAnalysisComplete);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setChatLoading(false);
    }
  }

  async function handleGetReport() {
    if (report) {
      setStep("report");
      return;
    }
    setError("");
    setReportLoading(true);
    try {
      const r = await getReport(sessionId);
      setReport(r);
      setStep("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setReportLoading(false);
    }
  }

  function handleReset() {
    setStep("upload");
    setError("");
    setSessionId("");
    setMessages([]);
    setIsAnalysisComplete(false);
    setCandidateInfo(null);
    setReport(null);
    setUploadFormData(null);
  }

  const stepLabels = ["Upload Resume", "Analyze", "Report"];
  const stepIndex = step === "upload" ? 0 : step === "chat" ? 1 : 2;

  function isTabClickable(i: number): boolean {
    if (i === stepIndex) return false; // already here
    if (i === 0) return uploadFormData !== null || sessionId !== "";
    if (i === 1) return sessionId !== "";
    if (i === 2) return report !== null;
    return false;
  }

  function handleTabClick(i: number) {
    if (!isTabClickable(i)) return;
    if (i === 0) setStep("upload");
    if (i === 1) setStep("chat");
    if (i === 2) setStep("report");
  }

  function isTabCompleted(i: number): boolean {
    if (i === 0) return uploadFormData !== null || sessionId !== "";
    if (i === 1) return sessionId !== "";
    if (i === 2) return report !== null;
    return false;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resume Analyzer</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-Powered Candidate Suitability Analysis
        </p>
      </div>

      {/* Stepper */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex items-center gap-0">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  onClick={() => handleTabClick(i)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                    ${i === stepIndex
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : isTabCompleted(i)
                      ? `bg-blue-600 text-white ${isTabClickable(i) ? "cursor-pointer hover:bg-blue-700" : ""}`
                      : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {isTabCompleted(i) && i !== stepIndex ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs mt-1 font-medium ${i === stepIndex ? "text-blue-600" : isTabCompleted(i) ? "text-blue-400" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${isTabCompleted(i) ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className={`w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${step === "chat" ? "flex flex-col h-[600px]" : ""}`}>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {step === "upload" && (
          <UploadStep onSubmit={handleUploadSubmit} loading={uploadLoading} initialValues={uploadFormData ?? undefined} />
        )}

        {step === "chat" && (
          <ChatStep
            messages={messages}
            loading={chatLoading}
            onSend={handleSend}
            onGetReport={handleGetReport}
            isAnalysisComplete={isAnalysisComplete}
            reportLoading={reportLoading}
            candidateInfo={candidateInfo}
          />
        )}

        {step === "report" && report && (
          <ReportStep report={report} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
