export function paymentOrigin(requestOrigin, defaultOrigin, additionalOrigins = "") {
  if (!defaultOrigin) throw new Error("The store callback origin is not configured.");
  const origins = [defaultOrigin, ...additionalOrigins.split(",").map(value => value.trim()).filter(Boolean)];
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || !["https:", "http:"].includes(parsed.protocol))
      throw new Error("The store payment origin is invalid.");
  }
  if (requestOrigin && !origins.includes(requestOrigin)) throw new Error("Origin not allowed.");
  return requestOrigin || defaultOrigin;
}

export function paymentCors(origin) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
