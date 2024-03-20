---
title: Integrate Spackle with Ruby on Rails
pageTitle: Spackle - Ruby on Rails
description: Learn how to integrate Spackle with your Ruby on Rails application
---

This guide will help you integrate Spackle with a Ruby on Rails application. By following these steps, you'll be able to use Spackle for managing user entitlements and gating features based on subscriptions within your Rails app.

## Setup and Installation

### Installing Rails

If Rails isn't already set up in your environment, you can install it using the following command:

```sh
gem install rails
```

### Create a Rails Project

Generate a new Rails project by executing:

```sh
rails new myrailsproject
```

Navigate into your project directory:

```sh
cd myrailsproject
```

### Add the Spackle Gem

Add Spackle to your Gemfile:

```ruby
gem 'spackle-ruby'
```

And then install the gem using Bundler:

```sh
bundle install
```

## Configuration

### Set Up Environment Variables

It's important to securely configure your Spackle API key. Set this key in your environment variables, or use Rails credentials to store it securely.

```ruby
# config/initializers/spackle.rb
Spackle.api_key = ENV["SPACKLE_API_KEY"]
```

## Extending the User Model

First, if you haven't already, generate a User model:

```sh
rails generate model User email:string stripe_customer_id:string
```

Migrate your database to create the User model:

```sh
rails db:migrate
```

Next, modify your `User` model to create a Stripe customer ID when a user is saved:

```ruby
# app/models/user.rb
class User < ApplicationRecord
  before_save :create_stripe_customer_id

  private

  def create_stripe_customer_id
    if stripe_customer_id.blank?
      customer = Stripe::Customer.create(email: email)
      self.stripe_customer_id = customer.id
    end
  end
end
```

## Spackle Middleware for Rails

Create a middleware for Spackle to manage entitlements:

```ruby
# lib/spackle_middleware.rb
class SpackleMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)
    if request.session[:user_id]
      user = User.find(request.session[:user_id])
      request.env['spackle_customer'] = Spackle::Customer.retrieve(user.stripe_customer_id)
    end

    @app.call(env)
  end
end
```

And add this middleware to your Rails application:

```ruby
# config/application.rb
config.middleware.use "SpackleMiddleware"
```

## Feature Gating in Controllers

You can now use Spackle to gate features within your Rails controllers:

```ruby
# app/controllers/some_controller.rb
class SomeController < ApplicationController
  def some_action
    unless request.env['spackle_customer'].enabled("feature_key")
      render plain: "You do not have access to this feature."
    else
      render plain: "Welcome to the protected feature!"
    end
  end
end
```

## Dynamic Pricing Table with Spackle

To dynamically render a pricing table, you can fetch the details from Spackle and pass them to your view:

```ruby
# app/controllers/pricing_controller.rb
class PricingController < ApplicationController
  def index
    @pricing_table = Spackle::PricingTable.retrieve("abcde123")
  end
end
```

Then, in your view, iterate over `@pricing_table` to display the pricing options.

## Testing

For testing purposes, use Spackle's in-memory store:

```ruby
# test/test_helper.rb
Spackle.store = Spackle::MemoryStore.new()
Spackle.store.set_customer_data("cus_000000000", {
  "features": [
    {
      "type": 0,
      "key": "feature_key",
      "value_flag": true
    }
  ],
  "subscriptions": [
    {
      "id": "sub_00000000",
      "status": "trialing",
      "quantity": 1
    }
  ]
})
```

## Optional: Logging Configuration

To monitor Spackle's internal operations, adjust the logging level:

```ruby
# In an initializer or environment file
Spackle.log_level = 'debug'
```