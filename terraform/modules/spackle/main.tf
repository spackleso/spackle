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
  name         = "spackle-${var.environment}"
  hash_key     = "AccountId"
  range_key    = "CustomerId"
  billing_mode = "PAY_PER_REQUEST"

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
