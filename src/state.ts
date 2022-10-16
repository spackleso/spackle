import { supabase } from './supabase/client'

export const getAccountState = async (accountId: string) => {
  const { data, error } = await supabase
    .from('features')
    .select('id,name,key,type,value_flag,value_limit')
    .eq('stripe_account_id', accountId)
    .order('name', { ascending: true })

  return data || []
}

export const getProductState = async (
  accountId: string,
  productId: string,
): Promise<any[]> => {
  const accountState = await getAccountState(accountId)

  const { data: productFeatures, error: productFeaturesError } = await supabase
    .from('product_features')
    .select('id,value_flag,value_limit,feature_id,features(name)')
    .eq('stripe_account_id', accountId)
    .eq('stripe_product_id', productId)

  const productFeaturesMap: { [key: string]: any } =
    productFeatures?.reduce(
      (a, v) => ({
        ...a,
        [v.feature_id]: v,
      }),
      {},
    ) || {}

  return (
    accountState?.map((f) => {
      const productFeature = productFeaturesMap[f.id]
      if (productFeature) {
        return {
          ...f,
          value_flag: productFeature.value_flag,
          value_limit: productFeature.value_limit,
        }
      }
      return f
    }) || []
  )
}

export const getPriceState = async (
  accountId: string,
  productId: string,
  priceId: string,
): Promise<any[]> => {
  const productState = await getProductState(accountId, productId)

  const { data: priceFeatures, error: productFeaturesError } = await supabase
    .from('price_features')
    .select('id,value_flag,value_limit,feature_id,features(name)')
    .eq('stripe_account_id', accountId)
    .eq('stripe_price_id', priceId)

  const priceFeaturesMap: { [key: string]: any } =
    priceFeatures?.reduce(
      (a, v) => ({
        ...a,
        [v.feature_id]: v,
      }),
      {},
    ) || {}

  return (
    productState?.map((f) => {
      const priceFeature = priceFeaturesMap[f.id]
      if (priceFeature) {
        return {
          ...f,
          value_flag: priceFeature.value_flag,
          value_limit: priceFeature.value_limit,
        }
      }
      return f
    }) || []
  )
}
