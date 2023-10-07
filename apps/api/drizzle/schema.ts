import {
  pgTable,
  pgEnum,
  bigserial,
  timestamp,
  text,
  smallint,
  boolean,
  unique,
  json,
  bigint,
} from 'drizzle-orm/pg-core'

export const requestStatus = pgEnum('request_status', [
  'ERROR',
  'SUCCESS',
  'PENDING',
])
export const keyStatus = pgEnum('key_status', [
  'expired',
  'invalid',
  'valid',
  'default',
])
export const keyType = pgEnum('key_type', ['aead-det', 'aead-ietf'])
export const aalLevel = pgEnum('aal_level', ['aal3', 'aal2', 'aal1'])
export const codeChallengeMethod = pgEnum('code_challenge_method', [
  'plain',
  's256',
])
export const factorStatus = pgEnum('factor_status', ['verified', 'unverified'])
export const factorType = pgEnum('factor_type', ['webauthn', 'totp'])

export const pricingTables = pgTable('pricing_tables', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string',
  }).defaultNow(),
  stripeAccountId: text('stripe_account_id')
    .notNull()
    .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
  name: text('name').default('Default'),
  mode: smallint('mode').default(1).notNull(),
  monthlyEnabled: boolean('monthly_enabled').default(false).notNull(),
  annualEnabled: boolean('annual_enabled').default(false).notNull(),
})

export const pricingTableProducts = pgTable('pricing_table_products', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string',
  }).defaultNow(),
  stripeAccountId: text('stripe_account_id')
    .notNull()
    .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  pricingTableId: bigserial('pricing_table_id', { mode: 'number' })
    .notNull()
    .references(() => pricingTables.id, { onDelete: 'cascade' }),
  stripeProductId: text('stripe_product_id')
    .notNull()
    .references(() => stripeProducts.stripeId, { onDelete: 'cascade' }),
  monthlyStripePriceId: text('monthly_stripe_price_id').references(
    () => stripePrices.stripeId,
    { onDelete: 'set null' },
  ),
  annualStripePriceId: text('annual_stripe_price_id').references(
    () => stripePrices.stripeId,
    { onDelete: 'set null' },
  ),
})

export const customerFeatures = pgTable(
  'customer_features',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    valueLimit: bigint('value_limit', { mode: 'number' }),
    valueFlag: boolean('value_flag'),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id')
      .notNull()
      .references(() => stripeCustomers.stripeId, { onDelete: 'cascade' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    featureId: bigserial('feature_id', { mode: 'number' })
      .notNull()
      .references(() => features.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      customerFeaturesStripeAccountIdStripeCustomerIdFeatKey: unique(
        'customer_features_stripe_account_id_stripe_customer_id_feat_key',
      ).on(table.stripeAccountId, table.stripeCustomerId, table.featureId),
    }
  },
)

export const stripePrices = pgTable(
  'stripe_prices',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    stripeId: text('stripe_id').notNull(),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
    stripeProductId: text('stripe_product_id')
      .notNull()
      .references(() => stripeProducts.stripeId, { onDelete: 'cascade' }),
    stripeJson: json('stripe_json'),
  },
  (table) => {
    return {
      stripePricesStripeIdKey: unique('stripe_prices_stripe_id_key').on(
        table.stripeId,
      ),
    }
  },
)

export const stripeProducts = pgTable(
  'stripe_products',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    stripeId: text('stripe_id').notNull(),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
    stripeJson: json('stripe_json'),
  },
  (table) => {
    return {
      stripeProductsStripeIdKey: unique('stripe_products_stripe_id_key').on(
        table.stripeId,
      ),
    }
  },
)

export const stripeAccounts = pgTable(
  'stripe_accounts',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    stripeId: text('stripe_id').notNull(),
    stripeJson: json('stripe_json'),
    initialSyncComplete: boolean('initial_sync_complete')
      .default(false)
      .notNull(),
    initialSyncStartedAt: timestamp('initial_sync_started_at', {
      withTimezone: true,
      mode: 'string',
    }),
    hasAcknowledgedSetup: boolean('has_acknowledged_setup')
      .default(false)
      .notNull(),
    name: text('name'),
    billingStripeCustomerId: text('billing_stripe_customer_id'),
  },
  (table) => {
    return {
      stripeAccountsStripeIdKey: unique('stripe_accounts_stripe_id_key').on(
        table.stripeId,
      ),
      stripeAccountsBillingStripeCustomerIdKey: unique(
        'stripe_accounts_billing_stripe_customer_id_key',
      ).on(table.billingStripeCustomerId),
    }
  },
)

export const stripeSubscriptions = pgTable(
  'stripe_subscriptions',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    stripeId: text('stripe_id').notNull(),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
    stripeJson: json('stripe_json'),
    status: text('status').notNull(),
    stripeCustomerId: text('stripe_customer_id')
      .notNull()
      .references(() => stripeCustomers.stripeId, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      stripeSubscriptionsStripeIdKey: unique(
        'stripe_subscriptions_stripe_id_key',
      ).on(table.stripeId),
    }
  },
)

export const tokens = pgTable('tokens', {
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string',
  }).defaultNow(),
  token: text('token').primaryKey().notNull(),
  stripeAccountId: text('stripe_account_id').references(
    () => stripeAccounts.stripeId,
  ),
})

export const features = pgTable(
  'features',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    name: text('name').notNull(),
    key: text('key').notNull(),
    type: smallint('type').default(0).notNull(),
    valueLimit: bigint('value_limit', { mode: 'number' }),
    valueFlag: boolean('value_flag'),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      featuresStripeAccountIdKeyKey: unique(
        'features_stripe_account_id_key_key',
      ).on(table.key, table.stripeAccountId),
    }
  },
)

export const stripeCustomers = pgTable(
  'stripe_customers',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    stripeId: text('stripe_id').notNull(),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
    stripeJson: json('stripe_json'),
  },
  (table) => {
    return {
      stripeCustomersStripeIdKey: unique('stripe_customers_stripe_id_key').on(
        table.stripeId,
      ),
    }
  },
)

export const productFeatures = pgTable(
  'product_features',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    valueLimit: bigint('value_limit', { mode: 'number' }),
    valueFlag: boolean('value_flag'),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
    stripeProductId: text('stripe_product_id')
      .notNull()
      .references(() => stripeProducts.stripeId, { onDelete: 'cascade' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    featureId: bigserial('feature_id', { mode: 'number' })
      .notNull()
      .references(() => features.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      productFeaturesStripeAccountIdStripeProductIdFeaturKey: unique(
        'product_features_stripe_account_id_stripe_product_id_featur_key',
      ).on(table.stripeAccountId, table.stripeProductId, table.featureId),
    }
  },
)

export const stripeSubscriptionItems = pgTable(
  'stripe_subscription_items',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    stripeId: text('stripe_id').notNull(),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId, { onDelete: 'cascade' }),
    stripeJson: json('stripe_json'),
    stripePriceId: text('stripe_price_id')
      .notNull()
      .references(() => stripePrices.stripeId, { onDelete: 'cascade' }),
    stripeSubscriptionId: text('stripe_subscription_id')
      .notNull()
      .references(() => stripeSubscriptions.stripeId, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      stripeSubscriptionItemsStripeIdKey: unique(
        'stripe_subscription_items_stripe_id_key',
      ).on(table.stripeId),
    }
  },
)

export const stripeUsers = pgTable(
  'stripe_users',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    email: text('email'),
    name: text('name'),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId),
    stripeId: text('stripe_id').notNull(),
  },
  (table) => {
    return {
      stripeUsersStripeAccountIdStripeIdFeatKey: unique(
        'stripe_users_stripe_account_id_stripe_id_feat_key',
      ).on(table.stripeAccountId, table.stripeId),
    }
  },
)

export const publishableTokens = pgTable('publishable_tokens', {
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'string',
  }).defaultNow(),
  token: text('token').primaryKey().notNull(),
  stripeAccountId: text('stripe_account_id').references(
    () => stripeAccounts.stripeId,
  ),
})

export const stripeInvoices = pgTable(
  'stripe_invoices',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    stripeId: text('stripe_id').notNull(),
    stripeAccountId: text('stripe_account_id')
      .notNull()
      .references(() => stripeAccounts.stripeId),
    stripeJson: json('stripe_json'),
    status: text('status').notNull(),
    stripeCustomerId: text('stripe_customer_id')
      .notNull()
      .references(() => stripeCustomers.stripeId),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    total: bigint('total', { mode: 'number' }).notNull(),
  },
  (table) => {
    return {
      stripeInvoicesStripeIdKey: unique('stripe_invoices_stripe_id_key').on(
        table.stripeId,
      ),
    }
  },
)
