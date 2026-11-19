import { initializePayment } from "../_shared/initialization.js";
import {
  server,
  secret,
  headers,
  response,
  userFor,
  paystack,
} from "../_shared/backend.js";
import { validUUID } from "../_shared/validation.js";
Deno.serve(async (request) => {
  let cors = {};
  try {
    cors = headers(request);
    if (request.method === "OPTIONS")
      return new Response(null, { headers: cors });
    if (request.method !== "POST")
      return response({ error: "Method not allowed." }, 405, cors);
    secret();
    const client = server();
    const user = await userFor(client, request);
    const { order_id } = await request.json();
    if (!validUUID(order_id))
      return response({ error: "Invalid order reference." }, 400, cors);
    const payment = await initializePayment(client, user, order_id, cors["Access-Control-Allow-Origin"], paystack);
    return response(payment, 200, cors);
  } catch (error) {
    console.error("Payment initialization failed:", error.message);
    return response(
      { error: error.message || "Payment initialization failed." },
      400,
      cors,
    );
  }
});
