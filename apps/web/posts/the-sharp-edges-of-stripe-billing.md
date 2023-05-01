---
title: "The Sharp Edges of Stripe Billing"
excerpt: "Stripe Billing is both the fastest way to recurring revenue and the source of pricing and technical debt. You've created a product, generated some revenue, and have decided to make some changes to your pricing. What now?"
isPublished: true
publishedDate: "2023-05-01"
updatedDate: "2023-05-01"
---

*How Stripe Billing is both the fastest way to recurring revenue and the source of pricing and technical debt. Need help implementing Stripe at your company? Try [Spackle](https://www.spackle.so).*

## The Stripe Billing Honeymoon

You’ve done your research, built a product, and have gained some traction in the marketplace. It’s time to introduce recurring revenue. Or at least, transfer the manual invoicing process that you’ve been running so far into a formal billing system.

Naturally, Stripe’s offerings come with out-of-the-box support for everything you need at the moment. You spend a few hours in Stripe Billing creating your pricing tiers, free trials, subscription intervals, and checkout flows.

On the engineering side, a sprint has been set aside to build out your billing system. Following Stripe’s (impeccable) documentation, you mirror the Stripe Billing data model in your database and set up webhook handlers to keep the data in sync. Authorization middleware is added to the tech stack to make sure the paywall is obeyed across all of your clients.

You send the launch announcement and start collecting money. This works well for a while. New features get developed and wedged into the original pricing scheme. Occasionally, you get requests for something a little more custom, but it’s nothing that a couple flags on the account table can’t fix. Your Stripe products page gets longer and longer as you set up custom price points for some of your more special customers.

## Cracks Start to Form

Over time, this starts to get a little unmanageable. There’s pressure to offer enterprise versions of your application as offers with larger dollar amounts start to arrive. Your sales team feels held back.

You were never quite sure if your pricing was optimal to begin with. And now you’ve now added a lot of functionality to the application. Are you sure you shouldn’t have an additional tier? What about replacing the per user model with a usage based model?

The problem is that original pricing structure has wormed its way into every corner of your business logic. To replace your pricing structure is to remove the foundation of much of your app’s functionality. Every authorization check, navigation element, product nudge, and email template (to name just a few), depended on one thing: **that you picked the correct pricing model and price point on the first try and for all time.**

Of course, that is a ridiculous assumption. All companies grow out of their pricing over time. Co-founders trying to get their first dozen paying customers are optimizing for an entirely different set of outcomes compared to a mature organization with a CRO.

So what do you do? You take the plunge, marking off another development cycle to replace your old billing system with a new one. Given that this system is the basis for your entire business, this is not an anxiety reducing activity. At best, all of your clients don’t notice anything different since they’ve been properly grandfathered in. At worst, you introduce bugs that break the very features directly tied to payment.

But let’s assume you make it through to the other side. You’re happy with your new pricing. You have to be, because you’re effectively in the same place as before but with different pricing. The thought of rolling back or iterating on your decision is something that doesn’t enter your mind.

## Entitlements Save the Day

Everyone knows what an [entitlement](http://localhost:3002/posts/saas-entitlements-the-basics) is (in the world of SaaS) even if they don’t know the word for it. They are the features that appear on your pricing page, typically divided up between tiers, that convince users to purchase your product. But they serve an important purpose for breaking out of the Stripe Billing cycle of pain followed by massive code refactoring (and even add a few superpowers of their own).

Entitlements are the missing piece of the Stripe Billing technical documentation. When implementing Stripe Billing, there should be an entire section about future proofing your billing system with an entitlements database table.

What does this look like in practice? For starters, aside from the initial checkout flow, your business logic should never need to know the state of the billing system. Instead, your business logic should only be asking the question: **"can this user perform this action?”**

“This action” is an entitlement. Whether it’s adding a new contact within a CRM, sending emails as an ESP, or adding a new user to a seat based application, the entitlement is all that matters. To ask this question, your app should look to an entitlements table for verifying access.

The entitlement table’s data should be set by your Stripe webhook handlers and billing model. If a Stripe customer subscribes to a plan that enables a feature, your webhooks will be notified and you can enable that entitlement for the account.

As you can see, this decouples the billing model and billing state from the rest of your application. The entire billing model could be thrown out and replaced without your application knowing the difference. Or maybe you want to try a few variations of pricing to see what works best. You can do that without touching your application code. Simply set up the new plans in Stripe and wire up the entitlements. This is something that's not possible with the traditional Stripe Billing model.

## Wrapping Up

Stripe and Stripe Billing have made it easier than ever to spin up a revenue generating SaaS product. But the power of the Stripe platform comes with a few sharp edges. Often times, you don’t see the full impact of the decisions you’ve made until it’s time to change them. Entitlements are just one way that you can continue to build product and make sales, without feeling held back by your past decisions.

*Need help implementing entitlements at your company? Try [Spackle](https://www.spackle.so).*