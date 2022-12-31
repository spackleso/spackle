import { useQuery } from '@tanstack/react-query'
import useApi from './useApi'

const useToken = (accountId: string) => {
  const { post } = useApi()
  return useQuery(['token', accountId], async () => {
    return await (await post(`api/stripe/get_token`, {})).json()
  })
}

export default useToken
