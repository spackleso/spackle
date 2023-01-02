import Head from 'next/head'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'

export default function Home() {
  return (
    <div className="flex h-full min-h-screen flex-col">
      <Head>
        <title>Spackle - Feature access built on Stripe billing</title>
        <meta
          name="description"
          content="Spackle allows you to sell what you want without the engineering headache"
        />
      </Head>
      <Header />
      <main className="flex flex-grow items-center justify-center">
        <Hero />
      </main>
      <Footer />
    </div>
  )
}
