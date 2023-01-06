import spackle
from getpass import getpass

spackle.api_key = getpass('Enter your Spackle API key: ')
customer_id = input('Enter your customer\'s Stripe ID: ')
feature_key = input('Enter the feature key you want to explore: ')

customer = spackle.Customer.retrieve(customer_id)
feature = next(feature for feature in customer.data['features'] if feature['key'] == feature_key)
if feature['type'] == 0:
    enabled = customer.enabled(feature_key)
    print(f'\nFeature {feature_key} is {"enabled" if enabled else "disabled"} for customer {customer_id}')
else:
    limit = customer.limit(feature_key)
    print(f'\nFeature {feature_key} has a limit of {limit} for customer {customer_id}')