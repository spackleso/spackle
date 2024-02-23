import { Hero } from '@/components/tailwindui/hero'
import { Container } from '@/components/tailwindui/container'
import PriceBox, { Price } from '@/components/price-box'
import Link from 'next/link'

const prices: Price[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    isPro: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 300,
    isPro: true,
  },
]

export default function Home() {
  return (
    <>
      <main className="flex flex-grow flex-col items-center justify-center pb-16">
        <Hero />
        <hr className="my-8 h-px w-full max-w-4xl border-0 bg-gray-200 dark:bg-gray-700" />
        <Container className="flex w-full flex-col items-center justify-center py-16 lg:py-28">
          <h2 className="font-display mx-auto max-w-4xl text-center text-2xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            For Sales & Pricing Teams
          </h2>
          <Container className="mt-8 w-full">
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Leverage Iterative Pricing
              </h3>
              <p className="mx-auto max-w-4xl text-slate-700 text-slate-900 dark:text-slate-400">
                Iterative design isn&apos;t limited only to your product.
                Spackle allows you to experiment with different pricing and
                product packages easily. Walk into every customer call knowing
                you&apos;re offering the best product at the best price.
              </p>
            </div>
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Create Custom Experiences
              </h3>
              <p className="mx-auto max-w-4xl text-slate-700 text-slate-900 dark:text-slate-400">
                Spackle handles all of your enterprise billing scenarios with
                ease. One-off product packages no longer require meetings with
                engineering or a codebase filled with billing related
                complexity.
              </p>
            </div>
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Close With Confidence
              </h3>
              <p className="mx-auto max-w-4xl text-slate-700 text-slate-900 dark:text-slate-400">
                The ability to negotiate product and pricing is a competitive
                advantage. Close more deals at the best price with the knowledge
                that the product will handle it.
              </p>
            </div>
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Built On Stripe Billing
              </h3>
              <p className="mx-auto max-w-4xl text-slate-700 text-slate-900 dark:text-slate-400">
                Spackle meets you where you already are. Spackle is available in
                the Stripe App Marketplace and integrates directly with the
                Stripe platform. Spackle extends the product and pricing
                functionality you&apos;ve already invested in. Integrate without
                missing a beat.
              </p>
            </div>
          </Container>
          <Link
            href="/posts/saas-entitlements-the-basics"
            className="mt-16 text-lg font-semibold leading-6 text-gray-900 underline dark:text-white"
          >
            Read about entitlements →
          </Link>
        </Container>
        <hr className="my-8 h-px w-full max-w-4xl border-0 bg-gray-200 dark:bg-gray-700" />
        <Container className="flex w-full max-w-full flex-col items-center justify-center py-20 lg:py-32">
          <h2 className="font-display mx-auto max-w-4xl text-center text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            For Developers
          </h2>
          <Container className="mt-8 w-full">
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Simple Integration
              </h3>
              <p className="mx-auto max-w-4xl text-slate-700 text-slate-900 dark:text-slate-400">
                Use any of our SDKs to integrate with Spackle in just a few
                lines of code. Entitlement authorization should be as easy as a
                single if statement.
              </p>
            </div>
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Tiny Footprint
              </h3>
              <p className="mx-auto max-w-4xl text-slate-700 text-slate-900 dark:text-slate-400">
                Spackle takes advantage of global datastores to prevent high
                memory usage while maintaining low latency.
              </p>
            </div>
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                De-Stripe Your Codebase
              </h3>
              <p className="mx-auto max-w-4xl text-slate-700 text-slate-900 dark:text-slate-400">
                Stripe billing requires you to replicate their data model in
                your application. That leads to high implementation and
                maintenance costs over the life of your product. Spackle allows
                you to leverage the power of Stripe Billing without the steep
                engineering cost.
              </p>
            </div>
          </Container>
          <Link
            href="https://docs.spackle.so/"
            className="mt-16 text-lg font-semibold leading-6 text-gray-900 underline dark:text-white"
          >
            Read the docs →
          </Link>
        </Container>

        <hr className="my-8 h-px w-full max-w-4xl border-0 bg-gray-200 dark:bg-gray-700" />

        <Container className="flex w-full max-w-full flex-col items-center justify-center gap-y-8 py-20 lg:py-32">
          <h2 className="font-display mx-auto max-w-4xl text-center text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Pricing
          </h2>
          <div className="mt-8 flex max-w-sm flex-col gap-y-4 lg:max-w-5xl lg:flex-row lg:gap-x-12">
            {prices.map((price) => (
              <PriceBox key={price.id} price={price}>
                <Link
                  href="https://marketplace.stripe.com/apps/spackle"
                  className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-25"
                >
                  Add to Stripe
                </Link>
              </PriceBox>
            ))}
          </div>
          <div className="max-w-md text-sm text-slate-500 dark:text-slate-300">
            <p className="text-center leading-4">
              * MTR = Monthly tracked revenue. The amount of revenue managed by
              Spackle in a given month.
            </p>
          </div>
        </Container>

        <hr className="my-8 h-px w-full max-w-4xl border-0 bg-gray-200 dark:bg-gray-700" />

        <Container className="flex w-full max-w-full flex-col items-center justify-center gap-y-8 py-20 lg:py-32">
          <h2 className="font-display mx-auto max-w-4xl text-center text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <Link
            href="https://marketplace.stripe.com/apps/spackle"
            className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-25"
          >
            Add to Stripe
          </Link>
        </Container>
        <hr className="my-8 h-px w-full max-w-4xl border-0 bg-gray-200 dark:bg-gray-700" />
      </main>
    </>
  )
}
