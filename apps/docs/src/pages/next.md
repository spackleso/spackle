---
title: Integrate Spackle with Next.js
pageTitle: Spackle - Next.js
description: Learn how to integrate Spackle with Next.js
---

Learn how to integrate Spackle with a Next.js 14 application to manage entitlements and feature gating based on user subscriptions.

## Getting Started

### Prerequisites

Ensure you have Node.js installed on your machine. If not, download and install it from the [official Node.js website](https://nodejs.org/).

### Set Up Your Next.js Project

If you haven't already created a Next.js project, do so by running:

```sh
npx create-next-app@latest my-next-app
cd my-next-app
```

### Install the Spackle Library

To use Spackle in your Next.js project, install the Spackle library via npm:

```sh
npm install spackle-node
```

## Spackle Integration

### Configure the Spackle Client

Create a Spackle client with your API key. You can find your API key in the Spackle dashboard under settings. It's recommended to store sensitive information like your API key in environment variables. Create a `.env.local` file in the root of your Next.js project and add your Spackle API key:

```env
# .env.local
SPACKLE_API_KEY=your_spackle_api_key_here
```

Then, configure your Spackle client in your application. Create a new file `lib/spackle.js` and add:

```js
// lib/spackle.js
import Spackle from 'spackle-node';

const spackleApiKey = process.env.SPACKLE_API_KEY;
const spackle = new Spackle(spackleApiKey);

export default spackle;
```

### Fetching Pricing Tables

Create a page to display pricing information fetched from Spackle. Here's an example on how to fetch and render a pricing table:

```js
// pages/pricing.js
import React from 'react';
import spackle from '../lib/spackle';

const Pricing = ({ pricingTable }) => {
  return (
    <div>
      <h1>Pricing</h1>
      {/* Render your pricing table here */}
    </div>
  );
};

export async function getServerSideProps() {
  const pricingTable = await spackle.pricingTables.retrieve('abcde123');
  return { props: { pricingTable } };
}

export default Pricing;
```

### Managing User Entitlements

To manage user entitlements, such as checking if a user has access to a certain feature, you can add logic to your API routes or page components. Here's an example of checking feature access:

```js
// pages/api/protected-feature.js
import spackle from '../../lib/spackle';

export default async function handler(req, res) {
  const customer = await spackle.customers.retrieve('cus_000000000');

  if (!customer.enabled("feature_key")) {
    return res.status(403).json({ error: 'You do not have access to this feature.' });
  }

  res.status(200).json({ message: 'Welcome to the protected feature!' });
}
```

### Usage in Development and Testing Environments

For development and testing, you can use a file store or an in-memory store to simulate Spackle's behavior without needing actual Stripe customers. Refer to the Node.js documentation section on using the `FileStore` for development and the in-memory store for testing.

## Conclusion

You now have a Next.js 14 application integrated with Spackle, capable of managing user entitlements and feature gating based on subscriptions. This setup allows for dynamic pricing tables and feature management, enhancing your application's subscription-based functionalities.