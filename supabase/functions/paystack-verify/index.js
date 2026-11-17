import {
  server,
  secret,
  headers,
  response,
  userFor,
  checked,
  settle,
} from "../_shared/backend.js";
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
    const { reference } = await request.json();
    if (
      typeof reference !== "string" ||
      !/^optimax_[a-f0-9]{32}$/.test(reference)
    )
      return response({ error: "Invalid payment reference." }, 400, cors);
    const payment = checked(
      await client
        .from("payment_sessions")
        .select("order_id")
        .eq("reference", reference)
        .single(),
    );
    checked(
      await client
        .from("orders")
        .select("id")
        .eq("id", payment.order_id)
        .eq("user_id", user.id)
        .single(),
    );
    return response(await settle(client, reference), 200, cors);
  } catch (error) {
    console.error("Payment verification failed:", error.message);
    return response(
      {
        error: error.message || "Payment could not be verified. Please retry.",
      },
      400,
      cors,
    );
  }
});
