---
title: Entitlements
pageTitle: Spackle - Entitlements
description: Learn how entitlements simplify your SaaS billing integration
---

## Usage

Spackle allows you to customize feature access at the Product and Customer level. Sales can negotiate any features or limits within the product, without any engineering time required.

{% image src="/entitlements-1.png" alt="Entitlements" width=3248 height=2112 /%}

### Set feature access for products

To customize feature behavior, navigate to your Stripe product and set the values for that specific product. Whenever a customer subscribes to that product, they will be given access to those features based on the values you set.

{% image src="/entitlements-2.png" alt="Create entitlements" width=3248 height=2112 /%}


### Override feature access for individual customers

In enterprise sales, there are opportunities to sell and negotiate custom features and limits for specific customers. Spackle allows you to customize the user experience for specific customers, without any engineering time required.

Navigate to the customer, and set the values for that specific customer. These will override any values set at the product level.

{% image src="/entitlements-3.png" alt="Create entitlements" width=3248 height=2112 /%}

### Integrate with your product

To integrate with your codebase, check out the language specific libraries below.

#### Libraries

* [Node.js](/node)
* [PHP](/php)
* [Python](/python)
* [Ruby](/ruby)