const PROXY = '/api/proxy'

export interface ExtractResponse {
  pageCount: number;
  fullText: string;
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  isAnalysisComplete: boolean;
}

export interface ResumeReportResponse {
  sessionId: string;
  score: number;
  suitability: string;
  gaps: string[];
  recruiterAdvice: string;
  suggestedQuestions: string[];
}

async function throwApiError(res: Response): Promise<never> {
  const body = await res.text()
  try {
    const json = JSON.parse(body)
    throw new Error(json.error ?? json.message ?? `API error: ${res.status}`)
  } catch {
    throw new Error(body || `API error: ${res.status}`)
  }
}

export async function extractPdf(file: File): Promise<ExtractResponse> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${PROXY}/pdf/extract`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function startAnalysis(
  resumeText: string,
  position: string,
  requiredSkills: string,
  qualifications: string
): Promise<ChatResponse> {
  const res = await fetch(`${PROXY}/resume/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile: { resumeText, position, requiredSkills, qualifications },
    }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function continueChat(
  sessionId: string,
  message: string
): Promise<ChatResponse> {
  const res = await fetch(`${PROXY}/resume/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function getReport(sessionId: string): Promise<ResumeReportResponse> {
  const res = await fetch(`${PROXY}/resume/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export interface CandidateInfo {
  name: string;
  age: string;
  title: string;
  email: string;
  tel: string;
}

export async function extractCandidateInfo(resumeText: string): Promise<CandidateInfo> {
  const res = await fetch(`${PROXY}/resume/candidate-info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export interface CandidateRanking {
  sessionId: string;
  rank: number;
  name: string;
  score: number;
  suitability: string;
  strengths: string[];
  weaknesses: string[];
}

export interface CompareResponse {
  ranking: CandidateRanking[];
  recommendation: string;
}

export async function compareResumes(sessionIds: string[]): Promise<CompareResponse> {
  const res = await fetch(`${PROXY}/resume/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionIds }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}
