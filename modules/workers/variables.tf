variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

# variable "zone_id" {
#   type        = string
#   description = "The Cloudflare Zone ID where the routes will be created"
# }

variable "generate_worker_name" {
  type        = string
  description = "Desired name for the 'generate URL' Cloudflare Worker"
  default     = "api-generate-url"
}

variable "poll_worker_name" {
  type        = string
  description = "Desired name for the 'poll result' Cloudflare Worker"
  default     = "api-poll-result"
}

variable "kv_namespace_name" {
  type        = string
  description = "Desired name for the shared KV Namespace for session stickiness"
  default     = "STICKY_SESSIONS_KV" # Conventionally uppercase for bindings
}

# variable "generate_route_pattern" {
#   type        = string
#   description = "The exact route pattern for the generate worker (e.g., yourdomain.com/api/generate-upload-url)"
# }
#
# variable "poll_route_pattern" {
#   type        = string
#   description = "The route pattern for the poll worker (e.g., yourdomain.com/api/poll-result/*)"
# }

variable "aws_api_endpoint" {
  type        = string
  description = "Base URL for the AWS backend API endpoint"
  sensitive   = true
}

