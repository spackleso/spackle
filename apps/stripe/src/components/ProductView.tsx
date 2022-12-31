import {
  ContextView,
  Box,
  Accordion,
  Spinner,
  Link,
  Icon,
  Inline,
} from '@stripe/ui-extension-sdk/ui'
import useAccountState from '../hooks/useAccountState'
import useProductFeatures from '../hooks/useProductFeatures'
import useProductState from '../hooks/useProductState'
import useApi from '../hooks/useApi'
import { useState, useEffect, useCallback } from 'react'
import Stripe from 'stripe'
import stripe from '../stripe'
import BrandIcon from '../views/icon.svg'
import FeaturesForm from '../components/FeaturesForm'
import FeatureList from '../components/FeatureList'
import PriceAccordianItem from '../components/PriceAccordianItem'
import { queryClient } from '../query'
import useStripeContext from '../hooks/useStripeContext'
import { NewOverride, Override } from '../types'
import { useMutation } from '@tanstack/react-query'

const ProductView = () => {
  const { post } = useApi()
  const { environment, userContext } = useStripeContext()
  const accountState = useAccountState(userContext.account.id)

  const productId = environment.objectContext?.id
  const productFeatures = useProductFeatures(productId, environment.mode)
  const productState = useProductState(productId, environment.mode)

  const [prices, setPrices] = useState<Stripe.Price[]>([])
  const [isShowingFeaturesForm, setIsShowingFeaturesForm] = useState(false)

  const fetch = useCallback(async () => {
    return stripe.prices.list({ product: productId }).then((p) => {
      setPrices(p.data)
    })
  }, [productId])

  const saveOverrides = useMutation(
    async (overrides: Override[] | NewOverride[]) => {
      const response = await post(`api/stripe/update_product_features`, {
        product_id: productId,
        product_features: overrides,
        mode: environment.mode,
      })
      queryClient.invalidateQueries(['productFeatures', productId])
      queryClient.invalidateQueries(['productState', productId])
      return response
    },
  )

  useEffect(() => {
    fetch()
  }, [fetch])

  const isLoading =
    accountState.isLoading ||
    productFeatures.isLoading ||
    productState.isLoading
  return (
    <ContextView
      title="Product Features"
      brandColor="#FFFFFF"
      brandIcon={BrandIcon}
      externalLink={{
        label: 'Documentation',
        href: 'https://www.spackle.so/docs',
      }}
      footerContent={
        <>
          <Box>
            <Link
              type="secondary"
              onPress={() => setIsShowingFeaturesForm(!isShowingFeaturesForm)}
            >
              <Box css={{ stack: 'x', gapX: 'xsmall', alignY: 'center' }}>
                <Icon name="settings" />
                Manage Features
              </Box>
            </Link>
          </Box>
        </>
      }
    >
      {isLoading ? (
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
      ) : (
        <Box>
          {accountState.data.length ? (
            <>
              <FeatureList
                features={accountState}
                overrides={productFeatures}
                saveOverrides={saveOverrides}
              />

              <Box css={{ marginTop: 'xxlarge' }}>
                <Box css={{ font: 'heading' }}>Price Features</Box>
              </Box>

              <Accordion>
                {prices.map((p) => (
                  <PriceAccordianItem
                    key={p.id}
                    id={p.id}
                    productState={productState}
                  ></PriceAccordianItem>
                ))}
              </Accordion>
            </>
          ) : (
            <Box
              css={{
                keyline: 'neutral',
                padding: 'medium',
                font: 'caption',
                borderRadius: 'small',
                margin: 'medium',
                textAlign: 'center',
              }}
            >
              You don&apos;t have any features yet. Create a new feature by
              clicking{' '}
              <Inline css={{ fontWeight: 'bold' }}>
                &quot;Manage Features&quot;
              </Inline>{' '}
              below
            </Box>
          )}
          <FeaturesForm
            shown={isShowingFeaturesForm}
            setShown={setIsShowingFeaturesForm}
          />
        </Box>
      )}
    </ContextView>
  )
}

export default ProductView
