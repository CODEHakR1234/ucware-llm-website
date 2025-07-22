// src/components/PdfSummaryForm/FollowUpModal.tsx
'use client'
import { useState } from 'react'
import Spinner from '../common/Spinner'

type Props = {
  summary: string
  followupLog: string[]
  onAsk: (q: string) => void
  busy: boolean
  onNext: () => void // switch to feedback
}

export default function FollowUpModal({ summary, followupLog, onAsk, busy, onNext }: Props) {
  const [q, setQ] = useState('')
  const handle = () => {
    if (!q.trim()) return
    onAsk(q)
    setQ('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Modal card */}
      <div className="w-full max-w-2xl flex flex-col rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 max-h-[90vh]">
        {/* ───── Header ───── */}
        <div className="p-8 pb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <span role="img" aria-label="result">📝</span> 요약 결과
          </h2>
        </div>

        {/* ───── Scrollable body ───── */}
        <div className="flex-grow overflow-y-auto px-8 space-y-6 pb-4">
          <pre className="whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-relaxed dark:bg-neutral-800 dark:text-gray-100">
            {summary}
          </pre>

          {/* Follow‑up 입력 */}
          <div className="space-y-2">
            <label htmlFor="fu" className="text-sm font-medium">➕ 추가 질문</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="fu"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="예: 결론을 한 문장으로 요약해줘"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-green-600 focus:outline-none focus:ring focus:ring-green-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
              />
              <button
                onClick={handle}
                disabled={busy || !q}
                className="relative flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white shadow-lg transition-colors hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && <Spinner />}
                <span>{busy ? '질문 중…' : '질문하기'}</span>
              </button>
            </div>
          </div>

          {/* Follow‑up 로그 */}
          {followupLog.length > 0 && (
            <details open className="rounded-xl bg-gray-50 px-6 py-4 dark:bg-neutral-800/50">
              <summary className="cursor-pointer text-sm font-medium">🗒️ 추가 질문 기록</summary>
              <ul className="mt-4 space-y-4 text-sm">
                {followupLog.map((item, i) => (
                  <li
                    key={i}
                    className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* ───── Footer ───── */}
        <div className="p-8 pt-4 border-t border-gray-200 dark:border-neutral-700">
          <button
            onClick={onNext}
            className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-lg hover:bg-blue-700"
          >
            평가하기 ➡️
          </button>
        </div>
      </div>
    </div>
  )
}
