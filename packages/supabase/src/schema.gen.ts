export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
          billing_stripe_customer_id: string | null
          created_at: string | null
          has_acknowledged_setup: boolean
          id: number
          initial_sync_complete: boolean
          initial_sync_started_at: string | null
          name: string | null
          stripe_id: string
          stripe_json: Json | null
        }
        Insert: {
          billing_stripe_customer_id?: string | null
          created_at?: string | null
          has_acknowledged_setup?: boolean
          id?: number
          initial_sync_complete?: boolean
          initial_sync_started_at?: string | null
          name?: string | null
          stripe_id: string
          stripe_json?: Json | null
        }
        Update: {
          billing_stripe_customer_id?: string | null
          created_at?: string | null
          has_acknowledged_setup?: boolean
          id?: number
          initial_sync_complete?: boolean
          initial_sync_started_at?: string | null
          name?: string | null
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
      stripe_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
          name: string | null
          stripe_account_id: string
          stripe_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          stripe_account_id: string
          stripe_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string | null
          stripe_account_id?: string
          stripe_id?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

