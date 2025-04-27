const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const KV_BINDING_NAME = "STICKY_SESSIONS_KV";

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
    }

    const uploadToken = url.searchParams.get('uploadToken');
    if (!uploadToken) {
      return new Response("Bad Request: Missing 'uploadToken' query parameter", { status: 400, headers: CORS_HEADERS });
    }

    const kvNamespace = env[KV_BINDING_NAME];
     if (!kvNamespace) {
       console.error(`POLL_WORKER_ERROR: KV Namespace binding '${KV_BINDING_NAME}' not found.`);
       return new Response("Service Unavailable: Configuration Error", { status: 503, headers: CORS_HEADERS });
    }

    let chosenBackendUrl;
    try {
      chosenBackendUrl = await kvNamespace.get(uploadToken);
    } catch (e) {
      console.error(`PollWorker: KV GET Error for session ${uploadToken}: ${e}`);
      return new Response("Service Unavailable: Failed to retrieve session", { status: 503, headers: CORS_HEADERS });
    }

    if (!chosenBackendUrl) {
      console.log(`PollWorker: Session ${uploadToken} not found or expired.`);
      return new Response("Not Found: Invalid or expired session ID", { status: 404, headers: CORS_HEADERS });
    }

    console.log(`PollWorker: Session ${uploadToken} found, routing to ${chosenBackendUrl}`);

    // Append the correct path and *forward the original query string*
    const backendRequestUrl = `${chosenBackendUrl}/poll-ascii-art${url.search}`;
    try {
      // Forward the original request object. This includes:
      // - Method (GET)
      // - Headers
      // The URL constructed above handles the path and query params.
      const resp = await fetch(backendRequestUrl, request);
      const headers = new Headers(resp.headers);
      for (const [k, v] of Object.entries(CORS_HEADERS)) {
        headers.set(k, v);
      }
      return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers,
      });
    } catch (e) {
      console.error(`PollWorker: Backend fetch error for ${backendRequestUrl}: ${e}`);
      return new Response("Bad Gateway: Backend request failed", { status: 502, headers: CORS_HEADERS });
    }
  },
};
