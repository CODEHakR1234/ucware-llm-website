// src/components/PdfSummaryForm/PdfSummaryForm.tsx
'use client'
import { useState, useRef, useCallback } from 'react'
import Spinner from '../common/Spinner'
import FollowUpModal from './FollowUpModal'
import FeedbackModal from './FeedbackModal'

export type Lang = 'KO' | 'EN'
const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'KO', label: '한국어' },
  { value: 'EN', label: 'English' },
]

type Phase = 'input'|'followup'|'feedback'

export default function PdfSummaryForm(){
  /* base state */
  const [pdfUrl,setPdfUrl]=useState('')
  const [lang,setLang]=useState<Lang>('KO')
  const [status,setStatus]=useState<'idle'|'loading-summary'|'loading-followup'|'submitting-feedback'>('idle')
  const [error,setError]=useState('')
  const [phase,setPhase]=useState<Phase>('input')

  /* summary & log */
  const [summary,setSummary]=useState('')
  const [followupLog,setFollowupLog]=useState<string[]>([])

  /* feedback */
  const [rating,setRating]=useState(0)
  const [comment,setComment]=useState('')
  const [thanks,setThanks]=useState(false)

  /* refs */
  const fileIdRef=useRef<string|null>(null)
  const hash32=(s:string)=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h.toString(16)}
  const genId=(url:string)=>{const n=url.trim().toLowerCase();const base=n.split('/').pop()?.replace(/\W/g,'_')||'file';return `fid_${hash32(n)}_${base}`}

  /* api wrapper */
  const callApi=useCallback(async(query:string,follow=false)=>{
    const API=process.env.NEXT_PUBLIC_API_URL??'http://localhost:8000'
    if(!fileIdRef.current)return;
    setStatus(follow?'loading-followup':'loading-summary');setError('')
    try{
      const r=await fetch(`${API}/api/summary`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_id:fileIdRef.current,pdf_url:pdfUrl,query,lang})})
      if(!r.ok)throw new Error(r.status===404?'PDF를 찾을 수 없습니다.':`서버 오류 (${r.status})`)
      const d=await r.json();if(d.error)throw new Error(d.error)
      const ans=d.answer??d.summary??JSON.stringify(d)
      if(follow){setFollowupLog(prev=>[`Q: ${query}\nA: ${ans}`,...prev])}
      else{setSummary(ans);setFollowupLog([]);setPhase('followup')}
    }catch(e:any){setError(`❗ ${e.message}`)}finally{setStatus('idle')}
  },[pdfUrl,lang])

  /* handlers */
  const handleSummary=()=>{fileIdRef.current=genId(pdfUrl);callApi('SUMMARY_ALL')}
  const handleAsk=(q:string)=>{callApi(q,true)}
  const submitFeedback=async()=>{
    if(!rating)return alert('별점을 선택하세요!')
    setStatus('submitting-feedback')
    try{await new Promise(r=>setTimeout(r,800));setThanks(true)}finally{setStatus('idle')}
  }

  /* base render */
  return (
    <>
      {phase==='input'&&(
        <section className="mx-auto max-w-xl space-y-8 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/70">
          <header className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><span role="img" aria-label="pdf">📄</span>PDF 요약</h1>
          </header>
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">PDF URL</label>
            <input id="url" type="url" value={pdfUrl} onChange={e=>setPdfUrl(e.target.value)} required placeholder="https://arxiv.org/pdf/xxxx.pdf"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"/>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label htmlFor="lang" className="text-sm font-medium">🔤 응답 언어</label>
            <select id="lang" value={lang} onChange={e=>setLang(e.target.value as Lang)}
              className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100">
              {LANG_OPTIONS.map(o=>(<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <button onClick={handleSummary} disabled={status!=='idle'||!pdfUrl}
            className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 disabled:opacity-60">
            {status==='loading-summary'&&<Spinner/>}
            <span>{status==='loading-summary'?'요약 생성 중…':'요약 만들기'}</span>
          </button>
          {error&&<p className="text-red-600 text-sm">{error}</p>}
        </section>
      )}

      {phase==='followup'&&(
        <FollowUpModal summary={summary} followupLog={followupLog} onAsk={handleAsk} busy={status==='loading-followup'} onNext={()=>setPhase('feedback')}/>
      )}

      {phase==='feedback'&&(
        <FeedbackModal rating={rating} comment={comment} onRating={setRating} onComment={setComment} busy={status==='submitting-feedback'} thanks={thanks} onSubmit={submitFeedback} onClose={()=>setPhase('input')}/>
      )}
    </>
  )
}
