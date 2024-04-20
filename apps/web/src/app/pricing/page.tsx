import { Container } from '@/components/tailwindui/container'
import Link from 'next/link'
import { Button } from '@/components/tailwindui/button'
import Spackle from 'spackle-node'
import { Table } from './table'
import { getPricingTable } from '../actions'

export default async function Pricing() {
  const pricingTable = await getPricingTable()
  pricingTable.products = [
    ...pricingTable.products,
    {
      id: 'custom',
      name: 'Custom',
      description: '',
      features: [
        {
          id: -1,
          key: 'custom',
          name: 'Custom configuration',
          type: 0,
          value_flag: true,
          value_limit: null,
        },
      ],
      prices: {
        month: {
          id: 'custom',
          unit_amount: null as any,
          currency: 'usd',
        },
      },
    },
  ]
  return <Table pricingTable={pricingTable} />
}
