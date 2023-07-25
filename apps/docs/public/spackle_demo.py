import spackle
from getpass import getpass

spackle.api_key = getpass('Enter your Spackle API key: ')
customer_id = input('Enter your customer\'s Stripe ID: ')

customer = spackle.wait_for_customer(customer_id)

print("")
print(f'Features for {customer_id}')
print('------------------------')
for feature in customer.data['features']:
    if feature['type'] == 0:
        print(f'Flag {feature["key"]}: {feature["value_flag"]}')
    else:
        print(f'Limit {feature["key"]}: {feature["value_limit"]}')