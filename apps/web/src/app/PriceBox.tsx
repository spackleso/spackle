import { CheckIcon } from '@heroicons/react/24/solid'
import { ReactNode } from 'react'

export type Price = {
  id: string
  name: string
  price: number
  isPro: boolean
}

const PriceBox = ({
  price,
  children,
}: {
  price: Price
  children: ReactNode
}) => {
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
            {price.isPro ? 'Per to $1,000 MTR*' : 'Test mode only'}
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
          {price.isPro && (
            <li className="flex flex-row items-center gap-x-1">
              <CheckIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm">Live Mode</span>
            </li>
          )}
        </ul>
        <div className="mt-8 flex justify-center">{children}</div>
      </div>
    </div>
  )
}

export default PriceBox
