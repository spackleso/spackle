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
        if (priceId === 'custom') {
          router.push('mailto:support@spackle.so')
        } else {
          window.location.href = '/signup'
        }
        return Promise.resolve()
      }}
    />
  )
}
