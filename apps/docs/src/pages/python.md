---
title: Spackle Python
pageTitle: Spackle - Python
description: Learn how to integrate your python application with Spackle
---

Learn how to get Spackle set up in your Python project{% .lead %}

---

## Setup

### Install the Spackle library

```sh
pip install -U spackle-python
```

### Configure your environment
In order to use Spackle, you need to configure your API key on the `spackle` module. You can find your API key in Spackle app [settings page](https://dashboard.stripe.com/settings/apps/so.spackle.stripe).

```python
import spackle
spackle.api_key = "<api key>"
```

### Bootstrap the client (optional)

The Spackle client requires a single initialization step that includes a network request. To front load this process, you can call the `bootstrap` method in your codebase.

```python
spackle.bootstrap()
```

## Usage

### Fetch a customer

Spackle uses stripe ids as references to customer features.

```python
customer = spackle.Customer.retrieve("cus_00000000")
```

### Verify feature access

```python
customer.enabled("feature_key")
```

### Fetch a feature limit

```python
customer.limit("feature_key")
```

### Examine a customer's subscriptions

A customer's current subscriptions are available on the `subscriptions` property. These are valid `stripe.Subscription` objects as defined in the [Stripe Python library](https://stripe.com/docs/api/subscriptions/object?lang=python).

```python
customer.subscriptions
```

## Waiters

There is a brief delay between when an action takes place in Stripe and when it is reflected in Spackle. To account for this, Spackle provides a `waiters` module that can be used to wait for a Stripe object to be updated and replicated.

1. Wait for a customer to be created
   ```python
   spackle.wait_for_customer("cus_00000000")
   ```
2. Wait for a subscription to be created
   ```python
   spackle.wait_for_subscription("cus_000000000", "sub_00000000")
   ```
3. Wait for a subscription to be updated
   ```python
   spackle.wait_for_subscription("cus_000000000", "sub_00000000", status="active")
   ```

These will block until Spackle is updated with the latest information from Stripe or until a timeout occurs.


## Logging
The Spackle Python library emits logs as it performs various internal tasks. You can control the verbosity of Spackle's logging a few different ways:

1. Set the environment variable SPACKLE_LOG to the value `debug`, `info`, or `warn`

   ```sh
   $ export SPACKLE_LOG=debug
   ```

2. Set spackle.log:

   ```python
   import spackle
   spackle.log = 'debug'
   ```

3. Enable it through Python's logging module:

   ```python
   import logging
   logging.basicConfig()
   logging.getLogger('spackle').setLevel(logging.DEBUG)
   ```


## Usage in development environments

In production, Spackle requires a valid Stripe customer. However, that is not development environments where state needs to be controlled. As an alternative, you can use a file store to test your application with seed data.

```json
/app/spackle.json

{
  "cus_000000000": {
    "features": [
      {
        "key": "flag_feature",
        "value_flag": true
      },
      {
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

```python
spackle.set_store(spackle.FileStore("/app/spackle.json"))
```


## Usage in testing environments

In production, Spackle requires a valid Stripe customer. However, that is not ideal in testing or some development environments. As an alternative, you can use an in-memory store to test your application with seed data.

```python
spackle.set_store(spackle.MemoryStore())
spackle.get_store().set_customer_data("cus_000000000", {
  "features": [
    {
      "key": "flag_feature",
      "value_flag": True,
    },
    {
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