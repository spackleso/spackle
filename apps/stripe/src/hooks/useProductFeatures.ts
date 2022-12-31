import { useQuery } from '@tanstack/react-query'
import useApi from './useApi'

const useProductFeatures = (
  productId: string | undefined,
  mode: 'live' | 'test',
) => {
  const { post } = useApi()
  return useQuery(
    ['productFeatures', productId],
    async () => {
      if (productId) {
        const response = await (
          await post(`api/stripe/get_product_features`, {
            product_id: productId,
            mode,
          })
        ).json()
        return response.data
      }
    },
    { enabled: !!productId },
  )
}

export default useProductFeatures
