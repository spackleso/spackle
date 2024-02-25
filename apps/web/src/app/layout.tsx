import '@/app/globals.css'
import Script from 'next/script'
import { inter, lexend } from '@/lib/font'
import { Header } from '@/components/tailwindui/header'
import { Footer } from '@/components/tailwindui/footer'
import PHProvider from '../components/posthog'

export const metadata = {
  title: 'Spackle - Product-Market-Pricing Fit Made Easy',
  description:
    'Low-code entitlement management platform that allows you to iterate on your pricing, close more deals, and create custom experiences for all of your customers',
}

export default function Layout({ children }: any) {
  return (
    <html
      className={`dark h-full scroll-smooth antialiased [font-feature-settings:'ss01'] ${inter.variable} ${lexend.variable}`}
      lang="en"
    >
      <head>
        <Script id="theme" />
      </head>
      <PHProvider>
        <body>
          <div className="from-0 flex flex-col gap-y-16 bg-gradient-to-b from-violet-600/10 to-black to-[800px]">
            <Header />
            <div className="py-24">{children}</div>
            <Footer />
          </div>
        </body>
      </PHProvider>
    </html>
  )
}
