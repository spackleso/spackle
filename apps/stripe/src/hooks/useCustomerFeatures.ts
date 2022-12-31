import { useQuery } from '@tanstack/react-query'
import useApi from './useApi'

const useCustomerFeatures = (
  customerId: string | undefined,
  mode: 'live' | 'test',
) => {
  const { post } = useApi()
  return useQuery(
    ['customerFeatures', customerId],
    async () => {
      if (customerId) {
        const response = await (
          await post(`api/stripe/get_customer_features`, {
            customer_id: customerId,
            mode,
          })
        ).json()
        return response.data
      }
    },
    { enabled: !!customerId },
  )
}

export default useCustomerFeatures
