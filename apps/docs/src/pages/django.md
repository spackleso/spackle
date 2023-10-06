---
title: Integrate Spackle with Django
pageTitle: Spackle - Django
description: Learn how to integrate Spackle with Django
---

This guide will walk you through the process of integrating Spackle with a Django application. By the end of this guide, you will have a Django app that uses Spackle to manage entitlements, enabling you to gate features for users based on their subscriptions.

## Prerequisites and Installation

### Installing Django

If you haven't installed Django, you can do so using pip:

```sh
pip install Django
```

### Create a Django Project and App

Run the following command to create a new Django project:

```sh
django-admin startproject myproject
```

And to create a new app within your project:

```sh
cd myproject
python manage.py startapp myapp
```

### Install the Spackle Library

To install the Spackle library, run the following command:

```sh
pip install -U spackle-python
```

## Extending Django's User Model

Firstly, install the Stripe Python library:

```sh
pip install stripe
```

Then create a new model that inherits from Django's `AbstractUser` and add a `stripe_customer_id` field to it.

```python
# myapp/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
import stripe

class User(AbstractUser):
    stripe_customer_id = models.CharField(max_length=50, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.stripe_customer_id:
            stripe.api_key = "your_stripe_api_key_here"
            customer = stripe.Customer.create(email=self.email)
            self.stripe_customer_id = customer.id
        super().save(*args, **kwargs)
```

Then, update your Django settings to use this new User model:

```python
# myproject/settings.py
AUTH_USER_MODEL = 'myapp.User'
```

## Configuration

### Set API Key in Django Settings

Your Django `settings.py` file will contain your Spackle API key. Open `myproject/settings.py` and add:

```python
# myproject/settings.py
SPACKLE_API_KEY = '<api_key>'
```

## Spackle Middleware Setup

Create a new file, `middleware.py`, in your `myapp` directory and add the following code:

```python
# myapp/middleware.py
import spackle
from django.conf import settings

spackle.api_key = settings.SPACKLE_API_KEY

class SpackleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        if request.user.is_authenticated:
            stripe_customer_id = request.user.stripe_customer_id
            request.spackle_customer = spackle.Customer.retrieve(stripe_customer_id)
```

Now, register this middleware by adding it to your Django settings:

```python
# myproject/settings.py
MIDDLEWARE = [
    # ... existing middleware
    'myapp.middleware.SpackleMiddleware',
    # ... existing middleware
]
```

## Example View with Feature Gating

Here's how your view could look like:

```python
# myapp/views.py
from django.http import HttpResponse

def my_protected_view(request):
    if not request.spackle_customer.enabled("feature_key"):
        return HttpResponse('You do not have access to this feature.')

    return HttpResponse('Welcome to the protected feature!')
```

## Rendering a Pricing Table via a Django View with Spackle

To render a dynamic pricing table from Spackle, use the following code. First, add a method to fetch the pricing table using Spackle's Python SDK.

```python
# myapp/views.py
import spackle
from django.shortcuts import render

def pricing_table_view(request):
    pricing_table = spackle.PricingTable.retrieve("abcde123")
    return render(request, 'pricing_table.html', {"pricing_table": pricing_table})
```

Next, add the URL configuration for this view. Update your `urls.py` as follows:

```python
# myapp/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('pricing/', views.pricing_table_view, name='pricing_table'),
    # ... other url patterns
]
```

Now, update your HTML template to display the pricing table dynamically.


```django-pricing-table
--- DJANGO TEMPLATE HERE
```

This will display the pricing table as defined in your Spackle dashboard, including different intervals, and allows for dynamic updates without requiring changes to your codebase.

## Testing

For testing, you can set up an in-memory store in your test case's `setUp` method.

```python
# myapp/tests.py
import spackle
from django.test import RequestFactory

def setUp(self):
    spackle.set_store(spackle.MemoryStore())
    spackle.get_store().set_customer_data("cus_00000000", {
        "features": [
            {"type": 0, "key": "feature_key", "value_flag": True},
        ],
        "subscriptions": [{"id": "sub_000000000", "status": "trialing", "quantity": 1}],
    })
    self.factory = RequestFactory()
```

## Optional: Configure Logging

If you wish to monitor Spackle's internal tasks, you can control its logging verbosity.

1. Set the environment variable:

```sh
$ export SPACKLE_LOG=debug
```

2. Or, set it programmatically:

```python
# myproject/settings.py
import spackle
spackle.log = 'debug'
```

You now have a fully functional Django application that uses Spackle for feature gating and dynamically renders a pricing table fetched from Spackle. Adding this to your Django application allows you to better manage entitlements and pricing, thus enhancing Spackle's utility within your infrastructure.