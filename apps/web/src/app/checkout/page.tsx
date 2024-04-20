import { Table } from './table'
import { getPricingTable } from '../actions'

export default async function Checkout() {
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
