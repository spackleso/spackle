INSERT INTO
    stripe_accounts (stripe_id, name)
VALUES
    ('acct_1LtR9JLoL33dwtwt', 'Spackle');

INSERT INTO
    features (stripe_account_id, name, key, type, value_limit)
VALUES
    (
        'acct_1LtR9JLoL33dwtwt',
        'Number of Features',
        'num_features',
        1,
        0
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'Number of Users',
        'num_users',
        1,
        0
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'Number of Entitlement Checks',
        'num_entitlement_checks',
        1,
        0
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'Number of Pricing Tables',
        'num_pricing_tables',
        1,
        0
    );

INSERT INTO
    stripe_products (stripe_account_id, stripe_id)
VALUES
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfAeqHJMYQ4bj'
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfCizB4o516Ki'
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfDhT9J2dBMUV'
    );

INSERT INTO
    product_features (
        stripe_account_id,
        stripe_product_id,
        feature_id,
        value_limit
    )
VALUES
    -- Free Tier
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfAeqHJMYQ4bj',
        1,
        3
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfAeqHJMYQ4bj',
        2,
        1
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfAeqHJMYQ4bj',
        3,
        1000
    ),
    -- Starter Tier
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfCizB4o516Ki',
        1,
        25
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfCizB4o516Ki',
        2,
        5
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfCizB4o516Ki',
        3,
        100000
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfCizB4o516Ki',
        4,
        1
    ),
    -- Pro Tier
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfDhT9J2dBMUV',
        1,
        100
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfDhT9J2dBMUV',
        2,
        25
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfDhT9J2dBMUV',
        3,
        1000000
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_PxfDhT9J2dBMUV',
        4,
        10
    );