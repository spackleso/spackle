export type Mode = 'test' | 'live'

export enum FeatureType {
  Flag = 0,
  Limit = 1,
}

export enum SpackleProduct {
  entitlements = 'entitlements',
}

export type CustomerState = {
  version: number
  features: any[]
  subscriptions: any[]
}
