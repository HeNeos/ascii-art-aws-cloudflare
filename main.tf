terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.1.0"
    }
  }
  backend "s3" {}
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

module "storage" {
  source     = "./modules/storage"
  account_id = var.cloudflare_account_id
}

module "workers" {
  source           = "./modules/workers"
  account_id       = var.cloudflare_account_id
  aws_api_endpoint = var.aws_api_endpoint
}
