import { Container } from '@/app/Container'
import { WaitListForm } from './WaitListForm'

export function Hero() {
  return (
    <Container className="py-16 text-center lg:pt-8">
      <h1 className="font-display mx-auto max-w-4xl text-5xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-7xl">
        Product-Market-
        <span className="relative text-violet-600 underline">Pricing</span> Fit
        Made Easy
      </h1>
      <h2 className="mx-auto mt-8 max-w-2xl text-xl tracking-tight text-slate-700 dark:text-slate-400">
        Spackle&apos;s low-code entitlement management platform allows you to
        iterate on your pricing, close more deals, and create custom experiences
        for all of your customers
      </h2>
      <WaitListForm />
    </Container>
  )
}
