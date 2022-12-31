import { Stripe } from 'stripe'

const liveStripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY || '', {
  apiVersion: '2022-08-01',
})

const testStripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY || '', {
  apiVersion: '2022-08-01',
})

export { liveStripe, testStripe }
