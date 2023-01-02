import '../../styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/query'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
