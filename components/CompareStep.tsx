"use client";

import { CompareResponse } from "@/lib/api";

interface Props {
  compare: CompareResponse;
  onReset: () => void;
}

const suitabilityConfig: Record<string, { color: string; bg: string; label: string }> = {
  เหมาะสม: { color: "text-green-700", bg: "bg-green-100", label: "Suitable" },
  เหมาะสมบางส่วน: { color: "text-yellow-700", bg: "bg-yellow-100", label: "Partially Suitable" },
  ไม่เหมาะสม: { color: "text-red-700", bg: "bg-red-100", label: "Not Suitable" },
};

function scoreTailwindColor(score: number): string {
  return score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
}

function rankBadge(rank: number) {
  const styles: Record<number, string> = {
    1: "bg-yellow-100 text-yellow-700 border-yellow-300",
    2: "bg-gray-100 text-gray-600 border-gray-300",
    3: "bg-orange-100 text-orange-700 border-orange-300",
  };
  const style = styles[rank] ?? "bg-gray-100 text-gray-600 border-gray-300";
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full border font-bold text-sm ${style}`}>
      {rank}
    </span>
  );
}

export default function CompareStep({ compare, onReset }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Candidate Comparison</h2>
        <p className="text-sm text-gray-500 mt-0.5">Ranked by suitability score</p>
      </div>

      {/* Ranking Cards */}
      <div className="space-y-3">
        {compare.ranking.map((candidate) => {
          const suitability = suitabilityConfig[candidate.suitability] ?? {
            color: "text-gray-700",
            bg: "bg-gray-100",
            label: candidate.suitability,
          };
          const scoreColor = scoreTailwindColor(candidate.score);

          return (
            <div
              key={candidate.sessionId}
              className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-center gap-3">
                {rankBadge(candidate.rank)}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{candidate.name || `Candidate ${candidate.rank}`}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-2xl font-bold ${scoreColor}`}>{candidate.score}</span>
                  <span className="text-sm text-gray-400"> / 100</span>
                </div>
              </div>

              {/* Suitability badge */}
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${suitability.bg} ${suitability.color}`}>
                {suitability.label}
              </span>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {candidate.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-1.5">Strengths</p>
                    <ul className="space-y-1">
                      {candidate.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {candidate.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-1.5">Weaknesses</p>
                    <ul className="space-y-1">
                      {candidate.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      {compare.recommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recommendation
          </h3>
          <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{compare.recommendation}</p>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
      >
        Start New Analysis
      </button>
    </div>
  );
}
