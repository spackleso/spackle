---
title: Spackle Ruby
pageTitle: Spackle - Ruby
description: Learn how to integrate your Ruby application with Spackle
---

Learn how to get Spackle set up in your Ruby project{% .lead %}

---

## Setup

### Install the Spackle library

```sh
gem install spackle-ruby
```

### Bundler

```ruby
source 'https://rubygems.org'

gem 'spackle-ruby'
```

### Configure your environment
In order to use Spackle, you need to configure your secret key on the `Spackle` module. You can find your secret key in Spackle app [settings page](https://dashboard.stripe.com/settings/apps/so.spackle.stripe).

```ruby
require 'spackle'

Spackle.api_key = "<api key>"
```

## Usage

### Pricing tables

#### Fetch a pricing table

```ruby
pricing_table = Spackle::PricingTable.retrieve("abcde123")
```

#### Pricing table object
```ts
{
  id: string
  name: string
  intervals: string[]
  products: {
    id: string
    name: string
    description: string
    features: {
      id: string
      name: string
      key: string
      type: number
      value_flag: boolean
      value_limit: number | null
    }[]
    prices: {
      month?: {
        id: string
        unit_amount: number
        currency: string
      }
      year?: {
        id: string
        unit_amount: number
        currency: string
      }
    }
  }[]
}
```

### Entitlements

#### Fetch a customer

Spackle uses stripe ids as references to customer features.

```ruby
customer = Spackle::Customer.retrieve("cus_00000000")
```

#### Verify feature access

```ruby
customer.enabled("feature_key")
```

#### Fetch a feature limit

```ruby
customer.limit("feature_key")
```

#### Examine a customer's subscriptions

A customer's current subscriptions are available on the `subscriptions` property. These are valid `Stripe::Subscription` objects as defined in the [Stripe Ruby library](https://stripe.com/docs/api/subscriptions/object?lang=ruby).

```ruby
customer.subscriptions
```

#### Waiters

There is a brief delay between when an action takes place in Stripe and when it is reflected in Spackle. To account for this, Spackle provides a `Waiters` module that can be used to wait for a Stripe object to be updated and replicated.

1. Wait for a customer to be created
   ```ruby
   Spackle::Waiters.wait_for_customer("cus_00000000")
   ```
2. Wait for a subscription to be created
   ```ruby
   Spackle::Waiters.wait_for_subscription("cus_000000000", "sub_00000000")
   ```
3. Wait for a subscription to be updated
   ```ruby
   Spackle::Waiters.wait_for_subscription("cus_000000000", "sub_00000000", status: "active")
   ```

These will block until Spackle is updated with the latest information from Stripe or until a timeout occurs.

#### Usage in development environments
In production, Spackle requires a valid Stripe customer. However, that is not development environments where state needs to be controlled. As an alternative, you can use a file store to test your application with seed data.

```json
/app/spackle.json

{
  "cus_000000000": {
    "features": [
      {
        "type": 0,
        "key": "flag_feature",
        "value_flag": true
      },
      {
        "type": 1,
        "key": "limit_feature",
        "value_limit": 100
      }
    ],
    "subscriptions": [
      {
        "id": "sub_000000000",
        "status": "trialing",
        "quantity": 1
      }
    ]
  }
}
```

Then configure the file store in your application:

```ruby
Spackle.store = Spackle::FileStore.new('/app/spackle.json')
```

#### Usage in test environments

In production, Spackle requires a valid Stripe customer. However, that is not ideal in testing or some development environments. As an alternative, you can use an in-memory store to test your application with seed data.

```ruby
Spackle.store = Spackle::MemoryStore.new()
Spackle.store.set_customer_data("cus_000000000", {
  "features": [
    {
      "type": 0,
      "key": "flag_feature",
      "value_flag": True,
    },
    {
      "type": 1,
      "key": "limit_feature",
      "value_limit": 100,
    },
  ],
  "subscriptions": [
     {
       "id": "sub_000000000",
       "status": "trialing",
       "quantity": 1,
     }
  ]
})
```

**Note:** The in-memory store is not thread-safe and state will reset on each application restart.

## Logging
The Spackle Ruby library emits logs as it performs various internal tasks. You can control the verbosity of Spackle's logging a few different ways:

1. Set the environment variable SPACKLE_LOG to the value `debug`, `info`, `warn` or `error`

   ```sh
   $ export SPACKLE_LOG=debug
   ```

2. Set Spackle.log_level:

   ```ruby
   Spackle.log_level = 'debug'
   ```