import { Button } from '@/components/tailwindui/button'

export function Hero() {
  return (
    <div className="mx-auto flex flex-col gap-y-12 text-center sm:px-6">
      <div className="flex flex-col gap-y-4">
        <h1 className="font-display mx-auto text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          Effortless Recurring Revenue
        </h1>
        <h2 className="mx-auto max-w-2xl text-lg font-semibold tracking-tight text-slate-700 dark:text-slate-400 sm:text-xl">
          The easiest way to add Stripe Billing to your product. <br />
          Zero complexity, unlimited flexibility.
        </h2>
      </div>
      <div className="flex w-full flex-row items-center justify-center gap-4">
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
