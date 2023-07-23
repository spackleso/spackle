terraform {
  backend "s3" {
    bucket  = "spackle-terraform"
    key     = "local.tfstate"
    region  = "us-west-2"
    encrypt = true
  }
}

module "spackle" {
  source                        = "../../modules/spackle"
  aws_region                    = "us-west-2"
  betterstack_logs_token        = var.betterstack_logs_token
  environment                   = "local"
  spackle_aws_access_key_id     = var.spackle_aws_access_key_id
  spackle_aws_secret_access_key = var.spackle_aws_secret_access_key
  supabase_jwt_secret           = var.supabase_jwt_secret
}
