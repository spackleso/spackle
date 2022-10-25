import Head from 'next/head'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <Head>
        <title>Spackle - Feature access built on Stripe billing</title>
        <meta
          name="description"
          content="Spackle allows you to sell what you want without the engineering headache"
        />
      </Head>
      <Header />
      <main className="flex grow justify-center items-center">
        <Hero />
        {/* <PrimaryFeatures />
        <SecondaryFeatures />
        <CallToAction />
        <Testimonials />
        <Pricing />
        <Faqs /> */}
      </main>
      <Footer />
    </div>
  )
}
