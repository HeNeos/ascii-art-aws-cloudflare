const KV_BINDING_NAME = "STICKY_SESSIONS_KV";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const uploadToken = url.searchParams.get('uploadToken');
    if (!uploadToken) {
      return new Response("Bad Request: Missing 'uploadToken' query parameter", { status: 400 });
    }

    const kvNamespace = env[KV_BINDING_NAME];
     if (!kvNamespace) {
       console.error(`POLL_WORKER_ERROR: KV Namespace binding '${KV_BINDING_NAME}' not found.`);
       return new Response("Service Unavailable: Configuration Error", { status: 503 });
    }

    let chosenBackendUrl;
    try {
      chosenBackendUrl = await kvNamespace.get(uploadToken);
    } catch (e) {
      console.error(`PollWorker: KV GET Error for session ${uploadToken}: ${e}`);
      return new Response("Service Unavailable: Failed to retrieve session", { status: 503 });
    }

    if (!chosenBackendUrl) {
      console.log(`PollWorker: Session ${uploadToken} not found or expired.`);
      return new Response("Not Found: Invalid or expired session ID", { status: 404 });
    }

    console.log(`PollWorker: Session ${uploadToken} found, routing to ${chosenBackendUrl}`);

    // Append the correct path and *forward the original query string*
    const backendRequestUrl = `${chosenBackendUrl}/poll-ascii-art${url.search}`;

    try {
      // Forward the original request object. This includes:
      // - Method (GET)
      // - Headers
      // The URL constructed above handles the path and query params.
      return await fetch(backendRequestUrl, request);
    } catch (e) {
      console.error(`PollWorker: Backend fetch error for ${backendRequestUrl}: ${e}`);
      return new Response("Bad Gateway: Backend request failed", { status: 502 });
    }
  },
};
