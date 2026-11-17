import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        global: {
          fetch: (input, options = {}) =>
            fetch(input, {
              ...options,
              signal: options.signal
                ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)])
                : AbortSignal.timeout(20000),
            }),
        },
      })
    : null;
export const configurationMessage =
  "The store connection is not configured. Please contact Optimax.";
export function backendError(error) {
  if (
    error?.code === "PGRST205" ||
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    error?.code === "PGRST202" ||
    error?.code === "42P01"
  )
    return "The store database needs its latest setup migration. Please contact the store administrator.";
  if (error?.code === "42501")
    return "You do not have permission to perform this action.";
  if (error?.message?.includes("fetch"))
    return "We couldn’t reach the store. Check your connection and try again.";
  return error?.message || "Something went wrong. Please try again.";
}
export function requireBackend() {
  if (!supabase) throw new Error(configurationMessage);
  return supabase;
}
export function resultOf(result) {
  if (result.error) throw result.error;
  return result.data;
}
