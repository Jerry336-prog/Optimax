import { server, secret, response, settle } from "../_shared/backend.js";
import { validSignature } from "../_shared/validation.js";
Deno.serve(async (request) => {
  if (request.method !== "POST")
    return response({ error: "Method not allowed." }, 405);
  try {
    const raw = await request.text();
    if (raw.length > 100000)
      return response({ error: "Payload too large." }, 413);
    if (
      !(await validSignature(
        raw,
        request.headers.get("x-paystack-signature"),
        secret(),
      ))
    )
      return response({ error: "Invalid signature." }, 401);
    const event = JSON.parse(raw);
    if (event.event !== "charge.success") return response({ received: true });
    const reference = event.data?.reference;
    if (
      typeof reference !== "string" ||
      !/^optimax_[a-f0-9]{32}$/.test(reference)
    )
      return response({ received: true });
    const client = server();
    const { data, error } = await client
      .from("payment_sessions")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();
    if (error) throw error;
    if (!data) return response({ received: true });
    await settle(client, reference);
    return response({ received: true });
  } catch (error) {
    console.error("Paystack webhook reconciliation failed:", error.message);
    return response(
      { error: "Payment reconciliation temporarily unavailable." },
      500,
    );
  }
});
