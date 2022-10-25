import type { AppProps } from 'next/app'
import 'focus-visible'
import '@/styles/tailwind.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
