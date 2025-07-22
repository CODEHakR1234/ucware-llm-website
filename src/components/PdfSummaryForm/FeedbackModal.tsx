// src/components/PdfSummaryForm/FeedbackModal.tsx
'use client'
import Spinner from '../common/Spinner'
import Stars from '../common/Stars'

type Props = {
  rating: number
  comment: string
  onRating: (n:number)=>void
  onComment: (s:string)=>void
  busy: boolean
  thanks: boolean
  onSubmit: () => void
  onClose: () => void
}
export default function FeedbackModal({ rating, comment, onRating, onComment, busy, thanks, onSubmit, onClose }: Props){
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-2xl dark:bg-neutral-900">
        <h2 className="text-xl font-bold flex items-center gap-2"><span role="img" aria-label="chart">📊</span> 서비스 평가</h2>
        {thanks? (
          <p className="text-green-600 dark:text-green-400">감사합니다! 소중한 의견이 저장되었습니다.</p>
        ):(
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">별점 (1~5)</label>
              <Stars value={rating} onChange={onRating}/>
            </div>
            <div className="space-y-2">
              <label htmlFor="cmt" className="text-sm font-medium">자세한 의견 (선택)</label>
              <textarea id="cmt" rows={4} value={comment} onChange={e=>onComment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"/>
            </div>
            <button onClick={onSubmit} disabled={busy}
              className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 disabled:opacity-60">
              {busy && <Spinner/>}
              <span>{busy? '등록 중…':'등록하기'}</span>
            </button>
          </>
        )}
        <button onClick={onClose} className="w-full rounded-lg border border-gray-300 py-2 text-sm text-gray-600 shadow-sm hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800">닫기</button>
      </div>
    </div>
  )
}
