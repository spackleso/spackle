terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

resource "aws_apprunner_service" "edge" {
  service_name = "spackle-${var.environment}-edge"

  source_configuration {
    authentication_configuration {
      connection_arn = var.github_connection_arn
    }

    code_repository {
      code_configuration {
        code_configuration_values {
          build_command = "cd apps/edge && npm install --dev && npx tsc"
          port          = "3003"
          runtime       = "NODEJS_16"
          start_command = "node apps/edge/dist/index.js"
          runtime_environment_variables = {
            AWS_REGION                    = var.aws_region
            DYNAMODB_TABLE_NAME           = var.dynamodb_table_name
            PORT                          = "3003"
            ENVIRONMENT                   = var.environment
            SPACKLE_AWS_ACCESS_KEY_ID     = var.spackle_aws_access_key_id
            SPACKLE_AWS_SECRET_ACCESS_KEY = var.spackle_aws_secret_access_key
            SUPABASE_JWT_SECRET           = var.supabase_jwt_secret
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

resource "aws_apprunner_custom_domain_association" "edge" {
  count = var.environment == "prod" ? 1 : 0
  domain_name = "${var.aws_region}.edge.spackle.so"
  service_arn = aws_apprunner_service.edge.arn
}

data "aws_iam_policy_document" "lambda" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_cloudwatch_log_group" "application_edge_logs" {
  name = "/aws/apprunner/spackle-${var.environment}-edge/${aws_apprunner_service.edge.service_id}/application"
}

data "aws_cloudwatch_log_group" "service_edge_logs" {
  name = "/aws/apprunner/spackle-${var.environment}-edge/${aws_apprunner_service.edge.service_id}/service"
}

resource "aws_iam_role" "edge_logs" {
  name               = "spackle-${var.environment}-edge-logs-${var.aws_region}"
  assume_role_policy = data.aws_iam_policy_document.lambda.json
}

resource "aws_iam_role_policy_attachment" "lambda" {
  role       = aws_iam_role.edge_logs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "archive_file" "edge_logs" {
  type        = "zip"
  source_file = "${path.module}/lambda.js"
  output_path = "${path.module}/lambda_function_payload.zip"
}

resource "aws_lambda_function" "edge_logs" {
  filename         = "${path.module}/lambda_function_payload.zip"
  function_name    = "spackle_${var.environment}_edge_logs"
  role             = aws_iam_role.edge_logs.arn
  handler          = "lambda.handler"
  source_code_hash = data.archive_file.edge_logs.output_base64sha256
  runtime          = "nodejs18.x"

  environment {
    variables = {
      BETTERSTACK_LOGS_TOKEN = var.betterstack_logs_token
    }
  }
}

resource "aws_cloudwatch_log_subscription_filter" "edge_application" {
  name            = "spackle-${var.environment}-edge"
  log_group_name  = data.aws_cloudwatch_log_group.application_edge_logs.name
  destination_arn = aws_lambda_function.edge_logs.arn
  filter_pattern  = ""
}

resource "aws_cloudwatch_log_subscription_filter" "edge_service" {
  name            = "spackle-${var.environment}-edge"
  log_group_name  = data.aws_cloudwatch_log_group.service_edge_logs.name
  destination_arn = aws_lambda_function.edge_logs.arn
  filter_pattern  = ""
}

resource "aws_lambda_permission" "application_edge_logs" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.edge_logs.arn
  principal     = "logs.${var.aws_region}.amazonaws.com"
  source_arn    = "${data.aws_cloudwatch_log_group.application_edge_logs.arn}:*"
}

resource "aws_lambda_permission" "service_edge_logs" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.edge_logs.arn
  principal     = "logs.${var.aws_region}.amazonaws.com"
  source_arn    = "${data.aws_cloudwatch_log_group.service_edge_logs.arn}:*"
}
