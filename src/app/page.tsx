// llm-user-site/src/app/page.tsx
'use client'

import PdfSummaryForm from '../components/PdfSummaryForm'

export default function UserHomePage() {
  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📄 PDF 요약</h1>
      <PdfSummaryForm />
    </main>
  )
}

