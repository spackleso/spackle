'use client'

import { useRouter } from 'next/navigation'
import { Container } from '@/components/tailwindui/container'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PricingTable } from '@/components/pricing-table'

export function Table({ pricingTable }: { pricingTable: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  let data: any = {}
  if (searchParams.get('session')) {
    data = JSON.parse(atob(searchParams.get('session') as string))
  }

  const user_id = data.user_id
  const account_id = data.account_id
  const email = data.email
  const sig = data.sig

  return (
    <PricingTable
      table={pricingTable}
      cta={'Get Started'}
      onCTAClick={async (priceId: string) => {
        router.push(
          `${process.env.NEXT_PUBLIC_API_HOST}/stripe/billing_checkout?product=${priceId}&user_id=${user_id}&account_id=${account_id}&email=${email}&sig=${sig}`,
        )
      }}
    />
  )
}
