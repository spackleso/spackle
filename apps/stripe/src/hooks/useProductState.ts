import { useQuery } from '@tanstack/react-query'
import useApi from './useApi'

const useProductState = (
  productId: string | undefined,
  mode: 'live' | 'test',
) => {
  const { post } = useApi()
  return useQuery(
    ['productState', productId],
    async () => {
      const response = await (
        await post(`api/stripe/get_product_state`, {
          product_id: productId,
          mode,
        })
      ).json()
      return response.data
    },
    { enabled: !!productId },
  )
}

export default useProductState
