import { reconcilePayment } from "./reconciliation.js";
import { createClient } from "npm:@supabase/supabase-js@2.119.0";
export function server() {
  const url = Deno.env.get("SUPABASE_URL");
  const key =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SB_SECRET_KEY");
  if (!url || !key) throw new Error("Server configuration is incomplete.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function secret() {
  const value = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!value)
    throw new Error(
      "Online payments are not configured yet. Please contact Optimax.",
    );
  return value;
}
export function headers(request) {
  const origin = Deno.env.get("APP_ORIGIN");
  if (!origin) throw new Error("The store callback origin is not configured.");
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(origin).origin
  )
    throw new Error("Origin not allowed.");
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": new URL(origin).origin,
    "Access-Control-Allow-Headers":
      "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
export function response(value, status = 200, cors = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
export async function userFor(client, request) {
  const token = request.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Please sign in to continue.");
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Please sign in again.");
  return data.user;
}
export async function paystack(path, options = {}) {
  const r = await fetch(`https://api.paystack.co${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  const body = await r.json();
  if (!r.ok || !body.status)
    throw new Error(
      "Paystack could not complete the request. Please retry or contact the store.",
    );
  return body.data;
}
export function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function settle(client, reference) {
  const session = checked(
    await client
      .from("payment_sessions")
      .select("*")
      .eq("reference", reference)
      .single(),
  );
  if (session.status === "success") return { order_id: session.order_id, status: "paid" };
  const transaction = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  return reconcilePayment(transaction, session,
    async payment => checked(await client.rpc("complete_payment", {
      p_reference: payment.reference,
      p_provider_id: payment.providerId,
      p_amount: payment.amount,
      p_currency: payment.currency,
    })),
    async paymentReference => checked(await client.rpc("fail_payment", { p_reference: paymentReference })),
  );
}
