"use client";

import { ResumeReportResponse } from "@/lib/api";

interface Props {
  report: ResumeReportResponse;
  onReset: () => void;
}

const suitabilityConfig: Record<string, { color: string; bg: string; label: string }> = {
  เหมาะสม: { color: "text-green-700", bg: "bg-green-100", label: "Suitable" },
  เหมาะสมบางส่วน: { color: "text-yellow-700", bg: "bg-yellow-100", label: "Partially Suitable" },
  ไม่เหมาะสม: { color: "text-red-700", bg: "bg-red-100", label: "Not Suitable" },
};

function scoreHexColor(score: number): string {
  return score >= 70 ? "#16a34a" : score >= 50 ? "#ca8a04" : "#dc2626";
}

function scoreTailwindColor(score: number): string {
  return score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreHexColor(score);

  return (
    <svg width="100" height="100" className="-rotate-90">
      <circle
        cx="50" cy="50" r={radius}
        fill="none" stroke="#e5e7eb" strokeWidth="10"
      />
      <circle
        cx="50" cy="50" r={radius}
        fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

export default function ReportStep({ report, onReset }: Props) {
  const suitability = suitabilityConfig[report.suitability] ?? {
    color: "text-gray-700",
    bg: "bg-gray-100",
    label: report.suitability,
  };

  const scoreColor = scoreTailwindColor(report.score);

  return (
    <div className="space-y-5">
      {/* Score + Suitability */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-6">
        <div className="relative flex items-center justify-center">
          <ScoreRing score={report.score} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-gray-500 text-sm">Suitability Score</div>
          <div className={`text-4xl font-bold ${scoreColor}`}>
            {report.score}<span className="text-lg font-normal text-gray-400"> / 100</span>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${suitability.bg} ${suitability.color}`}>
            {suitability.label}
          </span>
        </div>
      </div>

      {/* Gaps */}
      {report.gaps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </span>
            Skill Gaps
          </h3>
          <ul className="space-y-2">
            {report.gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recruiter Advice */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </span>
          Recruiter Advice
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {report.recruiterAdvice}
        </p>
      </div>

      {/* Suggested Questions */}
      {report.suggestedQuestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Suggested Interview Questions
          </h3>
          <ol className="space-y-3">
            {report.suggestedQuestions.map((q, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
      >
        Analyze New Resume
      </button>
    </div>
  );
}
