import '@/app/globals.css'
import Script from 'next/script'
import { inter, lexend } from '@/app/font'

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
  title: 'Spackle - Feature access built on Stripe billing',
  description:
    'Spackle allows you to sell what you want without the engineering headache',
}

export default function Layout({ children }: any) {
  return (
    <html
      className={`h-full scroll-smooth bg-white antialiased [font-feature-settings:'ss01'] ${inter.variable} ${lexend.variable}`}
      lang="en"
    >
      <head>
        <Script id="theme" dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LXGRKPLKKY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-LXGRKPLKKY');
          `}
        </Script>
      </head>
      <body className="bg-white dark:bg-slate-900">{children}</body>
    </html>
  )
}
