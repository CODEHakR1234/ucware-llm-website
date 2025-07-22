'use client'

import { useState, useRef, useCallback } from 'react'
import Spinner from '../common/Spinner'
import FollowUpCard from './FollowUpCard'
import FeedbackModal from './FeedbackModal'

export type Lang = 'KO' | 'EN'
const LANG_OPTIONS = [
  { value: 'KO', label: '한국어' },
  { value: 'EN', label: 'English' },
] as const

type Phase = 'input' | 'summary'

export default function PdfSummaryForm() {
  /* ── 상태 ── */
  const [phase, setPhase] = useState<Phase>('input')
  const [status, setStatus] = useState<
    'idle' | 'loading-summary' | 'loading-followup' | 'submitting-feedback'
  >('idle')
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [lang, setLang] = useState<Lang>('KO')
  const [summary, setSummary] = useState('')
  const [followupLog, setFollowupLog] = useState<string[]>([])

  /* ── 평가 모달 ── */
  const [showFeedback, setShowFeedback] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [thanks, setThanks] = useState(false)

  /* ── 파일 ID 유틸 ── */
  const fileIdRef = useRef<string | null>(null)
  const hash32 = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return h.toString(16)
  }
  const genId = (url: string) => {
    const norm = url.trim().toLowerCase()
    const base = norm.split('/').pop()?.replace(/\W/g, '_') || 'file'
    return `fid_${hash32(norm)}_${base}`
  }

  /* ── API 래퍼 ── */
  const callApi = useCallback(
    async (query: string, follow = false) => {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
      if (!fileIdRef.current) return

      setStatus(follow ? 'loading-followup' : 'loading-summary')
      setError('')

      try {
        const res = await fetch(`${API}/api/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: fileIdRef.current,
            pdf_url: pdfUrl,
            query,
            lang,
          }),
        })
        if (!res.ok)
          throw new Error(
            res.status === 404 ? 'PDF를 찾을 수 없습니다.' : `서버 오류 (${res.status})`
          )

        const data = await res.json()
        if (data.error) throw new Error(data.error)

        const answer = data.answer ?? data.summary ?? JSON.stringify(data)
        if (follow) {
          setFollowupLog(prev => [`Q: ${query}\nA: ${answer}`, ...prev])
        } else {
          setSummary(answer)
          setFollowupLog([])
          setPhase('summary')
        }
      } catch (e: any) {
        setError(`❗ ${e.message}`)
      } finally {
        setStatus('idle')
      }
    },
    [pdfUrl, lang]
  )

  /* ── 핸들러 ── */
  const handleSummary = () => {
    fileIdRef.current = genId(pdfUrl)
    callApi('SUMMARY_ALL')
  }
  const handleAsk = (q: string) => callApi(q, true)

  const submitFeedback = async () => {
    if (!rating) return alert('별점을 선택하세요!')
    setStatus('submitting-feedback')
    try {
      await new Promise(r => setTimeout(r, 800)) // TODO: 실제 API로 교체
      setThanks(true)
    } finally {
      setStatus('idle')
    }
  }

  /* ── 렌더 ── */
  return (
    <>
      {/** ── summary 단계면 그리드, 아니면 단독 카드 ── */}
      <section
        className={`mx-auto ${
          phase === 'summary' ? 'grid max-w-5xl gap-6 md:grid-cols-2' : 'max-w-xl'
        }`}
      >
        {/** ── 왼쪽 카드: 입력 + (summary 시) 결과 ── */}
        <section
          className="flex h-full flex-col space-y-6 rounded-3xl border border-gray-200
                     bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-neutral-700
                     dark:bg-neutral-900/70"
        >
          {/** 제목 */}
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <span role="img" aria-label="pdf">
              📄
            </span>
            PDF 요약
          </h1>

          {/** URL 입력 */}
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              PDF URL
            </label>
            <input
              id="url"
              type="url"
              value={pdfUrl}
              onChange={e => setPdfUrl(e.target.value)}
              required
              placeholder="https://arxiv.org/pdf/xxxx.pdf"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm
                         shadow-sm focus:border-blue-500 focus:outline-none
                         focus:ring focus:ring-blue-200 dark:border-neutral-700
                         dark:bg-neutral-800 dark:text-gray-100"
            />
          </div>

          {/** 언어 선택 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label htmlFor="lang" className="text-sm font-medium">
              🔤 응답 언어
            </label>
            <select
              id="lang"
              value={lang}
              onChange={e => setLang(e.target.value as Lang)}
              className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:border-blue-500 focus:outline-none
                         focus:ring focus:ring-blue-200 dark:border-neutral-700
                         dark:bg-neutral-800 dark:text-gray-100"
            >
              {LANG_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/** 요약/재요약 버튼 */}
          <button
            onClick={handleSummary}
            disabled={status === 'loading-summary' || !pdfUrl}
            className="relative flex w-full items-center justify-center gap-2 rounded-lg
                       bg-blue-600 py-2 font-semibold text-white shadow-lg
                       transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {status === 'loading-summary' && <Spinner />}
            <span>{phase === 'input' ? '요약 만들기' : '요약'}</span>
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/** ── 요약 결과 (summary 단계에서만) ── */}
          {phase === 'summary' && (
            <div className="flex flex-col space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span role="img" aria-label="result">
                  📝
                </span>
                요약 결과
              </h2>
              <pre
                className="flex-grow max-h-[60vh] overflow-y-auto whitespace-pre-wrap
                           rounded-xl bg-gray-50 p-4 text-sm leading-relaxed shadow-inner
                           dark:bg-neutral-800 dark:text-gray-100"
              >
                {summary}
              </pre>
            </div>
          )}
        </section>

        {/** ── 오른쪽: Follow-up 카드 ── */}
        {phase === 'summary' && (
          <FollowUpCard
            busy={status === 'loading-followup'}
            followupLog={followupLog}
            onAsk={handleAsk}
            onOpenFeedback={() => {
              setShowFeedback(true)
              setThanks(false)
            }}
          />
        )}
      </section>

      {/** ── 평가 모달 ── */}
      {showFeedback && (
        <FeedbackModal
          rating={rating}
          comment={comment}
          onRating={setRating}
          onComment={setComment}
          busy={status === 'submitting-feedback'}
          thanks={thanks}
          onSubmit={submitFeedback}
          onClose={() => {
            setShowFeedback(false)
            setRating(0)
            setComment('')
            setThanks(false)
          }}
        />
      )}
    </>
  )
}

