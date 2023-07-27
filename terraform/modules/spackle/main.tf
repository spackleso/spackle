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


module "edge-us-west-2" {
  source = "./modules/edge"

  aws_region                    = "us-west-2"
  betterstack_logs_token        = var.betterstack_logs_token
  dynamodb_table_name           = aws_dynamodb_table.main.name
  environment                   = var.environment
  github_connection_arn         = "arn:aws:apprunner:us-west-2:540984895707:connection/github-spackle/5acb4f4cdc594c6d8117cd7422c18b9b"
  spackle_aws_access_key_id     = var.spackle_aws_access_key_id
  spackle_aws_secret_access_key = var.spackle_aws_secret_access_key
  supabase_jwt_secret           = var.supabase_jwt_secret
}

module "edge-us-east-1" {
  source = "./modules/edge"
  count  = contains(local.regions, "us-east-1") ? 1 : 0
  providers = {
    aws = aws.us-east-1
  }

  aws_region                    = "us-east-1"
  betterstack_logs_token        = var.betterstack_logs_token
  dynamodb_table_name           = aws_dynamodb_table.main.name
  environment                   = var.environment
  github_connection_arn         = "arn:aws:apprunner:us-east-1:540984895707:connection/github-spackle/7c9389f6773b44d19154ce3913b1edf4"
  spackle_aws_access_key_id     = var.spackle_aws_access_key_id
  spackle_aws_secret_access_key = var.spackle_aws_secret_access_key
  supabase_jwt_secret           = var.supabase_jwt_secret
}
