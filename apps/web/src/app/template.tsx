'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/query'

export default function Template({ children }: any) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
