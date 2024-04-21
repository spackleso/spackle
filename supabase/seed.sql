INSERT INTO
    stripe_accounts (stripe_id, name)
VALUES
    ('acct_1LtR9JLoL33dwtwt', 'Spackle');

INSERT INTO
    tokens (stripe_account_id, token)
VALUES
    (
        'acct_1LtR9JLoL33dwtwt',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhY2N0XzFMdFI5SkxvTDMzZHd0d3QiLCJpYXQiOjE3MTM2NTUxNTl9.WlFSTD5QqCt9Vlkx2WbUvX3lrU8_ChdR6Xfav4Nu5gU'
    );

INSERT INTO
    features (
        stripe_account_id,
        name,
        key,
        type,
        value_limit,
        value_flag
    )
VALUES
    (
        'acct_1LtR9JLoL33dwtwt',
        'Features',
        'num_features',
        1,
        0,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'Users',
        'num_users',
        1,
        0,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'Entitlement Checks',
        'num_entitlement_checks',
        1,
        0,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'Pricing Tables',
        'num_pricing_tables',
        1,
        0,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        '~ (Dep) Entitlements',
        'entitlements',
        0,
        null,
        false
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        '~ (Dep) Pricing Tables',
        'pricing_tables',
        0,
        null,
        false
    );

INSERT INTO
    stripe_products (stripe_account_id, stripe_id)
VALUES
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi6eeCojR0HJI'
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi8WR5dqxhYmq'
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi9ygQTVSBeFJ'
    );

INSERT INTO
    stripe_prices (stripe_account_id, stripe_product_id, stripe_id)
VALUES
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi6eeCojR0HJI',
        'price_1P7mgeLoL33dwtwt4UiVqn8D'
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi8WR5dqxhYmq',
        'price_1P7mi1LoL33dwtwtQhjOjJB7'
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi9ygQTVSBeFJ',
        'price_1P7mixLoL33dwtwtLJ2zQpdR'
    );

INSERT INTO
    product_features (
        stripe_account_id,
        stripe_product_id,
        feature_id,
        value_limit,
        value_flag
    )
VALUES
    -- Free Tier
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi6eeCojR0HJI',
        1,
        3,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi6eeCojR0HJI',
        2,
        1,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi6eeCojR0HJI',
        3,
        1000,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi6eeCojR0HJI',
        5,
        null,
        true
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi6eeCojR0HJI',
        6,
        null,
        true
    ),
    -- Starter Tier
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi8WR5dqxhYmq',
        1,
        25,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi8WR5dqxhYmq',
        2,
        5,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi8WR5dqxhYmq',
        3,
        100000,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi8WR5dqxhYmq',
        4,
        1,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi8WR5dqxhYmq',
        5,
        null,
        true
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi8WR5dqxhYmq',
        6,
        null,
        true
    ),
    -- Pro Tier
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi9ygQTVSBeFJ',
        1,
        100,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi9ygQTVSBeFJ',
        2,
        25,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi9ygQTVSBeFJ',
        3,
        1000000,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi9ygQTVSBeFJ',
        4,
        10,
        null
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi9ygQTVSBeFJ',
        5,
        null,
        true
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        'prod_Pxi9ygQTVSBeFJ',
        6,
        null,
        true
    );

INSERT INTO
    pricing_tables (stripe_account_id, name, mode, monthly_enabled)
VALUES
    (
        'acct_1LtR9JLoL33dwtwt',
        'Default',
        1,
        true
    );

INSERT INTO
    pricing_table_products (
        stripe_account_id,
        pricing_table_id,
        stripe_product_id,
        monthly_stripe_price_id
    )
VALUES
    (
        'acct_1LtR9JLoL33dwtwt',
        1,
        'prod_Pxi6eeCojR0HJI',
        'price_1P7mgeLoL33dwtwt4UiVqn8D'
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        1,
        'prod_Pxi8WR5dqxhYmq',
        'price_1P7mi1LoL33dwtwtQhjOjJB7'
    ),
    (
        'acct_1LtR9JLoL33dwtwt',
        1,
        'prod_Pxi9ygQTVSBeFJ',
        'price_1P7mixLoL33dwtwtLJ2zQpdR'
    );