import { useQuery } from '@tanstack/react-query'
import useApi from './useApi'

const useAccount = (accountId: string) => {
  const { post } = useApi()
  return useQuery(['account', accountId], async () => {
    return await (await post(`api/stripe/get_account`, {})).json()
  })
}

export default useAccount
