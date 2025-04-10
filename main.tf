terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  skip_credentials_validation = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
  endpoints {
    s3 = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
  }
  access_key = var.r2_access_key_id
  secret_key = var.r2_secret_access_key
  region     = "auto"
}

resource "aws_s3_bucket" "ascii_art_bucket" {
  bucket = "ascii-art-storage-${var.cloudflare_account_id}"
}

resource "aws_s3_bucket_lifecycle_configuration" "auto_delete" {
  bucket = aws_s3_bucket.ascii_art_bucket.id

  rule {
    id = "auto-delete-after-1-day"
    
    expiration {
      days = 1
    }

    status = "Enabled"
  }
}

# resource "aws_s3_bucket_cors_configuration" "default" {
#   bucket   = aws_s3_bucket.default.id

#   cors_rule {
#     allowed_methods = ["GET"]
#     allowed_origins = ["*"]
#   }
# }

