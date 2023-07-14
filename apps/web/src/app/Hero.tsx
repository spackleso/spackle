import { Container } from '@/app/Container'
import Link from 'next/link'
import { WaitListForm } from './WaitListForm'

export function Hero() {
  return (
    <div className="mx-auto max-w-4xl py-16 px-4 text-center sm:px-6 lg:px-8 lg:pt-8">
      <h1 className="font-display mx-auto max-w-4xl text-5xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-7xl">
        Product-Market-
        <span className="relative text-violet-600 underline">Pricing</span> Fit
        Made Easy
      </h1>
      <h2 className="mx-auto mt-8 max-w-2xl text-xl tracking-tight text-slate-700 dark:text-slate-400">
        Spackle&apos;s low-code entitlement platform allows you to iterate on
        your pricing, close more deals, and create one of a kind experiences for
        all of your customers
      </h2>
      <div className="mt-12 flex w-full flex-row items-center justify-center gap-4">
        <Link
          href="https://marketplace.stripe.com/apps/spackle"
          className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-25"
        >
          Add to Stripe
        </Link>
        <Link
          href="https://docs.spackle.so/"
          className="text-sm font-semibold leading-6 text-gray-900 dark:text-white"
        >
          Quick Start →
        </Link>
      </div>
    </div>
  )
}
