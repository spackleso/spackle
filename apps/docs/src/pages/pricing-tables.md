---
title: Pricing Tables
pageTitle: Spackle - Pricing Tables
description:
---

## Usage

Updating your pricing should be as easy as flipping a switch. Spackle allows you to create headless pricing tables from your Stripe products and Spackle features.

{% image src="/pricing-table-1.png" alt="Pricing table preview" width=3248 height=2112 /%}

### Configure your pricing table

On the "Pricing Table" tab of your Spackle viewport, click the "Edit" button.

{% image src="/pricing-table-2.png" alt="Pricing tables edit" width=3248 height=2112 /%}

#### Set billing intervals

Then enable the billing intervals you would like to support. Currently, Spackle supports monthly and annual billing intervals.

{% image src="/pricing-table-3.png" alt="Pricing table billing intervals" width=3248 height=2112 /%}

#### Add products

You can add any number of supported products to your pricing table. For example, if you offer a "Basic" and "Pro" product, you can add both to your pricing table and select the pricing for each supported billing interval.

{% image src="/pricing-table-4.png" alt="Pricing table products" width=3248 height=2112 /%}

### Integrate with your product


#### Embed your pricing table

Once you've configured your pricing table, you can embed it in your application. First, retrieve your public key from the "Settings" tab of your Spackle viewport.

{% image src="/pricing-table-5.png" alt="Pricing table public key" width=3248 height=2112 /%}

Then, add the following script tag to your application. Be sure to replace `<key>` with your public key and `<id>` with your pricing table id.

```js
fetch('https://api.spackle.so/v1/pricing_tables/<id>', {
    headers: {
        Authorization: 'Bearer <key>',
    }
})
```

The data returned from the pricing table looks like this:

```ts
{
  id: string
  name: string
  intervals: string[]
  products: {
    id: string
    features: {
      id: string
      name: string
      key: string
      type: number
      value_flag: boolean
      value_limit: number | null
    }[]
    name: string
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

#### Server integration

To integrate with your server codebase, check out the language specific libraries below. Pricing tables are meant to be headless. So depending on your stack, you'll fetch data from the Spackle API and render the pricing table in your application.

##### Libraries

* [Node.js](/node)
* [PHP](/php)
* [Python](/python)
* [Ruby](/ruby)