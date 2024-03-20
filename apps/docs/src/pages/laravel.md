---
title: Integrate Spackle with Laravel
pageTitle: Spackle - Laravel
description: Learn how to integrate Spackle with Laravel
---

This comprehensive guide leads you through seamlessly integrating Spackle into a Laravel application. Upon completion, your Laravel app will leverage Spackle for managing user entitlements, allowing you to control access to certain features based on user subscription status.

## Preparing Your Environment and Installation

### Setting Up Laravel

If Laravel is not yet installed in your environment, you can install it through Composer:

```sh
composer global require laravel/installer
```

### Creating a New Laravel Project and Model

Execute the following command to start a new Laravel project:

```sh
laravel new myproject
```

Navigate into your project to create a new model within it:

```sh
cd myproject
php artisan make:model User -m
```

### Integrating Spackle Library

Install the Spackle library via Composer with this command:

```sh
composer require spackleso/spackle-php
```

And include Composer's autoload to enable the Spackle bindings:

```php
require_once('vendor/autoload.php');
```

## Extending Laravel's User Model

Begin by installing the Stripe PHP library:

```sh
composer require stripe/stripe-php
```

Then, update the User model to include a `stripe_customer_id` attribute.

```php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stripe\Stripe;

class User extends Model
{
    protected $fillable = ['stripe_customer_id'];

    public function save(array $options = [])
    {
        if (empty($this->stripe_customer_id)) {
            Stripe::setApiKey(env('STRIPE_SECRET'));
            $customer = \Stripe\Customer::create([
                'email' => $this->email,
            ]);
            $this->stripe_customer_id = $customer->id;
        }
        parent::save($options);
    }
}
```

Next, ensure your Laravel application uses this extended User model by updating your auth configuration as necessary.

## Configuration

### Setting Spackle API Key

Add your Spackle API key to your `.env` file for Laravel:

```dotenv
SPACKLE_API_KEY=<your_spackle_api_key>
```

And then access this API key in your application by adding it to your `config/services.php` file:

```php
'spackle' => [
    'api_key' => env('SPACKLE_API_KEY'),
],
```

## Implementing Spackle Middleware

Create a new middleware file named `SpackleMiddleware.php` in your `app/Http/Middleware` directory and include the following code:

```php
// app/Http/Middleware/SpackleMiddleware.php
namespace App\Http\Middleware;

use Closure;
use Spackle\Spackle;

class SpackleMiddleware
{
    public function handle($request, Closure $next)
    {
        Spackle::setApiKey(config('services.spackle.api_key'));

        if ($request->user()) {
            $stripeCustomerId = $request->user()->stripe_customer_id;
            $request->spackle_customer = Spackle\Customer::retrieve($stripeCustomerId);
        }

        return $next($request);
    }
}
```

Remember to register this middleware in your `app/Http/Kernel.php` file within the `$middlewareGroups` array.

## Feature Gating in Controllers

In your controller, you can check if a user has access to a feature like so:

```php
// app/Http/Controllers/FeatureController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FeatureController extends Controller
{
    public function protectedFeature(Request $request)
    {
        if (!$request->spackle_customer->enabled('feature_key')) {
            return response('Access denied to this feature.', 403);
        }

        return response('Welcome to the protected feature!');
    }
}
```

## Dynamically Rendering a Pricing Table

To dynamically render a pricing table from Spackle, first add a controller method to fetch and pass the pricing table data to your view:

```php
// app/Http/Controllers/PricingController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spackle\Spackle;

class PricingController extends Controller
{
    public function showPricingTable()
    {
        Spackle::setApiKey(config('services.spackle.api_key'));
        $pricingTable = Spackle\PricingTable::retrieve("abcde123");

        return view('pricing', ['pricingTable' => $pricingTable]);
    }
}
```

Then, define the route in your `routes/web.php` file:

```php
Route::get('/pricing', 'PricingController@showPricingTable');
```

Update your view files accordingly to display the pricing table as obtained from Spackle, allowing for dynamic updates straight from your Spackle dashboard without any code