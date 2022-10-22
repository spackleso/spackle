alter table
    features
add
    constraint key_min_length check (length(key) > 0);

alter table
    features
add
    constraint name_min_length check (length(name) > 0);

alter table
    features
add
    constraint one_value check (num_nonnulls(value_flag, value_limit) = 1);

alter table
    customer_features
add
    constraint one_value check (num_nonnulls(value_flag, value_limit) = 1);

alter table
    product_features
add
    constraint one_value check (num_nonnulls(value_flag, value_limit) = 1);

alter table
    price_features
add
    constraint one_value check (num_nonnulls(value_flag, value_limit) = 1);