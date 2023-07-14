import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

export type Price = {
  id: string
  name: string
  price: number
  isPro: boolean
}

const PriceBox = ({ price }: { price: Price }) => {
  return (
    <div className="flex flex-col rounded-lg bg-white shadow-lg dark:bg-slate-800 dark:text-white">
      <div className="flex flex-col p-10">
        <h3 className="text-center text-xl font-semibold text-slate-900 dark:text-white">
          {price.name}
        </h3>
        <div className="mt-2 flex flex-col gap-y-1 text-center">
          <span className="text-3xl text-slate-900 dark:text-white">
            <span className="font-bold">${price.price / 100}</span>
            /month
          </span>
          <span className="text-xs text-slate-900 dark:text-white">
            {price.isPro ? 'Per to $1,000 MTR*' : 'Up to $1,000 MTR*'}
          </span>
        </div>
        <div className="mt-8 text-sm font-semibold text-slate-900 dark:text-white">
          Features
        </div>
        <hr className="my-2" />
        <ul className="flex flex-col gap-y-2">
          <li className="flex flex-row items-center gap-x-1">
            <CheckIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm">Entitlements</span>
          </li>
          <li className="flex flex-row items-center gap-x-1">
            <CheckIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm">Global Datastores</span>
          </li>
          <li className="flex flex-row items-center gap-x-1">
            <CheckIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm">All Platform SDKs</span>
          </li>
        </ul>
        <div className="mt-8 flex justify-center">
          <Link
            href="https://marketplace.stripe.com/apps/spackle"
            className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-25"
          >
            Add to Stripe
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PriceBox
