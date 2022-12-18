terraform {
  backend "s3" {
    bucket  = "spackle-terraform"
    key     = "prod.tfstate"
    region  = "us-west-2"
    encrypt = true
  }
}

module "spackle" {
  source      = "../../modules/spackle"
  aws_region  = "us-west-2"
  environment = "prod"
}
