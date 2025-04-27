const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const BACKEND_SECRET_NAMES = [
  "AWS_API_ENDPOINT",
  // "GCP_API_ENDPOINT",
];

const KV_BINDING_NAME = "STICKY_SESSIONS_KV";
const SESSION_TTL_SECONDS = 1200; // 10 min

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS"){
        return new Response(null, {status: 204, headers: CORS_HEADERS});
    }
    const url = new URL(request.url);

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
    }

    const uploadToken = url.searchParams.get('uploadToken');
    if (!uploadToken) {
      return new Response("Bad Request: Missing 'uploadToken' query parameter", { status: 400, headers: CORS_HEADERS });
    }

    const availableBackends = BACKEND_SECRET_NAMES.map((name) => env[name])
      .filter((url) => url);

    if (availableBackends.length === 0) {
      console.error("GENERATE_WORKER_ERROR: No backend API endpoints configured.");
      return new Response("Service Unavailable: Configuration Error", { status: 503, headers: CORS_HEADERS });
    }

    const kvNamespace = env[KV_BINDING_NAME];
     if (!kvNamespace) {
       console.error(`GENERATE_WORKER_ERROR: KV Namespace binding '${KV_BINDING_NAME}' not found.`);
       return new Response("Service Unavailable: Configuration Error", { status: 503, headers: CORS_HEADERS });
    }

    // Randomly select a provider
    const chosenBackendUrl =
      availableBackends[Math.floor(Math.random() * availableBackends.length)];

    try {
      // Use the client-provided uploadToken as the key
      await kvNamespace.put(uploadToken, chosenBackendUrl, {
        expirationTtl: SESSION_TTL_SECONDS,
      });
      console.log(`GenerateWorker: Session ${uploadToken} created, routing to ${chosenBackendUrl}`);
    } catch (e) {
      console.error(`GenerateWorker: KV PUT Error for session ${uploadToken}: ${e}`);
      return new Response("Service Unavailable: Failed to save session", { status: 503, headers: CORS_HEADERS });
    }

    // Append the correct path and *forward the original query string*
    const backendRequestUrl = `${chosenBackendUrl}/generate-upload-url${url.search}`;
    try {
      // Forward the original request object. This includes:
      // - Method (POST)
      // - Headers
      // - Body (JSON payload from client)
      // The URL constructed above handles the path and query params.
      const backendResponse = await fetch(backendRequestUrl, request);
      const headers = new Headers(backendResponse.headers)
      for (const [k, v] of Object.entries(CORS_HEADERS)) {
        headers.set(k, v)
      }
      return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers
      });
    } catch (e) {
      console.error(`GenerateWorker: Backend fetch error for ${backendRequestUrl}: ${e}`);
      return new Response("Bad Gateway: Backend request failed", { status: 502, headers: CORS_HEADERS });
    }
  },
};
