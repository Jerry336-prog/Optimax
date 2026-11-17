import { requireBackend } from "../lib/supabase";
export async function paymentFunction(name, body) {
  const { data, error } = await requireBackend().functions.invoke(name, {
    body,
  });
  if (error) {
    if (error.context?.json) {
      try {
        const result = await error.context.json();
        throw new Error(result.error || "Payment service unavailable.");
      } catch (cause) {
        if (cause instanceof SyntaxError)
          throw new Error(
            "The payment service could not be reached. Please try again.",
          );
        throw cause;
      }
    }
    throw new Error(
      "The payment service is not available yet. Contact the store before paying.",
    );
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
