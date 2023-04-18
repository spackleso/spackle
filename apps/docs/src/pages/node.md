---
title: Spackle Node
pageTitle: Spackle - Node
description: Learn how to integrate your Node.js application with Spackle
---

Learn how to get Spackle set up in your Node.js project{% .lead %}

---

## Setup

### Install the Spackle library

```sh
npm install spackle-node
```

### Configure your environment
In order to use Spackle, create a new `Spackle` client with your API key. You can find your API key in Spackle app [settings page](https://dashboard.stripe.com/settings/apps/so.spackle.stripe).

```js
import Spackle from 'spackle-node';

const spackle = new Spackle('<api-key>')
```

### Bootstrap the client (optional)

The Spackle client requires a single initialization step that includes a network request. To front load this process, you can call the `bootstrap` method in your codebase.

```js
await spackle.bootstrap()
```

## Usage

### Fetch a customer

Spackle uses stripe ids as references to customer features.

```js
customer = await spackle.customers.retrieve('cus_000000000')
```

### Verify feature access

```js
customer.enabled("feature_key")
```

### Fetch a feature limit

```js
customer.limit("feature_key")
```

### Examine a customer's subscriptions

A customer's current subscriptions are available on the `subscriptions` property. These are valid `stripe.Subscription` objects as defined in the [Stripe Node library](https://stripe.com/docs/api/subscriptions/object?lang=node).

```js
customer.subscriptions
```

## Waiters

There is a brief delay between when an action takes place in Stripe and when it is reflected in Spackle. To account for this, Spackle provides a `waiters` resource that can be used to wait for a Stripe object to be updated and replicated.

1. Wait for a customer to be created
   ```js
   await spackle.waiters.waitForCustomer("cus_00000000")
   ```
2. Wait for a subscription to be created
   ```js
   await spackle.waiters.waitForSubscription("cus_000000000", "sub_00000000")
   ```
3. Wait for a subscription to be updated
   ```js
   await spackle.waiters.waitForSubscription("cus_000000000", "sub_00000000", status="active")
   ```

These will block until Spackle is updated with the latest information from Stripe or until a timeout occurs.


## Usage in development environments

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

```js
import Spackle, { FileStore } from 'spackle-node';
const store = new FileStore("/app/spackle.json")
const spackle = new Spackle("<api-key>", store)
```

## Usage in testing environments

In production, Spackle requires a valid Stripe customer. However, that is not ideal in testing or some development environments. As an alternative, you can use an in-memory store to test your application with seed data.

```python
import Spackle, { FileStore } from 'spackle-node';
const store = new FileStore("/app/spackle.json")
const spackle = new Spackle("<api-key>", store)
spackle.get_store().set_customer_data("cus_000000000", {
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