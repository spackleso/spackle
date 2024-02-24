import { Button } from '@/components/tailwindui/button'

export function Hero() {
  return (
    <div className="mx-auto max-w-4xl text-center sm:px-6">
      <h1 className="font-display mx-auto max-w-4xl text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
        Effortless Recurring Revenue
      </h1>
      <h2 className="text-md mx-auto mt-8 max-w-2xl tracking-tight text-slate-700 dark:text-slate-400 sm:text-lg">
        The easiest way to add Stripe Billing to your product. <br />
        Zero complexity, unlimited flexibility.
      </h2>
      <div className="mt-8 flex w-full flex-row items-center justify-center gap-4">
        <Button
          href="https://marketplace.stripe.com/apps/spackle"
          color="violet"
        >
          Get Started
        </Button>
        <Button
          href="https://savvycal.com/bolderresearch/spackle"
          color="transparent"
        >
          Schedule a Demo →
        </Button>
      </div>
    </div>
  )
}
