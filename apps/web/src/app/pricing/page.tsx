'use client'

import { Container } from '@/components/tailwindui/container'
import PriceBox from '@/components/price-box'
import Link from 'next/link'
import { Button } from '@/components/tailwindui/button'

export default function Pricing() {
  return (
    <>
      <main className="flex flex-grow flex-col items-center justify-center pb-16">
        <Container className="flex w-full max-w-full flex-col items-center justify-center gap-y-8 py-20 lg:py-32">
          <h2 className="font-display mx-auto max-w-4xl text-center text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Pricing
          </h2>
          <p className="text-lg leading-8 text-slate-400">
            We get paid when you get paid
          </p>
          <div className="mt-8 flex max-w-sm flex-col gap-y-4 lg:max-w-5xl lg:flex-row lg:gap-x-12">
            <PriceBox
              price={{
                id: 'free',
                name: 'Free',
                price: 0,
                isPro: false,
              }}
            >
              <Button href="/signup" color="violet">
                Get Started
              </Button>
            </PriceBox>
            <PriceBox
              price={{
                id: 'pro',
                name: 'Pro',
                price: 300,
                isPro: true,
              }}
            >
              <Button href="/signup" color="violet">
                Get Started
              </Button>
            </PriceBox>
          </div>
          <div className="max-w-md text-sm text-slate-500 dark:text-slate-300">
            <p className="text-center leading-4">
              * MTR = Monthly tracked revenue. The amount of revenue managed by
              Spackle in a given month.
            </p>
          </div>
        </Container>
      </main>
    </>
  )
}
