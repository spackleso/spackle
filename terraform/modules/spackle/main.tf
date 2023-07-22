terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

locals {
  regions = concat([var.aws_region], var.storage_replica_regions)
}

provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = var.environment
    }
  }
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environment
    }
  }
}

resource "aws_dynamodb_table" "main" {
  name             = "spackle-${var.environment}"
  hash_key         = "AccountId"
  range_key        = "CustomerId"
  billing_mode     = "PAY_PER_REQUEST"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "AccountId"
    type = "S"
  }

  attribute {
    name = "CustomerId"
    type = "S"
  }

  dynamic "replica" {
    for_each = var.storage_replica_regions
    content {
      region_name = replica.value
    }
  }
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket = "spackle-${var.environment}-cloudtrail"
}

data "aws_iam_policy_document" "cloudtrail" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail.arn]
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail.json
}

resource "aws_cloudtrail" "main" {
  name                       = "spackle-${var.environment}"
  s3_bucket_name             = aws_s3_bucket.cloudtrail.bucket
  is_multi_region_trail      = true
  s3_key_prefix              = ""
  enable_log_file_validation = true

  advanced_event_selector {
    name = "Log events for data table"

    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }

    field_selector {
      field  = "resources.type"
      equals = ["AWS::DynamoDB::Table"]
    }

    field_selector {
      field  = "resources.ARN"
      equals = ["${aws_dynamodb_table.main.arn}"]
    }

    field_selector {
      field      = "eventName"
      not_equals = ["GetRecords", "GetShardIterator"]
    }
  }
}

resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "spackle-${var.environment}"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false
  developer_provider_name          = "cognito-${var.environment}.spackle.so"
}

resource "aws_iam_role" "authenticated" {
  name = "spackle_${var.environment}_client"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "${aws_cognito_identity_pool.main.id}"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "authenticated" {
  name = "spackle_${var.environment}_client"
  role = aws_iam_role.authenticated.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Effect": "Allow",
          "Action": [
              "dynamodb:GetItem",
              "dynamodb:Query"
          ],
          "Resource": ["${aws_dynamodb_table.main.arn}"],
          "Condition": {
              "ForAllValues:StringEquals": {
                  "dynamodb:LeadingKeys": ["$${cognito-identity.amazonaws.com:sub}"]
              }
          }
      }
  ]
}
EOF
}

resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id
  roles = {
    "authenticated" = aws_iam_role.authenticated.arn
  }
}

resource "aws_apprunner_service" "edge_us_west_2" {
  service_name = "spackle-${var.environment}-edge-us-west-2"

  source_configuration {
    authentication_configuration {
      connection_arn = "arn:aws:apprunner:us-west-2:540984895707:connection/github-spackle/5acb4f4cdc594c6d8117cd7422c18b9b"
    }

    code_repository {
      code_configuration {
        code_configuration_values {
          build_command = "cd apps/edge && npm install --dev && npx tsc"
          port          = "3003"
          runtime       = "NODEJS_16"
          start_command = "node apps/edge/dist/index.js"
          runtime_environment_variables = {
            AWS_REGION                    = "us-west-2"
            SUPABASE_JWT_SECRET           = var.supabase_jwt_secret
            DYNAMODB_TABLE_NAME           = aws_dynamodb_table.main.name
            PORT                          = "3003"
            SPACKLE_AWS_ACCESS_KEY_ID     = var.spackle_aws_access_key_id
            SPACKLE_AWS_SECRET_ACCESS_KEY = var.spackle_aws_secret_access_key
          }
        }
        configuration_source = "API"
      }

      repository_url = "https://github.com/spackleso/spackle"

      source_code_version {
        type  = "BRANCH"
        value = "main"
      }
    }
  }
}

resource "aws_apprunner_service" "edge_us_east_1" {
  count        = contains(local.regions, "us-east-1") ? 1 : 0
  provider     = aws.us-east-1
  service_name = "spackle-${var.environment}-edge-us-east-1"

  source_configuration {
    authentication_configuration {
      connection_arn = "arn:aws:apprunner:us-east-1:540984895707:connection/github-spackle/7c9389f6773b44d19154ce3913b1edf4"
    }

    code_repository {
      code_configuration {
        code_configuration_values {
          build_command = "cd apps/edge && npm install --dev && npx tsc"
          port          = "3003"
          runtime       = "NODEJS_16"
          start_command = "node apps/edge/dist/index.js"
          runtime_environment_variables = {
            AWS_REGION                    = "us-east-1"
            SUPABASE_JWT_SECRET           = var.supabase_jwt_secret
            DYNAMODB_TABLE_NAME           = aws_dynamodb_table.main.name
            PORT                          = "3003"
            SPACKLE_AWS_ACCESS_KEY_ID     = var.spackle_aws_access_key_id
            SPACKLE_AWS_SECRET_ACCESS_KEY = var.spackle_aws_secret_access_key
          }
        }
        configuration_source = "API"
      }

      repository_url = "https://github.com/spackleso/spackle"

      source_code_version {
        type  = "BRANCH"
        value = "main"
      }
    }
  }
}
