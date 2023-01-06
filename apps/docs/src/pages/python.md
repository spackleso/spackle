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
pip install spackle-python
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
customer = spackle.Customer.retrive("cus_00000000")
```

### Verify feature access

```python
customer.enabled("feature_key")
```

### Fetch a feature limit

```python
customer.limit("feature_key")
```

## Logging
The Spackle Python library emits logs as it performs various internal tasks. You can control the verbosity of Spackle's logging a few different ways:

1. Set the environment variable SPACKLE_LOG to the value debug or info

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
