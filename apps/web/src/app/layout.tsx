import '@/app/globals.css'
import Script from 'next/script'
import { inter, lexend } from '@/lib/font'
import { Header } from '@/components/tailwindui/header'
import { Footer } from '@/components/tailwindui/footer'
import { PHProvider, PostHogPageView } from '@/components/posthog'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Spackle - Entitlements for Stripe Billing',
  description:
    'Meet the new billing abstraction loved by engineering and sales, startups and enterprises.',
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
          <PostHogPageView />
          <div className="from-0 flex min-h-screen flex-col gap-y-16 bg-gradient-to-b from-violet-600/10 to-black to-[800px]">
            <Header />
            {children}
            <Footer />
            <Toaster />
          </div>
        </body>
      </PHProvider>
    </html>
  )
}
