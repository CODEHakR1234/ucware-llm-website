// llm-user-site/src/components/PdfSummaryForm.tsx
'use client'

import { useState, useRef } from 'react'

/* ─────────────────────────────────────────
 * 언어 선택 옵션
 * ───────────────────────────────────────── */
const LANG_OPTIONS = [
  { value: 'KO', label: '한국어' },
  { value: 'EN', label: 'English' },
]

/* ─────────────────────────────────────────
 * 컴포넌트
 * ───────────────────────────────────────── */
export default function PdfSummaryForm() {
  /* ① 상태값 */
  const [pdfUrl, setPdfUrl]           = useState('')
  const [summary, setSummary]         = useState('')
  const [followup, setFollowup]       = useState('')
  const [followupLog, setFollowupLog] = useState<string[]>([])
  const [lang, setLang]               = useState('KO')
  const [isSummarizing, setIsSummarizing]           = useState(false)
  const [isFollowupLoading, setIsFollowupLoading]   = useState(false)
  const [errorMsg, setErrorMsg]       = useState('')   // ⬅︎ 에러 메시지

  /* ② file_id 보존용 ref */
  const fileIdRef = useRef<string | null>(null)

  /* ③ URL → 32-bit 해시 → fid 생성 */
  const hash32 = (str: string): string => {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0
    }
    return h.toString(16)
  }

  const generateFileId = (url: string) => {
    const normalized = url.trim().toLowerCase()
    const baseName =
      normalized.split('/').pop()?.replace(/\W/g, '_') || 'file'
    return `fid_${hash32(normalized)}_${baseName}`
  }

  /* ④ API 호출 공통 함수 */
  const callApi = async (
    query: string,
    isFollowup = false,
    file_id: string,
  ) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const setLoading = isFollowup ? setIsFollowupLoading : setIsSummarizing
    setLoading(true)
    setErrorMsg('')                // 이전 에러 초기화

    try {
      const res = await fetch(`${API_URL}/api/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id, pdf_url: pdfUrl, query, lang }),
      })

      /* ── HTTP 단계 에러 ─────────────────── */
      if (!res.ok) {
        const msg =
          res.status === 404
            ? '❗ PDF를 찾을 수 없습니다.'
            : res.status === 422
            ? '❗ 요청 정보가 잘못되었습니다.'
            : `❗ 서버 오류 (${res.status})`
        setErrorMsg(msg)
        return
      }

      const data = await res.json()

      /* ── API 내부 에러 ──────────────────── */
      if (data.error) {
        setErrorMsg(`❗ ${data.error}`)
        return
      }

      /* ── 정상 응답 처리 ─────────────────── */
      const result = data.answer ?? data.summary ?? JSON.stringify(data)

      if (isFollowup) {
        setFollowupLog(prev => [`Q: ${query}\nA: ${result}`, ...prev])
      } else {
        setSummary(data.summary ?? '')
        setFollowupLog([])
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('❗ 요청 실패: 네트워크 오류 또는 서버 미응답')
    } finally {
      setLoading(false)
    }
  }

  /* ⑤ 최초 SUMMARY_ALL */
  const handleInitialSummary = () => {
    const fid = generateFileId(pdfUrl)
    fileIdRef.current = fid
    callApi('SUMMARY_ALL', false, fid)
  }

  /* ⑥ 추가 질문 */
  const handleFollowup = () => {
    if (!fileIdRef.current) return
    callApi(followup, true, fileIdRef.current)
  }

  /* ─────────────────────────────────────────
   * UI 렌더링
   * ───────────────────────────────────────── */
  return (
    <div>
      {/* 언어 선택 */}
      <label className="block mb-1 font-semibold">언어 선택</label>
      <select
        value={lang}
        onChange={e => setLang(e.target.value)}
        className="border p-2 mb-4"
      >
        {LANG_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* PDF URL 입력 */}
      <label className="block mb-2 font-semibold">PDF URL</label>
      <input
        type="text"
        className="w-full border p-2 mb-4"
        value={pdfUrl}
        onChange={e => setPdfUrl(e.target.value)}
        placeholder="https://arxiv.org/pdf/xxxx.pdf"
      />

      {/* 요약 요청 버튼 */}
      <button
        onClick={handleInitialSummary}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
        disabled={isSummarizing || !pdfUrl}
      >
        {isSummarizing ? '요약 중...' : '요약 요청'}
      </button>

      {/* ── 에러 메시지 ───────────────────── */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {errorMsg}
        </div>
      )}

      {/* ── 요약 결과 + 추가 질문 UI ───────── */}
      {summary && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">요약 결과</h2>
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm">
            {summary}
          </pre>

          {/* 추가 질문 입력 */}
          <div className="mt-6">
            <label className="block mb-2 font-semibold">➕ 추가 질문</label>
            <input
              type="text"
              className="w-full border p-2 mb-2"
              value={followup}
              onChange={e => setFollowup(e.target.value)}
              placeholder="예: 결론을 요약해줘"
            />
            <button
              onClick={handleFollowup}
              className="px-4 py-2 bg-green-600 text-white rounded"
              disabled={isFollowupLoading || !followup}
            >
              {isFollowupLoading ? '질문 중...' : '질문하기'}
            </button>
          </div>

          {/* 추가 질문 로그 */}
          {followupLog.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">📌 추가 질문 기록</h3>
              <ul className="space-y-2 text-sm">
                {followupLog.map((item, idx) => (
                  <li
                    key={idx}
                    className="bg-gray-50 border p-3 rounded whitespace-pre-wrap"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

