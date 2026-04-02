"use client";

import { useRef, useState } from "react";
import Spinner from "./Spinner";
import { validateField, MAX_LENGTHS } from "@/lib/inputValidation";

interface Props {
  onSubmit: (
    file: File,
    position: string,
    requiredSkills: string,
    qualifications: string
  ) => void;
  loading: boolean;
  initialValues?: {
    file: File;
    position: string;
    requiredSkills: string;
    qualifications: string;
  };
}

export default function UploadStep({ onSubmit, loading, initialValues }: Props) {
  const [file, setFile] = useState<File | null>(initialValues?.file ?? null);
  const [position, setPosition] = useState(initialValues?.position ?? "");
  const [requiredSkills, setRequiredSkills] = useState(initialValues?.requiredSkills ?? "");
  const [qualifications, setQualifications] = useState(initialValues?.qualifications ?? "");
  const [dragOver, setDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
      setFile(f);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};

    const positionError = validateField(position, "position");
    if (positionError) errors.position = positionError;

    const skillsError = validateField(requiredSkills, "skills");
    if (skillsError) errors.skills = skillsError;

    const qualificationsError = validateField(qualifications, "qualifications");
    if (qualificationsError) errors.qualifications = qualificationsError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !position.trim()) return;
    if (!validateAllFields()) return;
    onSubmit(file, position.trim(), requiredSkills.trim(), qualifications.trim());
  }

  const canSubmit = !!file && !!position.trim() && !loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PDF Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resume (PDF)
        </label>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
            ${file ? "bg-green-50 border-green-400" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <a
                href={URL.createObjectURL(file)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-blue-600 hover:underline"
              >
                {file.name}
              </a>
              <span className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-red-500 hover:underline"
              >
                Change file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium">Drop PDF here, or click to select a file</span>
              <span className="text-xs">Supports .pdf files up to 20MB</span>
            </div>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Applied Position <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="e.g. Senior .NET Developer"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={MAX_LENGTHS.position}
          required
        />
        {validationErrors.position && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.position}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Required Skills
        </label>
        <textarea
          value={requiredSkills}
          onChange={(e) => setRequiredSkills(e.target.value)}
          placeholder="e.g. C#, .NET, SQL Server, REST API, Git"
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          maxLength={MAX_LENGTHS.skills}
        />
        {validationErrors.skills && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.skills}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Required Qualifications
        </label>
        <textarea
          value={qualifications}
          onChange={(e) => setQualifications(e.target.value)}
          placeholder="e.g. Bachelor's degree in IT, 3+ years of experience"
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          maxLength={MAX_LENGTHS.qualifications}
        />
        {validationErrors.qualifications && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.qualifications}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Spinner />
            Analyzing...
          </>
        ) : (
          "Analyze Resume"
        )}
      </button>
    </form>
  );
}
