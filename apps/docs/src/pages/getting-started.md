---
title: Getting started
pageTitle: Spackle - Getting Started
description: Learn how to integrate your application with Spackle
---

Learn how to get Spackle set up in your project{% .lead %}

---

##  Create your features

After you set up the Stripe app, click "Manage Features" at the top of the Spackle viewport.

{% image src="/getting-started-1.png" alt="Getting Started: Step 1" width=1524 height=995 /%}

Then click "Create New" to create a new feature.

{% image src="/getting-started-2.png" alt="Getting Started: Step 2" width=1526 height=997 /%}

There are two types of features in Spackle:

1. `Flags` are used for toggling access to a feature based on the customer's subscription. For example, a "Pro" version of a CRM platform might have an "Email Templates" feature that is only enabled while the customer is in good standing with the CRM. "Email Templates" would be a good example of a Flag.
2. `Limits` are usage based ceilings that can vary based on the customer's subscription. For example, a "Pro" version of a CRM platform might have a "Number of Subscribers" limit that varies based on the customer's plan.

{% callout title="Defaults Matter" %}
When creating features, the values you select for "Flag" or "Limit" will be set across all of your customers. For this reason, it makes sense to make these defaults the *most* restrictive. The recommended value for flags is `false` and the recommended value for limits is `0`.
{% /callout %}

---

##  Use your features

Features are the building blocks of your pricing model. Once you've set up your features, you can integrate them into your product via pricing tables and entitlements.

{% quick-links %}

{% quick-link title="Pricing Tables" icon="presets" href="/pricing-tables" description="Use Spackle's headless pricing tables to dynamically manage your pricing structure." /%}

{% quick-link title="Entitlements" icon="lightbulb" href="/entitlements" description="Extend the library with third-party plugins or write your own." /%}

{% /quick-links %}
