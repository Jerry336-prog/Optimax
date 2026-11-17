export function validUUID(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
export function validatePaymentIdentity(data, session) {
  if (
    !data || data.reference !== session.reference ||
    !Number.isSafeInteger(Number(data.amount)) || Number(data.amount) <= 0 ||
    Number(data.amount) !== Number(session.amount) ||
    data.currency !== session.currency || data.currency !== "NGN" ||
    data.metadata?.order_id !== session.order_id
  ) throw new Error("The payment details do not match this order.");
}
export function validatePayment(data, session) {
  if (data?.status !== "success")
    throw new Error("This payment has not completed successfully.");
  validatePaymentIdentity(data, session);
  if (!Number.isSafeInteger(Number(data.id)) || Number(data.id) <= 0)
    throw new Error("Invalid provider transaction identifier.");
  return {
    reference: data.reference,
    providerId: Number(data.id),
    amount: Number(data.amount),
    currency: data.currency,
  };
}
export async function validSignature(raw, signature, secret) {
  if (!signature || !/^[0-9a-f]{128}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["verify"],
  );
  const bytes = Uint8Array.from(signature.match(/../g), (hex) =>
    parseInt(hex, 16),
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    bytes,
    new TextEncoder().encode(raw),
  );
}
