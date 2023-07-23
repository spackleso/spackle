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
            AWS_COGNITO_IDENTITY_POOL_ID  = var.aws_cognito_identity_pool_id
            AWS_COGNITO_IDENTITY_PROVIDER = var.aws_cognito_identity_provider
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
  domain_name = "${var.aws_region}.edge.spackle.so"
  service_arn = aws_apprunner_service.edge.arn
}
