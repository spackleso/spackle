'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckIcon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'
import { useState } from 'react'

type Interval = 'month' | 'year'

export const toHumanPrice = (price: number, decimals: number = 2) => {
  if (typeof price !== 'number') return ''
  return Number(price / 100).toFixed(decimals)
}

export const toHumanQuantity = (quantity: number) => {
  return quantity.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function PricingTable({
  table,
  cta,
  onCTAClick,
}: {
  table: any
  cta: string
  onCTAClick: (priceId: string) => Promise<void>
}) {
  const [interval, setInterval] = useState<Interval>('month')
  const [isLoading, setIsLoading] = useState(false)
  const [id, setId] = useState<string | null>(null)

  return (
    <section id="pricing" className="my-24">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-14 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h4 className="text-xl font-bold tracking-tight text-black dark:text-white">
            Pricing
          </h4>

          <p className="mt-6 text-xl leading-8 text-black/80 dark:text-white">
            Choose an <strong>affordable plan</strong> that&apos;s packed with
            the best features for your business.
          </p>
        </div>

        <div className="mx-auto grid w-full justify-center gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {table.products.map((product: any, idx: number) => (
            <div
              key={product.id}
              className={cn(
                ' relative flex w-full max-w-[400px] flex-col gap-4 overflow-hidden rounded-2xl border p-4 text-black dark:text-white',
                {
                  'border-2 border-neutral-700 shadow-lg shadow-neutral-500 dark:border-neutral-400 dark:shadow-neutral-600':
                    idx === 2,
                },
              )}
            >
              <div className="flex items-center">
                <div className="ml-4">
                  <h2 className="text-base font-semibold leading-7">
                    {product.name}
                  </h2>
                </div>
              </div>

              <motion.div
                key={`${product.id}-${interval}`}
                initial="initial"
                animate="animate"
                variants={{
                  initial: {
                    opacity: 0,
                    y: 12,
                  },
                  animate: {
                    opacity: 1,
                    y: 0,
                  },
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.1 + idx * 0.05,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="flex flex-row gap-1"
              >
                <span className="text-4xl font-bold text-black dark:text-white">
                  $
                  {interval === 'year'
                    ? toHumanPrice(product.prices.year.unit_amount, 0)
                    : toHumanPrice(product.prices.month.unit_amount, 0)}
                  <span className="text-xs"> / {interval}</span>
                </span>
              </motion.div>

              <Button
                className={cn(
                  'group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter',
                  'transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-2',
                )}
                disabled={isLoading}
                onClick={() => {
                  setIsLoading(true)
                  setId(product.id)
                  onCTAClick(product.prices[interval].id).finally(() => {
                    setIsLoading(false)
                  })
                }}
              >
                <span className="absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 transform-gpu bg-white opacity-10 transition-all duration-1000 ease-out group-hover:-translate-x-96 dark:bg-black" />
                {(!isLoading || (isLoading && id !== product.id)) && (
                  <p>{cta}</p>
                )}

                {isLoading && id === product.id && (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                )}
              </Button>

              <hr className="m-0 h-px w-full border-none bg-gradient-to-r from-neutral-200/0 via-neutral-500/30 to-neutral-200/0" />
              {product.features && product.features.length > 0 && (
                <ul className="flex flex-col gap-2 font-normal">
                  {product.features
                    .filter(
                      (feature: any) =>
                        !feature.name.startsWith('~') &&
                        (feature.value_limit || feature.value_flag),
                    )
                    .map((feature: any, idx: any) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 text-xs font-medium text-black dark:text-white"
                      >
                        <CheckIcon className="h-5 w-5 shrink-0 rounded-full bg-green-400 p-[2px] text-black dark:text-white" />
                        <span className="flex">
                          {feature.value_flag && (
                            <span className="text-xs text-black/50 dark:text-white/50">
                              {feature.name}
                            </span>
                          )}
                          {feature.value_limit && (
                            <span className="text-xs text-black/50 dark:text-white/50">
                              {toHumanQuantity(feature.value_limit)}{' '}
                              {feature.name}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
