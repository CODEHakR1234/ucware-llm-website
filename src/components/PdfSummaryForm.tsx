// llm-user-site/src/components/PdfSummaryForm.tsx
'use client'

import { useState, useRef } from 'react'

const LANG_OPTIONS = [
  { value: 'KO', label: '한국어' },
  { value: 'EN', label: 'English' },
]

export default function PdfSummaryForm() {
  const [pdfUrl, setPdfUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [followup, setFollowup] = useState('')
  const [followupLog, setFollowupLog] = useState<string[]>([])
  const [lang, setLang] = useState('KO')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isFollowupLoading, setIsFollowupLoading] = useState(false)

  const fileIdRef = useRef<string | null>(null)

  const generateFileId = (url: string) => {
    try {
      const namePart = url.split('/').pop()?.replace(/\W/g, '_') || 'file'
      return `fid_${Date.now()}_${namePart}`
    } catch {
      return `fid_${Date.now()}`
    }
  }

  const callApi = async (
    query: string,
    isFollowup: boolean = false,
    file_id: string
  ) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const setLoading = isFollowup ? setIsFollowupLoading : setIsSummarizing
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id, pdf_url: pdfUrl, query, lang }),
      })

      if (!res.ok) {
        const msg =
          res.status === 404
            ? '❗ PDF를 찾을 수 없습니다.'
            : res.status === 422
            ? '❗ 요청 정보가 잘못되었습니다.'
            : '❗ 요약 요청 실패'
        if (!isFollowup) setSummary(msg)
        return
      }

      const data = await res.json()
      const result = data.summary || JSON.stringify(data)

      if (isFollowup) {
        setFollowupLog((prev) => [...prev, `Q: ${query}\nA: ${result}`])
      } else {
        setSummary(result)
        setFollowupLog([])
      }
    } catch (err) {
      console.error(err)
      setSummary('❗ 요약 실패: 네트워크 오류 또는 서버 에러')
    } finally {
      setLoading(false)
    }
  }

  const handleInitialSummary = () => {
    const fid = generateFileId(pdfUrl)
    fileIdRef.current = fid
    callApi('SUMMARY_ALL', false, fid)
  }

  const handleFollowup = () => {
    if (!fileIdRef.current) return
    callApi(followup, true, fileIdRef.current)
  }

  return (
    <div>
      <label className="block mb-1 font-semibold">언어 선택</label>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="border p-2 mb-4"
      >
        {LANG_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label className="block mb-2 font-semibold">PDF URL</label>
      <input
        type="text"
        className="w-full border p-2 mb-4"
        value={pdfUrl}
        onChange={(e) => setPdfUrl(e.target.value)}
        placeholder="https://arxiv.org/pdf/xxxx.pdf"
      />

      <button
        onClick={handleInitialSummary}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
        disabled={isSummarizing || !pdfUrl}
      >
        {isSummarizing ? '요약 중...' : '요약 요청'}
      </button>

      {summary && (
        <div className="mt-4">
          <h2 className="font-bold mb-2">요약 결과</h2>
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm">{summary}</pre>

          <div className="mt-6">
            <label className="block mb-2 font-semibold">➕ 추가 질문</label>
            <input
              type="text"
              className="w-full border p-2 mb-2"
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
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

          {followupLog.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">📌 추가 질문 기록</h3>
              <ul className="space-y-2 text-sm">
                {followupLog.map((item, idx) => (
                  <li key={idx} className="bg-gray-50 border p-3 rounded whitespace-pre-wrap">
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

