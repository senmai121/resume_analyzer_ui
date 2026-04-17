"use client";

import { useState, useEffect } from "react";
import UploadStep from "@/components/UploadStep";
import ChatStep, { Message } from "@/components/ChatStep";
import ReportStep from "@/components/ReportStep";
import CompareStep from "@/components/CompareStep";
import {
  extractPdf,
  startAnalysis,
  continueChat,
  getReport,
  extractCandidateInfo,
  compareResumes,
  ResumeReportResponse,
  CandidateInfo,
  CompareResponse,
} from "@/lib/api";

type Step = "upload" | "chat" | "report";

interface CandidateState {
  sessionId: string;
  messages: Message[];
  chatLoading: boolean;
  isAnalysisComplete: boolean;
  reportLoading: boolean;
  candidateInfo: CandidateInfo | null;
  report: ResumeReportResponse | null;
}

function makeCandidateState(): CandidateState {
  return {
    sessionId: "",
    messages: [],
    chatLoading: false,
    isAnalysisComplete: false,
    reportLoading: false,
    candidateInfo: null,
    report: null,
  };
}

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");

  // Upload step
  const [uploadLoading, setUploadLoading] = useState(false);

  // Multi-candidate state
  const [candidates, setCandidates] = useState<CandidateState[]>([]);
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0);

  // Upload form data (for navigating back)
  const [uploadFormData, setUploadFormData] = useState<{
    files: File[];
    position: string;
    requiredSkills: string;
    qualifications: string;
  } | null>(null);

  // Report tab — "compare" or candidate index
  const [activeReportTab, setActiveReportTab] = useState<number | "compare">(0);

  // Compare
  const [compareReport, setCompareReport] = useState<CompareResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Warm up Render backend on mount
  useEffect(() => {
    fetch("/api/proxy/resume/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "warmup", message: "warmup" }),
    }).catch(() => {});
  }, []);

  // Helper: update a single candidate's state immutably
  function updateCandidate(index: number, patch: Partial<CandidateState>) {
    setCandidates((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }

  async function handleUploadSubmit(
    files: File[],
    position: string,
    requiredSkills: string,
    qualifications: string
  ) {
    setError("");
    setUploadLoading(true);

    // Initialise a candidate slot per file
    const initial = files.map(() => makeCandidateState());
    setCandidates(initial);

    try {
      // Process all files in parallel
      const results = await Promise.all(
        files.map(async (file) => {
          const extracted = await extractPdf(file);
          const [candidateInfo, chat] = await Promise.all([
            extractCandidateInfo(extracted.fullText),
            startAnalysis(extracted.fullText, position, requiredSkills, qualifications),
          ]);
          return { candidateInfo, chat };
        })
      );

      setCandidates(
        results.map(({ candidateInfo, chat }) => ({
          sessionId: chat.sessionId,
          messages: [{ role: "assistant" as const, content: chat.message }],
          chatLoading: false,
          isAnalysisComplete: chat.isAnalysisComplete,
          reportLoading: false,
          candidateInfo,
          report: null,
        }))
      );

      setUploadFormData({ files, position, requiredSkills, qualifications });
      setActiveCandidateIndex(0);
      setActiveReportTab(0);
      setCompareReport(null);
      setStep("chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
      setCandidates([]);
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleSend(index: number, message: string) {
    setError("");
    // sessionId never changes after init — safe to read from closure
    const sessionId = candidates[index].sessionId;

    // Use functional updater so we always append to the latest messages, not a stale snapshot
    setCandidates((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, messages: [...c.messages, { role: "user" as const, content: message }], chatLoading: true }
          : c
      )
    );

    try {
      const chat = await continueChat(sessionId, message);
      setCandidates((prev) =>
        prev.map((c, i) =>
          i === index
            ? {
                ...c,
                messages: [...c.messages, { role: "assistant" as const, content: chat.message }],
                isAnalysisComplete: chat.isAnalysisComplete,
                chatLoading: false,
              }
            : c
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
      setCandidates((prev) =>
        prev.map((c, i) => (i === index ? { ...c, chatLoading: false } : c))
      );
    }
  }

  async function handleGetReport(index: number) {
    const candidate = candidates[index];
    if (candidate.report) {
      setActiveReportTab(index);
      setStep("report");
      return;
    }
    setError("");
    updateCandidate(index, { reportLoading: true });
    try {
      const r = await getReport(candidate.sessionId);
      updateCandidate(index, { report: r, reportLoading: false });
      setActiveReportTab(index);
      setStep("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
      updateCandidate(index, { reportLoading: false });
    }
  }

  async function handleGetAllReports() {
    setError("");
    setCandidates((prev) => prev.map((c) => ({ ...c, reportLoading: true })));
    try {
      const reports = await Promise.all(
        candidates.map((c) => getReport(c.sessionId))
      );
      setCandidates((prev) =>
        prev.map((c, i) => ({ ...c, report: reports[i], reportLoading: false }))
      );
      setActiveReportTab(0);
      setStep("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
      setCandidates((prev) => prev.map((c) => ({ ...c, reportLoading: false })));
    }
  }

  async function handleCompare() {
    if (compareReport) {
      setActiveReportTab("compare");
      return;
    }
    setError("");
    setCompareLoading(true);
    try {
      const sessionIds = candidates.map((c) => c.sessionId);
      const result = await compareResumes(sessionIds);

      // Override scores with locally stored report scores so compare is consistent with individual reports
      const scoreBySession = Object.fromEntries(
        candidates.filter((c) => c.report).map((c) => [c.sessionId, c.report!.score])
      );
      const fixedResult = {
        ...result,
        ranking: result.ranking.map((r) =>
          scoreBySession[r.sessionId] !== undefined
            ? { ...r, score: scoreBySession[r.sessionId] }
            : r
        ),
      };

      setCompareReport(fixedResult);
      setActiveReportTab("compare");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setCompareLoading(false);
    }
  }

  function handleReset() {
    setStep("upload");
    setError("");
    setCandidates([]);
    setActiveCandidateIndex(0);
    setActiveReportTab(0);
    setCompareReport(null);
    setUploadFormData(null);
  }

  const isMulti = candidates.length > 1;

  // Derive a display name for a candidate
  function candidateName(i: number): string {
    const info = candidates[i]?.candidateInfo;
    if (info?.name && info.name.trim()) return info.name.trim();
    return `Candidate ${i + 1}`;
  }

  // ---- Stepper helpers ----
  const stepLabels = ["Upload Resume", "Analyze", "Report"];
  const stepIndex = step === "upload" ? 0 : step === "chat" ? 1 : 2;

  const hasAnySession = candidates.length > 0 && candidates[0].sessionId !== "";
  const hasAnyReport = candidates.some((c) => c.report !== null);

  function isTabClickable(i: number): boolean {
    if (i === stepIndex) return false;
    if (i === 0) return uploadFormData !== null || hasAnySession;
    if (i === 1) return hasAnySession;
    if (i === 2) return hasAnyReport;
    return false;
  }

  function handleTabClick(i: number) {
    if (!isTabClickable(i)) return;
    if (i === 0) setStep("upload");
    if (i === 1) setStep("chat");
    if (i === 2) setStep("report");
  }

  function isTabCompleted(i: number): boolean {
    if (i === 0) return uploadFormData !== null || hasAnySession;
    if (i === 1) return hasAnySession;
    if (i === 2) return hasAnyReport;
    return false;
  }

  const activeCandidate = candidates[activeCandidateIndex];

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
          <UploadStep
            onSubmit={handleUploadSubmit}
            loading={uploadLoading}
            initialValues={uploadFormData ?? undefined}
          />
        )}

        {step === "chat" && candidates.length > 0 && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Candidate tabs (only shown for multi) */}
            {isMulti && (
              <div className="flex gap-1 mb-4 shrink-0 overflow-x-auto">
                {candidates.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCandidateIndex(i)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                      ${activeCandidateIndex === i
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {candidateName(i)}
                  </button>
                ))}
              </div>
            )}

            {activeCandidate && (
              <ChatStep
                key={activeCandidateIndex}
                messages={activeCandidate.messages}
                loading={activeCandidate.chatLoading}
                onSend={(msg) => handleSend(activeCandidateIndex, msg)}
                isAnalysisComplete={activeCandidate.isAnalysisComplete}
                candidateInfo={activeCandidate.candidateInfo}
              />
            )}

            {/* View Reports button — visible only when all candidates are done */}
            {candidates.every((c) => c.isAnalysisComplete) && (
              <div className="shrink-0 pt-3 border-t border-gray-100 mt-2">
                <button
                  onClick={handleGetAllReports}
                  disabled={candidates.some((c) => c.reportLoading)}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {candidates.some((c) => c.reportLoading) ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating report...
                    </>
                  ) : (
                    candidates.length === 1 ? "View Report →" : "View Reports →"
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {step === "report" && candidates.length > 0 && (
          <div>
            {/* Report tabs */}
            {(isMulti) && (
              <div className="flex gap-1 mb-5 overflow-x-auto">
                {candidates.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveReportTab(i);
                      if (!c.report) handleGetReport(i);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                      ${activeReportTab === i
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {candidateName(i)}
                    {c.reportLoading && (
                      <span className="ml-1.5 inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin align-middle" />
                    )}
                  </button>
                ))}
                {/* Compare tab — only when multi */}
                <button
                  onClick={handleCompare}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                    ${activeReportTab === "compare"
                      ? "bg-purple-600 text-white"
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                    }`}
                >
                  Compare
                  {compareLoading && (
                    <span className="ml-1.5 inline-block w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin align-middle" />
                  )}
                </button>
              </div>
            )}

            {/* Individual report */}
            {activeReportTab !== "compare" && (() => {
              const c = candidates[activeReportTab as number];
              if (!c) return null;
              if (c.reportLoading) {
                return (
                  <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                    <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Generating report...
                  </div>
                );
              }
              if (!c.report) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <p className="text-gray-500 text-sm">Report not yet generated for {candidateName(activeReportTab as number)}.</p>
                    <button
                      onClick={() => handleGetReport(activeReportTab as number)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Generate Report
                    </button>
                  </div>
                );
              }
              return <ReportStep report={c.report} onReset={handleReset} />;
            })()}

            {/* Compare report */}
            {activeReportTab === "compare" && (
              compareLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                  <span className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Comparing candidates...
                </div>
              ) : compareReport ? (
                <CompareStep compare={compareReport} onReset={handleReset} />
              ) : null
            )}

            {/* Single-resume reset button (shown only for single candidate, since multi has it inside CompareStep / ReportStep) */}
            {!isMulti && activeReportTab !== "compare" && candidates[0]?.report && (
              <></>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
