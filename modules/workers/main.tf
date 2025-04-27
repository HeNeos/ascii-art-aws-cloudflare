resource "cloudflare_workers_kv_namespace" "session_store" {
  account_id = var.account_id
  title      = var.kv_namespace_name
}

resource "cloudflare_workers_script" "generate_url_worker" {
  account_id  = var.account_id
  script_name = var.generate_worker_name
  content     = file("${path.module}/generate_worker.js")
  main_module = "generate_worker.js"

  bindings = [
    {
      name = "AWS_API_ENDPOINT"
      text = var.aws_api_endpoint
      type = "secret_text"
    },
    {
      type         = "kv_namespace"
      name         = cloudflare_workers_kv_namespace.session_store.title
      namespace_id = cloudflare_workers_kv_namespace.session_store.id
    }
  ]
}

resource "cloudflare_workers_route" "generate_route" {
  zone_id     = "api-generate-url"
  pattern     = "api-generate-url/*"
  script = cloudflare_worker_script.generate_url_worker.name
}


resource "cloudflare_workers_script" "poll_result_worker" {
  account_id  = var.account_id
  script_name = var.poll_worker_name
  content     = file("${path.module}/poll_worker.js")
  main_module = "poll_worker.js"

  bindings = [
    {
      name = "AWS_API_ENDPOINT"
      text = var.aws_api_endpoint
      type = "secret_text"
    },
    {
      type         = "kv_namespace"
      name         = cloudflare_workers_kv_namespace.session_store.title
      namespace_id = cloudflare_workers_kv_namespace.session_store.id
    }
  ]
}

resource "cloudflare_workers_route" "poll_route" {
  zone_id     = "api-poll-result"
  pattern     = "api-poll-result/*"
  script = cloudflare_worker_script.poll_result_worker.name
}
