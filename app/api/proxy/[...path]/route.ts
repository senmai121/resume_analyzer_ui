import { SignJWT } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5077'
const JWT_SECRET = process.env.JWT_SECRET ?? ''
const JWT_ISSUER = process.env.JWT_ISSUER ?? 'ResumePDFAnalyzer'
const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'ResumePDFAnalyzerUsers'

async function makeToken(): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  return new SignJWT()
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('10m')
    .sign(secret)
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const token = await makeToken()
  const contentType = req.headers.get('Content-Type') ?? ''
  const isMultipart = contentType.startsWith('multipart/form-data')

  let res: Response

  if (isMultipart) {
    const formData = await req.formData()
    res = await fetch(`${API_BASE}/api/${path.join('/')}`, {
      method: req.method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
  } else {
    res = await fetch(`${API_BASE}/api/${path.join('/')}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: req.method !== 'GET' ? await req.text() : undefined,
    })
  }

  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  })
}

export { handler as GET, handler as POST }
