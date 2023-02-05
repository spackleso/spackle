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
          created_at: string | null
          feature_id: number
          id: number
          stripe_account_id: string
          stripe_customer_id: string
          value_flag: boolean | null
          value_limit: number | null
        }
        Insert: {
          created_at?: string | null
          feature_id: number
          id?: number
          stripe_account_id: string
          stripe_customer_id: string
          value_flag?: boolean | null
          value_limit?: number | null
        }
        Update: {
          created_at?: string | null
          feature_id?: number
          id?: number
          stripe_account_id?: string
          stripe_customer_id?: string
          value_flag?: boolean | null
          value_limit?: number | null
        }
      }
      features: {
        Row: {
          created_at: string | null
          id: number
          key: string
          name: string
          stripe_account_id: string
          type: number
          value_flag: boolean | null
          value_limit: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          key: string
          name: string
          stripe_account_id: string
          type?: number
          value_flag?: boolean | null
          value_limit?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          key?: string
          name?: string
          stripe_account_id?: string
          type?: number
          value_flag?: boolean | null
          value_limit?: number | null
        }
      }
      invites: {
        Row: {
          created_at: string | null
          id: number
          notes: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          notes?: string | null
          token?: string
        }
        Update: {
          created_at?: string | null
          id?: number
          notes?: string | null
          token?: string
        }
      }
      price_features: {
        Row: {
          created_at: string | null
          feature_id: number
          id: number
          stripe_account_id: string
          stripe_price_id: string
          value_flag: boolean | null
          value_limit: number | null
        }
        Insert: {
          created_at?: string | null
          feature_id: number
          id?: number
          stripe_account_id: string
          stripe_price_id: string
          value_flag?: boolean | null
          value_limit?: number | null
        }
        Update: {
          created_at?: string | null
          feature_id?: number
          id?: number
          stripe_account_id?: string
          stripe_price_id?: string
          value_flag?: boolean | null
          value_limit?: number | null
        }
      }
      product_features: {
        Row: {
          created_at: string | null
          feature_id: number
          id: number
          stripe_account_id: string
          stripe_product_id: string
          value_flag: boolean | null
          value_limit: number | null
        }
        Insert: {
          created_at?: string | null
          feature_id: number
          id?: number
          stripe_account_id: string
          stripe_product_id: string
          value_flag?: boolean | null
          value_limit?: number | null
        }
        Update: {
          created_at?: string | null
          feature_id?: number
          id?: number
          stripe_account_id?: string
          stripe_product_id?: string
          value_flag?: boolean | null
          value_limit?: number | null
        }
      }
      stripe_accounts: {
        Row: {
          created_at: string | null
          has_acknowledged_setup: boolean
          id: number
          initial_sync_complete: boolean
          initial_sync_started_at: string | null
          invite_id: number | null
          stripe_id: string
          stripe_json: Json | null
        }
        Insert: {
          created_at?: string | null
          has_acknowledged_setup?: boolean
          id?: number
          initial_sync_complete?: boolean
          initial_sync_started_at?: string | null
          invite_id?: number | null
          stripe_id: string
          stripe_json?: Json | null
        }
        Update: {
          created_at?: string | null
          has_acknowledged_setup?: boolean
          id?: number
          initial_sync_complete?: boolean
          initial_sync_started_at?: string | null
          invite_id?: number | null
          stripe_id?: string
          stripe_json?: Json | null
        }
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          id: number
          stripe_account_id: string
          stripe_id: string
          stripe_json: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          stripe_account_id: string
          stripe_id: string
          stripe_json?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: number
          stripe_account_id?: string
          stripe_id?: string
          stripe_json?: Json | null
        }
      }
      stripe_prices: {
        Row: {
          created_at: string | null
          id: number
          stripe_account_id: string
          stripe_id: string
          stripe_json: Json | null
          stripe_product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          stripe_account_id: string
          stripe_id: string
          stripe_json?: Json | null
          stripe_product_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          stripe_account_id?: string
          stripe_id?: string
          stripe_json?: Json | null
          stripe_product_id?: string
        }
      }
      stripe_products: {
        Row: {
          created_at: string | null
          id: number
          stripe_account_id: string
          stripe_id: string
          stripe_json: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          stripe_account_id: string
          stripe_id: string
          stripe_json?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: number
          stripe_account_id?: string
          stripe_id?: string
          stripe_json?: Json | null
        }
      }
      stripe_subscription_items: {
        Row: {
          created_at: string | null
          id: number
          stripe_account_id: string
          stripe_id: string
          stripe_json: Json | null
          stripe_price_id: string
          stripe_subscription_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          stripe_account_id: string
          stripe_id: string
          stripe_json?: Json | null
          stripe_price_id: string
          stripe_subscription_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          stripe_account_id?: string
          stripe_id?: string
          stripe_json?: Json | null
          stripe_price_id?: string
          stripe_subscription_id?: string
        }
      }
      stripe_subscriptions: {
        Row: {
          created_at: string | null
          id: number
          status: string
          stripe_account_id: string
          stripe_customer_id: string
          stripe_id: string
          stripe_json: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          status: string
          stripe_account_id: string
          stripe_customer_id: string
          stripe_id: string
          stripe_json?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: number
          status?: string
          stripe_account_id?: string
          stripe_customer_id?: string
          stripe_id?: string
          stripe_json?: Json | null
        }
      }
      tokens: {
        Row: {
          created_at: string | null
          stripe_account_id: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          stripe_account_id?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          stripe_account_id?: string | null
          token?: string
        }
      }
      wait_list_entries: {
        Row: {
          created_at: string | null
          email: string
          id: number
          invite_id: number | null
          stripe_account_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          invite_id?: number | null
          stripe_account_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
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

