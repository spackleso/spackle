---
title: Spackle Python
pageTitle: Spackle - Python
description: Learn how to integrate your python application with Spackle
---

Learn how to get Spackle set up in your Python project{% .lead %}

---

## Setup

### Install the Spackle library

```
pip install spackle-python
```

### Configure your environment
In order to use Spackle, you need to configure your API key on the `spackle` module. You can find your API key in Spackle app [settings page](https://dashboard.stripe.com/settings/apps/so.spackle.stripe).

```
import spackle
spackle.api_key = "<api key>"
```

## Usage

### Get a Stripe customer

Spackle uses stripe ids as references to customer features.

```
customer = spackle.Customer.retrive("cus_00000000")
```

### Verify feature access

```
customer.enabled('feature_key')
```

### Fetch feature limit

```
customer.limit('feature_key')
```