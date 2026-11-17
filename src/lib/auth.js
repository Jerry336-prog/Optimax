export function validateAuth(mode, values) {
  const errors = {};
  if (mode === "register" && !values.name?.trim())
    errors.name = "Enter your full name.";
  if (mode !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email || ""))
    errors.email = "Enter a valid email address, such as you@example.com.";
  if (mode !== "forgot") {
    if (!values.password) errors.password = "Enter your password.";
    else if (mode !== "login" && values.password.length < 8)
      errors.password = "Use at least 8 characters for your password.";
  }
  if (mode === "reset" && values.password !== values.confirm)
    errors.confirm = "The passwords do not match.";
  return errors;
}

export function authError(error) {
  const messages = {
    invalid_credentials: "The email or password is incorrect. Check both and try again.",
    email_not_confirmed: "Confirm your email using the link in your inbox before signing in.",
    user_already_exists: "An account with this email already exists. Please sign in or reset your password.",
    email_exists: "An account with this email already exists. Please sign in or reset your password.",
    email_address_invalid: "Enter a valid email address.",
    weak_password: "This password is too weak. Choose a longer, stronger password.",
    signup_disabled: "Account registration is temporarily unavailable. Please contact the team.",
    over_email_send_rate_limit: "Too many emails were requested. Please wait a few minutes and try again.",
    over_request_rate_limit: "Too many attempts. Please wait a few minutes and try again.",
    same_password: "Choose a password different from your current password.",
  };
  if (messages[error?.code]) return messages[error.code];
  if (/invalid login credentials/i.test(error?.message || "")) return messages.invalid_credentials;
  if (/fetch|network|timeout|aborted/i.test(error?.message || ""))
    return "We couldn’t connect. Check your internet connection and try again.";
  return error?.message || "Something went wrong. Please try again.";
}

export function authDestination(mode, data, next) {
  if (mode === "register") return {
    path: "/",
    notice: data.session
      ? "Your account is ready. Welcome to Optimax!"
      : "Check your inbox for a confirmation link before signing in. If you already have an account, sign in or reset your password.",
  };
  // Only allow same-origin paths. Reject backslashes and encoded redirects too.
  const safeNext = typeof next === "string" && /^\/(?!\/)/.test(next) && !next.includes("\\") && [...next].every(char => char.charCodeAt(0) > 32) && !/%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|20)/i.test(next);
  return { path: safeNext ? next : "/", notice: mode === "reset" ? "Your password has been updated." : "You’re signed in. Welcome back!" };
}
