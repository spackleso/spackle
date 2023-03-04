'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/query'
import { Analytics } from '@vercel/analytics/react'

export default function Template({ children }: any) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Analytics />
    </QueryClientProvider>
  )
}
