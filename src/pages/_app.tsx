import type { AppProps } from 'next/app'
import 'focus-visible'
import '@/styles/tailwind.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/query'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}

export default MyApp
