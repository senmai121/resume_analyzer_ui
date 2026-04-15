"use client";

import { useRef, useState } from "react";
import Spinner from "./Spinner";
import { validateField, MAX_LENGTHS } from "@/lib/inputValidation";

const MAX_FILES = 3;

interface Props {
  onSubmit: (
    files: File[],
    position: string,
    requiredSkills: string,
    qualifications: string
  ) => void;
  loading: boolean;
  initialValues?: {
    files: File[];
    position: string;
    requiredSkills: string;
    qualifications: string;
  };
}

export default function UploadStep({ onSubmit, loading, initialValues }: Props) {
  const [files, setFiles] = useState<File[]>(initialValues?.files ?? []);
  const [position, setPosition] = useState(initialValues?.position ?? "");
  const [requiredSkills, setRequiredSkills] = useState(initialValues?.requiredSkills ?? "");
  const [qualifications, setQualifications] = useState(initialValues?.qualifications ?? "");
  const [dragOver, setDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | File[]) {
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    setFiles((prev) => {
      const combined = [...prev];
      for (const f of pdfs) {
        if (combined.length >= MAX_FILES) break;
        // Avoid duplicates by name
        if (!combined.some((existing) => existing.name === f.name)) {
          combined.push(f);
        }
      }
      return combined;
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
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
    if (files.length === 0 || !position.trim()) return;
    if (!validateAllFields()) return;
    onSubmit(files, position.trim(), requiredSkills.trim(), qualifications.trim());
  }

  const canSubmit = files.length > 0 && !!position.trim() && !loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PDF Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resumes (PDF) — up to {MAX_FILES} files
        </label>

        {/* Drop zone */}
        <div
          onClick={() => files.length < MAX_FILES && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors
            ${files.length >= MAX_FILES
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              : dragOver
              ? "border-blue-500 bg-blue-50 cursor-pointer"
              : "border-gray-300 hover:border-gray-400 cursor-pointer"
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
          />
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {files.length >= MAX_FILES ? (
              <span className="font-medium text-sm">Maximum {MAX_FILES} files reached</span>
            ) : (
              <>
                <span className="font-medium text-sm">Drop PDFs here, or click to add files</span>
                <span className="text-xs">Supports .pdf files up to 20MB each</span>
              </>
            )}
          </div>
        </div>

        {/* File counter */}
        <p className="text-xs text-gray-500 mt-1.5 text-right">
          {files.length} / {MAX_FILES} resumes
        </p>

        {/* File list */}
        {files.length > 0 && (
          <ul className="mt-2 space-y-2">
            {files.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
              >
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <a
                  href={URL.createObjectURL(f)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-sm font-medium text-blue-600 hover:underline truncate"
                >
                  {f.name}
                </a>
                <span className="text-xs text-gray-500 shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-red-400 hover:text-red-600 shrink-0 transition-colors"
                  aria-label="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
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
          rows={4}
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
          `Analyze ${files.length > 1 ? `${files.length} Resumes` : "Resume"}`
        )}
      </button>
    </form>
  );
}
