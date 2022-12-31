import { AccordionItem, Box, Spinner } from '@stripe/ui-extension-sdk/ui'
import FeatureList from './FeatureList'
import { useEffect, useState } from 'react'
import { Feature, NewOverride, Override } from '../types'
import Stripe from 'stripe'
import useApi from '../hooks/useApi'
import stripe from '../stripe'
import usePriceFeatures from '../hooks/usePriceFeatures'
import { queryClient } from '../query'
import useStripeContext from '../hooks/useStripeContext'
import { QueryObserverResult, useMutation } from '@tanstack/react-query'
import getSymbolFromCurrency from 'currency-symbol-map'

const priceDisplay = (price: Stripe.Price): string => {
  if (price.nickname) {
    return price.nickname
  }

  const currency = price.currency.toUpperCase()
  const symbol = getSymbolFromCurrency(currency) || ''
  if (price.unit_amount && price.recurring) {
    return `${symbol}${price.unit_amount / 100} ${currency} / ${
      price.recurring.interval
    }`
  } else if (price.unit_amount) {
    return `${symbol}${price.unit_amount / 100} ${currency}`
  } else {
    return price.id
  }
}

const PriceAccordianItem = ({
  id,
  productState,
}: {
  id: string
  productState: QueryObserverResult<Feature[]>
}) => {
  const { post } = useApi()
  const { environment } = useStripeContext()
  const [price, setPrice] = useState<Stripe.Price | null>(null)
  const priceFeatures = usePriceFeatures(id, environment.mode)
  const saveOverrides = useMutation(
    async (overrides: Override[] | NewOverride[]) => {
      await post(`api/stripe/update_price_features`, {
        price_id: id,
        price_features: overrides,
        mode: environment.mode,
      })
      queryClient.invalidateQueries(['priceFeatures', id])
    },
  )

  useEffect(() => {
    if (id) {
      stripe.prices.retrieve(id).then((p) => {
        setPrice(p)
      })
    }
  }, [id])

  return (
    <AccordionItem title={price ? priceDisplay(price) : id}>
      {priceFeatures ? (
        <FeatureList
          features={productState}
          overrides={priceFeatures}
          saveOverrides={saveOverrides}
        />
      ) : (
        <Box
          css={{
            stack: 'x',
            alignX: 'center',
            alignY: 'center',
            width: 'fill',
            height: 'fill',
          }}
        >
          <Spinner />
        </Box>
      )}
    </AccordionItem>
  )
}

export default PriceAccordianItem
