export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customer_features: {
        Row: {
          id: number
          created_at: string | null
          value_limit: number | null
          value_flag: boolean | null
          stripe_account_id: string
          stripe_customer_id: string
          feature_id: number
        }
        Insert: {
          id?: number
          created_at?: string | null
          value_limit?: number | null
          value_flag?: boolean | null
          stripe_account_id: string
          stripe_customer_id: string
          feature_id: number
        }
        Update: {
          id?: number
          created_at?: string | null
          value_limit?: number | null
          value_flag?: boolean | null
          stripe_account_id?: string
          stripe_customer_id?: string
          feature_id?: number
        }
      }
      features: {
        Row: {
          id: number
          created_at: string | null
          name: string
          key: string
          type: number
          value_limit: number | null
          value_flag: boolean | null
          stripe_account_id: string
        }
        Insert: {
          id?: number
          created_at?: string | null
          name: string
          key: string
          type?: number
          value_limit?: number | null
          value_flag?: boolean | null
          stripe_account_id: string
        }
        Update: {
          id?: number
          created_at?: string | null
          name?: string
          key?: string
          type?: number
          value_limit?: number | null
          value_flag?: boolean | null
          stripe_account_id?: string
        }
      }
      invites: {
        Row: {
          id: number
          created_at: string | null
          token: string
        }
        Insert: {
          id?: number
          created_at?: string | null
          token?: string
        }
        Update: {
          id?: number
          created_at?: string | null
          token?: string
        }
      }
      price_features: {
        Row: {
          id: number
          created_at: string | null
          value_limit: number | null
          value_flag: boolean | null
          stripe_account_id: string
          stripe_price_id: string
          feature_id: number
        }
        Insert: {
          id?: number
          created_at?: string | null
          value_limit?: number | null
          value_flag?: boolean | null
          stripe_account_id: string
          stripe_price_id: string
          feature_id: number
        }
        Update: {
          id?: number
          created_at?: string | null
          value_limit?: number | null
          value_flag?: boolean | null
          stripe_account_id?: string
          stripe_price_id?: string
          feature_id?: number
        }
      }
      product_features: {
        Row: {
          id: number
          created_at: string | null
          value_limit: number | null
          value_flag: boolean | null
          stripe_account_id: string
          stripe_product_id: string
          feature_id: number
        }
        Insert: {
          id?: number
          created_at?: string | null
          value_limit?: number | null
          value_flag?: boolean | null
          stripe_account_id: string
          stripe_product_id: string
          feature_id: number
        }
        Update: {
          id?: number
          created_at?: string | null
          value_limit?: number | null
          value_flag?: boolean | null
          stripe_account_id?: string
          stripe_product_id?: string
          feature_id?: number
        }
      }
      stripe_accounts: {
        Row: {
          id: number
          created_at: string | null
          stripe_id: string
          stripe_json: Json | null
          initial_sync_complete: boolean
          initial_sync_started_at: string | null
          invite_id: number | null
          has_acknowledged_setup: boolean
        }
        Insert: {
          id?: number
          created_at?: string | null
          stripe_id: string
          stripe_json?: Json | null
          initial_sync_complete?: boolean
          initial_sync_started_at?: string | null
          invite_id?: number | null
          has_acknowledged_setup?: boolean
        }
        Update: {
          id?: number
          created_at?: string | null
          stripe_id?: string
          stripe_json?: Json | null
          initial_sync_complete?: boolean
          initial_sync_started_at?: string | null
          invite_id?: number | null
          has_acknowledged_setup?: boolean
        }
      }
      stripe_customers: {
        Row: {
          id: number
          created_at: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_json: Json | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_json?: Json | null
        }
        Update: {
          id?: number
          created_at?: string | null
          stripe_id?: string
          stripe_account_id?: string
          stripe_json?: Json | null
        }
      }
      stripe_prices: {
        Row: {
          id: number
          created_at: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_product_id: string
          stripe_json: Json | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_product_id: string
          stripe_json?: Json | null
        }
        Update: {
          id?: number
          created_at?: string | null
          stripe_id?: string
          stripe_account_id?: string
          stripe_product_id?: string
          stripe_json?: Json | null
        }
      }
      stripe_products: {
        Row: {
          id: number
          created_at: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_json: Json | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_json?: Json | null
        }
        Update: {
          id?: number
          created_at?: string | null
          stripe_id?: string
          stripe_account_id?: string
          stripe_json?: Json | null
        }
      }
      stripe_subscription_items: {
        Row: {
          id: number
          created_at: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_json: Json | null
          stripe_price_id: string
          stripe_subscription_id: string
        }
        Insert: {
          id?: number
          created_at?: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_json?: Json | null
          stripe_price_id: string
          stripe_subscription_id: string
        }
        Update: {
          id?: number
          created_at?: string | null
          stripe_id?: string
          stripe_account_id?: string
          stripe_json?: Json | null
          stripe_price_id?: string
          stripe_subscription_id?: string
        }
      }
      stripe_subscriptions: {
        Row: {
          id: number
          created_at: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_json: Json | null
          status: string
          stripe_customer_id: string
        }
        Insert: {
          id?: number
          created_at?: string | null
          stripe_id: string
          stripe_account_id: string
          stripe_json?: Json | null
          status: string
          stripe_customer_id: string
        }
        Update: {
          id?: number
          created_at?: string | null
          stripe_id?: string
          stripe_account_id?: string
          stripe_json?: Json | null
          status?: string
          stripe_customer_id?: string
        }
      }
      tokens: {
        Row: {
          created_at: string | null
          token: string
          stripe_account_id: string | null
        }
        Insert: {
          created_at?: string | null
          token: string
          stripe_account_id?: string | null
        }
        Update: {
          created_at?: string | null
          token?: string
          stripe_account_id?: string | null
        }
      }
      wait_list_entries: {
        Row: {
          id: number
          created_at: string | null
          email: string
          invite_id: number | null
          stripe_account_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          email: string
          invite_id?: number | null
          stripe_account_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          email?: string
          invite_id?: number | null
          stripe_account_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

