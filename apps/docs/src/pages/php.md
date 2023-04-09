---
title: Spackle PHP
pageTitle: Spackle - PHP
description: Learn how to integrate your php application with Spackle
---

Learn how to get Spackle set up in your PHP project{% .lead %}

---

## Setup

### Install the Spackle library

```sh
composer require spackleso/spackle-php
```

To use the bindings use Composer's autoload:

```php
require_once('vendor/autoload.php');
```

### Configure your environment
In order to use Spackle, you need to configure your API key on the `Spackle` singleton. You can find your API key in Spackle app [settings page](https://dashboard.stripe.com/settings/apps/so.spackle.stripe).

```php
\Spackle\Spackle::setApiKey('<api key>');
```

### Optional: Optimize performance

Spackle's PHP library connects to the Spackle data stores via SSL by default. While more secure, this does come with a performance penalty. If the default latency is not acceptable for your application, you can configure the library to not use SSL. This can cut latency in half.

```php
\Spackle\Spackle::setSSLEnabled(false):
```

## Usage

### Fetch a customer

Spackle uses stripe ids as references to customer features.

```php
$customer = \Spackle\Customer::retrieve("cus_000000000");
```

### Verify feature access

```php
$customer->enabled("feature_key");
```

### Fetch a feature limit

```php
$customer->limit("feature_key");
```

### Examine a customer's subscriptions

A customer's current subscriptions are available on the `subscriptions` method. These are valid `\Stripe\Subscription` objects as defined in the [Stripe PHP library](https://stripe.com/docs/api/subscriptions/object?lang=php).

```php
$customer->subscriptions();
```

## Waiters

There is a brief delay between when an action takes place in Stripe and when it is reflected in Spackle. To account for this, Spackle provides a `Waiters` class with static methods that can be used to wait for a Stripe object to be updated and replicated.

1. Wait for a customer to be created
   ```php
   \Spackle\Waiters::waitForCustomer("cus_00000000");
   ```
2. Wait for a subscription to be created
   ```php
   \Spackle\Waiters::waitForSubscription("cus_000000000", "sub_00000000");
   ```
3. Wait for a subscription to be updated
   ```php
   \Spackle\Waiters::waitForSubscription("cus_000000000", "sub_00000000", array("status" => "active"));
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

```php
\Spackle\Spackle::setStore(new \Spackle\Stores\FileStore("/app/spackle.json"));
```


## Usage in testing environments

In production, Spackle requires a valid Stripe customer. However, that is not ideal in testing or some development environments. As an alternative, you can use an in-memory store to test your application with seed data.

```php
\Spackle\Spackle::setStore(new \Spackle\Stores\MemoryStore());
\Spackle\Spackle::getStore()->set_customer_data("cus_000000000", array(
  "features" => array(
    array(
      "type" => 0,
      "key" => "flag_feature",
      "value_flag" => true
    ),
    array(
      "type" => 1,
      "key" => "limit_feature",
      "value_limit" => 100
    )
  ),
  "subscriptions" => array(
    array(
      "id" => "sub_000000000",
      "status" => "trialing",
      "quantity" => 1
    )
  )
);
```

**Note:** The in-memory store is not thread-safe and state will reset on each application restart.