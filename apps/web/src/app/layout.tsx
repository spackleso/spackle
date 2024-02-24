import '@/app/globals.css'
import Script from 'next/script'
import { inter, lexend } from '@/lib/font'
import { Header } from '@/components/tailwindui/header'
import { Footer } from '@/components/tailwindui/footer'
import PHProvider from '../components/posthog'

const themeScript = `
  let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)')

  function updateTheme(theme) {
    theme = theme ?? window.localStorage.theme ?? 'system'

    if (theme === 'dark' || (theme === 'system' && isDarkMode.matches)) {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light' || (theme === 'system' && !isDarkMode.matches)) {
      document.documentElement.classList.remove('dark')
    }

    return theme
  }

  function updateThemeWithoutTransitions(theme) {
    updateTheme(theme)
    document.documentElement.classList.add('[&_*]:!transition-none')
    window.setTimeout(() => {
      document.documentElement.classList.remove('[&_*]:!transition-none')
    }, 0)
  }

  document.documentElement.setAttribute('data-theme', updateTheme())

  new MutationObserver(([{ oldValue }]) => {
    let newValue = document.documentElement.getAttribute('data-theme')
    if (newValue !== oldValue) {
      try {
        window.localStorage.setItem('theme', newValue)
      } catch {}
      updateThemeWithoutTransitions(newValue)
    }
  }).observe(document.documentElement, { attributeFilter: ['data-theme'], attributeOldValue: true })

  isDarkMode.addEventListener('change', () => updateThemeWithoutTransitions())
`

export const metadata = {
  title: 'Spackle - Product-Market-Pricing Fit Made Easy',
  description:
    'Low-code entitlement management platform that allows you to iterate on your pricing, close more deals, and create custom experiences for all of your customers',
}

export default function Layout({ children }: any) {
  return (
    <html
      className={`h-full scroll-smooth bg-white antialiased [font-feature-settings:'ss01'] ${inter.variable} ${lexend.variable}`}
      lang="en"
    >
      <head>
        <Script id="theme" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <PHProvider>
        <body className="bg-white dark:bg-black">
          <div className="flex h-full min-h-screen flex-col gap-y-32">
            <Header />
            {children}
            <Footer />
          </div>
        </body>
      </PHProvider>
    </html>
  )
}
