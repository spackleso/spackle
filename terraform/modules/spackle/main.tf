terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
    }
  }
}

resource "aws_dynamodb_table" "main" {
  name           = "spackle-${var.environment}"
  hash_key       = "AccountId"
  range_key      = "CustomerId"
  billing_mode   = "PAY_PER_REQUEST"
  stream_enabled = true
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
  name = "spackle-${var.environment}"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket
  is_multi_region_trail = true
  s3_key_prefix = ""
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
      field = "resources.ARN"
      equals = ["${aws_dynamodb_table.main.arn}"]
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
