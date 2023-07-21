import { Container } from '@/app/Container'
import PriceBox from '@/app/PriceBox'
import Link from 'next/link'
import { cookies } from 'next/headers'

export default function Checkout() {
  const cookieStore = cookies()
  const user_id = cookieStore.get('user_id')?.value
  const account_id = cookieStore.get('account_id')?.value
  const email = cookieStore.get('email')?.value
  const sig = cookieStore.get('sig')?.value
  return (
    <>
      <main className="flex flex-grow flex-col items-center justify-center pb-16">
        <Container className="flex w-full max-w-full flex-col items-center justify-center gap-y-8 py-20 lg:py-32">
          <h2 className="font-display mx-auto max-w-4xl text-center text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Upgrade to Spackle Pro
          </h2>
          <div className="mt-8 flex max-w-sm flex-col gap-y-4 lg:max-w-5xl lg:flex-row lg:gap-x-12">
            <PriceBox
              price={{
                id: 'free',
                name: 'Free',
                price: 0,
                isPro: false,
              }}
            >
              <button
                disabled={true}
                className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-25"
              >
                Current Plan
              </button>
            </PriceBox>
            <PriceBox
              price={{
                id: 'pro',
                name: 'Pro',
                price: 300,
                isPro: true,
              }}
            >
              <Link
                href={`${process.env.NEXT_PUBLIC_API_HOST}/stripe/billing_checkout?product=entitlements&user_id=${user_id}&account_id=${account_id}&email=${email}&sig=${sig}`}
                className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-25"
              >
                Upgrade
              </Link>
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