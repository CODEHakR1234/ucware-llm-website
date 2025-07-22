// src/components/PdfSummaryForm.tsx
'use client'

import { useState, useRef, useCallback } from 'react'

/**
 * 언어 선택 타입 & 옵션
 */
type Lang = 'KO' | 'EN'

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'KO', label: '한국어' },
  { value: 'EN', label: 'English' },
]

/**
 * PDF 요약 + 후속 질문 폼
 * ─────────────────────────────────────────
 *  ‣ 1) PDF URL, 언어 선택 → 요약 생성
 *  ‣ 2) 요약 결과 노출 + Follow‑up Q&A
 *  ‣ 3) 기본 Tailwind 스타일 + 접근성 개선
 */
export default function PdfSummaryForm() {
  /* ───────── 상태값 ───────────────────── */
  const [pdfUrl, setPdfUrl]             = useState('')
  const [lang, setLang]                 = useState<Lang>('KO')
  const [summary, setSummary]           = useState('')
  const [followup, setFollowup]         = useState('')
  const [followupLog, setFollowupLog]   = useState<string[]>([])
  const [status, setStatus]             = useState<'idle' | 'loading-summary' | 'loading-followup'>('idle')
  const [error, setError]               = useState('')

  /* ───────── 내부 레퍼런스 ─────────────── */
  const fileIdRef = useRef<string>()

  /* ───────── 유틸: URL → file_id 해시 ─── */
  const hash32 = (str: string) => {
    let h = 0
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
    return h.toString(16)
  }

  const generateFileId = (url: string) => {
    const normalized = url.trim().toLowerCase()
    const baseName = normalized.split('/').pop()?.replace(/\W/g, '_') || 'file'
    return `fid_${hash32(normalized)}_${baseName}`
  }

  /* ───────── 공통 API 호출 래퍼 ─────────── */
  const callApi = useCallback(
    async (query: string, followupMode = false) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
      if (!fileIdRef.current) return

      setStatus(followupMode ? 'loading-followup' : 'loading-summary')
      setError('')

      try {
        const res = await fetch(`${API_URL}/api/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: fileIdRef.current,
            pdf_url: pdfUrl,
            query,
            lang,
          }),
        })

        if (!res.ok) {
          throw new Error(res.status === 404 ? 'PDF를 찾을 수 없습니다.' : `서버 오류 (${res.status})`)
        }

        const data = await res.json()
        if (data.error) throw new Error(data.error)

        const answer = data.answer ?? data.summary ?? JSON.stringify(data)

        if (followupMode) {
          setFollowupLog(prev => [`Q: ${query}\nA: ${answer}`, ...prev])
        } else {
          setSummary(answer)
          setFollowupLog([])
        }
      } catch (e) {
        if (e instanceof Error) setError(`❗ ${e.message}`)
      } finally {
        setStatus('idle')
      }
    },
    [pdfUrl, lang],
  )

  /* ───────── 최초 요약 요청 ─────────────── */
  const handleInitialSummary = () => {
    fileIdRef.current = generateFileId(pdfUrl)
    callApi('SUMMARY_ALL')
  }

  /* ───────── Follow‑up 질문 ─────────────── */
  const handleFollowup = () => {
    if (!followup.trim()) return
    callApi(followup, true)
    setFollowup('')
  }

  const isLoading = status !== 'idle'

  /* ───────── UI 렌더링 ──────────────────── */
  return (
    <section className="space-y-6 rounded-2xl border p-6 shadow-xl">
      {/* URL 입력 */}
      <div className="space-y-2">
        <label className="font-semibold" htmlFor="pdfUrl">
          PDF URL
        </label>
        <input
          id="pdfUrl"
          type="url"
          required
          placeholder="https://arxiv.org/pdf/xxxx.pdf"
          value={pdfUrl}
          onChange={e => setPdfUrl(e.target.value)}
          className="w-full rounded border px-4 py-2"
        />
      </div>

      {/* 언어 선택 */}
      <div className="flex items-center gap-4">
        <label className="font-semibold" htmlFor="langSelect">
          🔤 응답 언어
        </label>
        <select
          id="langSelect"
          value={lang}
          onChange={e => setLang(e.target.value as Lang)}
          className="rounded border px-3 py-2"
        >
          {LANG_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 요약 버튼 */}
      <button
        onClick={handleInitialSummary}
        disabled={isLoading || !pdfUrl}
        className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {status === 'loading-summary' ? '요약 생성 중...' : '요약 만들기'}
      </button>

      {/* 오류 메시지 */}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* 요약 결과 */}
      {summary && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">📄 요약 결과</h2>
          <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm">{summary}</pre>

          {/* Follow‑up */}
          <div className="space-y-2">
            <label className="font-semibold" htmlFor="followupInput">
              ➕ 추가 질문
            </label>
            <div className="flex gap-2">
              <input
                id="followupInput"
                type="text"
                value={followup}
                onChange={e => setFollowup(e.target.value)}
                className="flex-1 rounded border px-4 py-2"
                placeholder="예: 결론을 한 문장으로 요약해줘"
              />
              <button
                onClick={handleFollowup}
                disabled={isLoading || !followup}
                className="rounded bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
              >
                {status === 'loading-followup' ? '질문 중...' : '질문하기'}
              </button>
            </div>
          </div>

          {/* Follow‑up 로그 */}
          {followupLog.length > 0 && (
            <details open className="rounded-lg bg-gray-50 p-4">
              <summary className="cursor-pointer font-semibold">📝 추가 질문 기록</summary>
              <ul className="mt-2 space-y-3 text-sm">
                {followupLog.map((item, idx) => (
                  <li key={idx} className="whitespace-pre-wrap rounded border p-3">
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  )
}

