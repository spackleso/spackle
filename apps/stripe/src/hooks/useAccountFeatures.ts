import { useQuery } from '@tanstack/react-query'
import useApi from './useApi'

const useProductFeatures = (accountId: string) => {
  const { post } = useApi()
  return useQuery(['accountFeatures', accountId], async () => {
    const response = await (
      await post(`api/stripe/get_account_features`, {})
    ).json()
    return response.data
  })
}

export default useProductFeatures
