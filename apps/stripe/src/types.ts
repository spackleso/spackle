export enum FeatureType {
  Flag = 0,
  Limit = 1,
}

export type NewFeature = {
  key: string
  name: string
  type: FeatureType
  value_flag: boolean | null
  value_limit: number | null
}

export type Feature = NewFeature & {
  id: number
}

export type NewProductFeature = {
  feature_id: number
  value_flag: boolean | null
  value_limit: number | null
}

export type ProductFeature = NewProductFeature & {
  id: number
}

export type NewPriceFeature = {
  feature_id: number
  value_flag: boolean | null
  value_limit: number | null
}

export type PriceFeature = NewPriceFeature & {
  id: number
}

export type NewCustomerFeature = {
  feature_id: number
  value_flag: boolean | null
  value_limit: number | null
}

export type CustomerFeature = NewCustomerFeature & {
  id: number
}

export type NewOverride =
  | NewProductFeature
  | NewPriceFeature
  | NewCustomerFeature

export type Override = ProductFeature | PriceFeature | CustomerFeature
