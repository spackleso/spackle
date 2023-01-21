alter table
    features drop constraint one_value;

alter table
    customer_features drop constraint one_value;

alter table
    product_features drop constraint one_value;

alter table
    price_features drop constraint one_value;

alter table
    features
add
    constraint one_value check (
        (
            type = 0
            and value_flag is not null
            and value_limit is null
        )
        or (
            type = 1
            and (
                value_limit is not null
                or value_flag is null
            )
            and value_flag is null
        )
    );

alter table
    customer_features
add
    constraint one_value check (
        (
            value_flag is not null
            and value_limit is null
        )
        or (
            (
                value_limit is not null
                or value_flag is null
            )
            and value_flag is null
        )
    );

alter table
    product_features
add
    constraint one_value check (
        (
            value_flag is not null
            and value_limit is null
        )
        or (
            (
                value_limit is not null
                or value_flag is null
            )
            and value_flag is null
        )
    );

alter table
    price_features
add
    constraint one_value check (
        (
            value_flag is not null
            and value_limit is null
        )
        or (
            (
                value_limit is not null
                or value_flag is null
            )
            and value_flag is null
        )
    );