import { useQuery } from '@tanstack/react-query'
import useApi from './useApi'

const usePriceFeatures = (
  priceId: string | undefined,
  mode: 'live' | 'test',
) => {
  const { post } = useApi()
  return useQuery(
    ['priceFeatures', priceId],
    async () => {
      if (priceId) {
        const response = await (
          await post(`api/stripe/get_price_features`, {
            price_id: priceId,
            mode,
          })
        ).json()
        return response.data
      }
    },
    { enabled: !!priceId },
  )
}

export default usePriceFeatures
