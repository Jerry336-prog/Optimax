import { validatePayment, validatePaymentIdentity } from "./validation.js";
export async function reconcilePayment(transaction, session, complete, fail) {
  // Failed and pending responses must match the order just as paid responses do.
  validatePaymentIdentity(transaction, session);
  if (transaction.status === "failed") {
    await fail(session.reference);
    return { order_id: session.order_id, status: "failed" };
  }
  if (transaction.status !== "success")
    return { order_id: session.order_id, status: "pending" };
  const payment = validatePayment(transaction, session);
  const order = await complete(payment);
  return { order_id: order, status: "paid" };
}
