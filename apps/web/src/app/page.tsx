import { Hero } from '@/app/Hero'
import { Container } from '@/app/Container'
import { WaitListForm } from './WaitListForm'

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
              <p className="mx-auto max-w-4xl text-slate-900 dark:text-white">
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
              <p className="mx-auto max-w-4xl text-slate-900 dark:text-white">
                Spackle handles all of your enterpriese billing scenarios with
                ease. One-off product packages no longer require meetings with
                engineering or a codebase filled with billing related
                complexity.
              </p>
            </div>
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Close With Confidence
              </h3>
              <p className="mx-auto max-w-4xl text-slate-900 dark:text-white">
                The ability to negotiate product and pricing is a competitive
                advantage. Close more deals at the best price with the knowledge
                that the product will handle it.
              </p>
            </div>
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                All On Stripe Billing
              </h3>
              <p className="mx-auto max-w-4xl text-slate-900 dark:text-white">
                Spackle meets you where you already are. Spackle is available in
                the Stripe App Marketplace and integrates directly with the
                Stripe platform. Spackle extends the product and pricing
                functionality you&apos;ve already invested in. Integrate without
                missing a beat.
              </p>
            </div>
          </Container>
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
              <p className="mx-auto max-w-4xl text-slate-900 dark:text-white">
                Use any of our SDKs to integrate with Spackle in just a few
                lines of code. Entitlement authorization should be as easy as a
                single if statement.
              </p>
            </div>
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Tiny Footprint
              </h3>
              <p className="mx-auto max-w-4xl text-slate-900 dark:text-white">
                Spackle takes advantage of global datastores to prevent high
                memory usage while maintaining low latency.
              </p>
            </div>
            <div className="mt-8 w-full">
              <h3 className="font-display mx-auto max-w-4xl text-lg font-medium tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Remove Stripe Complexity
              </h3>
              <p className="mx-auto max-w-4xl text-slate-900 dark:text-white">
                Stripe billing requires you to replicate their data model in
                your application. That leads to high implementation and
                maintenance costs over the life of your product. Spackle allows
                you to leverage the power of Stripe Billing without the steep
                engineering cost.
              </p>
            </div>
          </Container>
        </Container>
        <hr className="my-8 h-px w-full max-w-4xl border-0 bg-gray-200 dark:bg-gray-700" />

        <Container className="flex w-full max-w-full flex-col items-center justify-center py-20 lg:py-32">
          <h2 className="font-display mx-auto max-w-4xl text-center text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Get Started
          </h2>
          <Container className="mt-8 w-full">
            <p className="mx-auto max-w-xl text-slate-900 text-slate-700 dark:text-slate-400">
              Spackle is currently in invite-only beta. Enter your email below
              to add yourself to the wait list.
            </p>
          </Container>
          <WaitListForm />
        </Container>
        <hr className="my-8 h-px w-full max-w-4xl border-0 bg-gray-200 dark:bg-gray-700" />
      </main>
    </>
  )
}
