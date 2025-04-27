resource "cloudflare_r2_bucket" "ascii_art_bucket" {
  account_id    = var.account_id
  name          = "ascii-art-storage-${var.account_id}"
  storage_class = "Standard"
}

resource "cloudflare_r2_bucket_lifecycle" "ascii_art_bucket" {
  account_id  = var.account_id
  bucket_name = cloudflare_r2_bucket.ascii_art_bucket.id
  rules = [{
    id = "Expire all objects older than 24 hours"
    conditions = {
      prefix = ""
    }
    enabled = true
    delete_objects_transition = {
      condition = {
        max_age = 86400
        type    = "Age"
      }
    }
  }]
}

# resource "cloudflare_r2_bucket" "ascii_art_bucket_with_cors" {
#   account_id    = var.cloudflare_account_id
#   name          = "ascii-art-storage-${var.cloudflare_account_id}"
#   location_hint = "auto"
#
#   # Example CORS configuration within the bucket resource
#   cors {
#     allowed_origins = ["*"] # Be more specific in production
#     allowed_methods = ["GET"]
#     # allowed_headers = ["*"]
#     # max_age_sec = 3600
#   }
# }
