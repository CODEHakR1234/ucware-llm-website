// src/app/page.tsx
'use client'

import PdfSummaryForm from '@/components/PdfSummaryForm/PdfSummaryForm'  // ← 폴더만 지정

export default function UserHomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <span role="img" aria-label="pdf">📄</span>
        <span>PDF 요약</span>
      </h1>
      <PdfSummaryForm />
    </main>
  )
}
