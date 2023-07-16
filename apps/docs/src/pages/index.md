---
title: Getting started
pageTitle: Spackle - Getting Started
description: Learn how to integrate your application with Spackle
---

Learn how to get Spackle set up in your project{% .lead %}

---

## Quick start

### Install the Stripe app

You can find Spackle in the [Stripe App Marketplace](https://marketplace.stripe.com/).


### Set up your features

After you set up the Stripe app, click "Manage Features" at the bottom of the Spackle viewport.

{% image src="/getting-started-1.png" alt="Getting Started: Step 1" width=1524 height=995 /%}

Then click "Create New" to create a new feature.

{% image src="/getting-started-3.png" alt="Getting Started: Step 3" width=1526 height=997 /%}

There are two types of features in Spackle:

1. `Flags` are used for toggling access to a feature based on the customer's subscription. For example, a "Pro" version of a CRM platform might have an "Email Templates" feature that is only enabled while the customer is in good standing with the CRM. "Email Templates" would be a good example of a Flag.
2. `Limits` are usage based ceilings that can vary based on the customer's subscription. For example, a "Pro" version of a CRM platform might have a "Number of Subscribers" limit that varies based on the customer's plan.

{% callout title="Defaults Matter" %}
When creating features, the values you select for "Flag" or "Limit" will be set across all of your customers. For this reason, it makes sense to make these defaults the *most* restrictive. The recommended value for flags is `false` and the recommended value for limits is `0`.
{% /callout %}


### Find your API token

You can find your Spackle api token in the Spackle app [settings page](https://dashboard.stripe.com/settings/apps/so.spackle.stripe).

---

## Basic usage

Spackle allows you to customize feature access at the Product, Price, and Customer level. Sales can negotiate any features or limits within the product, without any engineering time required.

### Set feature access

To customize feature behavior, navigate to your Stripe product and set the values for that specific product.

{% image src="/getting-started-4.png" alt="Getting Started: Step 4" width=3338 height=2123 /%}

### Integrate with your product

To integrate with your codebase, check out the language specific libraries below.

#### Libraries

* [Node.js](/node)
* [PHP](/php)
* [Python](/python)
* [Ruby](/ruby)