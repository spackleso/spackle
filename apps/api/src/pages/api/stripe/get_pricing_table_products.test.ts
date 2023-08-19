/**
 * @jest-environment node
 */
import handler from '@/pages/api/stripe/get_pricing_tables'
import {
  createAccount,
  createPricingTable,
  createPricingTableProduct,
  createStripeProduct,
  stripeTestHandler,
  testHandler,
} from '@/tests/helpers'

describe('POST', () => {
  test('Requires a signature', async () => {
    const res = await testHandler(handler, {
      method: 'POST',
      body: {},
    })

    expect(res._getStatusCode()).toBe(403)
    expect(res._getData()).toBe(
      JSON.stringify({
        error: 'Unauthorized',
      }),
    )
  })

  test("Returns a pricing table's products", async () => {
    const account = await createAccount()
    const pricingTable = await createPricingTable(
      account.stripeId,
      'Default',
      0,
      true,
      true,
    )
    const product1 = await createStripeProduct(account.stripeId)
    const product2 = await createStripeProduct(account.stripeId)
    await createPricingTableProduct(
      account.stripeId,
      pricingTable.id,
      product1.stripeId,
    )
    await createPricingTableProduct(
      account.stripeId,
      pricingTable.id,
      product2.stripeId,
    )
    const res = await stripeTestHandler(handler, {
      method: 'POST',
      body: {
        account_id: account.stripeId,
        mode: 'live',
      },
    })

    expect(res._getStatusCode()).toBe(200)
    const data = res._getJSONData()
    expect(data).toStrictEqual([product1, product2])
  })
})
