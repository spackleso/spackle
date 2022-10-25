import { DocumentContext, Head, Html, Main, NextScript } from 'next/document'

export default function Document(props: any) {
  let pageProps = props.__NEXT_DATA__?.props?.pageProps

  return (
    <Html
      className="h-full scroll-smooth bg-white antialiased [font-feature-settings:'ss01']"
      lang="en"
    >
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Lexend:wght@400;500&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        ></link>
      </Head>
      <body className="flex h-full flex-col min-h-screen">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
