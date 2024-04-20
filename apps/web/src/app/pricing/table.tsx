'use client'

import { useRouter } from 'next/navigation'
import { PricingTable } from '@/components/pricing-table'

export function Table({ pricingTable }: { pricingTable: any }) {
  const router = useRouter()
  return (
    <PricingTable
      table={pricingTable}
      cta={'Get Started'}
      onCTAClick={(priceId: string) => {
        window.location.href = '/signup'
        return Promise.resolve()
      }}
    />
  )
}
