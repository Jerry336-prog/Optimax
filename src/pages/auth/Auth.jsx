import { ArrowUpRight } from "lucide-react";
import ProfilePhotoPicker from "../../components/account/ProfilePhotoPicker";
import { queueSignupPhoto, clearSignupPhoto } from "../../services/pendingPhoto";
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { validateAuth, authError, authDestination } from "../../lib/auth";
import { requireBackend } from "../../lib/supabase";
import { useSession } from "../../store/session";
export default function Auth() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const session = useSession();
  const mode = pathname.includes("register")
    ? "register"
    : pathname.includes("forgot")
      ? "forgot"
      : pathname.includes("reset") || session.recovery
        ? "reset"
        : "login";
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const current = feedback?.mode === mode ? feedback : null;
  const errors = current?.fields || {};
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(event.currentTarget);
    const email = fields.get("email")?.trim();
    const password = fields.get("password");
    const values = { ...Object.fromEntries(fields), email };
    const invalid = validateAuth(mode, values);
    if (Object.keys(invalid).length) {
      setFeedback({ mode, type: "error", text: "Please check the highlighted fields.", fields: invalid });
      form.elements.namedItem(Object.keys(invalid)[0])?.focus();
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const client = requireBackend();
      let result;
      if (mode === "register") {
        // Store locally before signUp, since a session may arrive immediately.
        if (photo) await queueSignupPhoto(email, photo);
        else await clearSignupPhoto(email).catch(() => {});
        result = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fields.get("name").trim() },
            emailRedirectTo: `${location.origin}/`,
          },
        });
      } else if (mode === "forgot")
        result = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/reset-password`,
        });
      else if (mode === "reset") {
        if (password !== fields.get("confirm"))
          throw new Error("The passwords do not match.");
        result = await client.auth.updateUser({ password });
      } else result = await client.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === "forgot")
        setFeedback({ mode, type: "success", text: "If this email has an account, a password reset link is on its way." });
      else {
        useSession.setState({ recovery: false });
        const destination = authDestination(mode, result.data, params.get("next"));
        if (mode === "register" && photo && !result.data.session)
          destination.notice += " Your photo will upload when you confirm or sign in on this device.";
        navigate(destination.path, { replace: true, state: { authNotice: destination.notice } });
      }
    } catch (error) {
      if (mode === "register") await clearSignupPhoto(email).catch(() => {});
      setFeedback({ mode, type: "error", text: authError(error) });
    } finally {
      setBusy(false);
    }
  }
  const title = {
    login: "Welcome back.",
    register: "Make yourself at home.",
    forgot: "Let’s get you back in.",
    reset: "A fresh start.",
  }[mode];
  return (
    <section className="container page auth-page">
      <div className="panel">
        <p className="eyebrow">WELCOME TO OPTIMAX</p>
        <h1>{title}</h1>
        <p>
          {mode === "forgot"
            ? "Enter your account email to request a reset link."
            : mode === "reset"
              ? "Choose a new password for your account."
              : "Your next upgrade is waiting."}
        </p>
        {current && <div className={`auth-feedback ${current.type}`} role={current.type === "error" ? "alert" : "status"}>{current.text}</div>}
        <form onSubmit={submit} key={mode} noValidate aria-busy={busy}>
          {mode === "register" && <><ProfilePhotoPicker file={photo} onChange={setPhoto} onRemove={() => setPhoto(null)} busy={busy} /><small>If email confirmation is required, finish on this device to save your selected photo.</small></>}
          {mode === "register" && (
            <label>
              Full name
              <input name="name" required autoComplete="name" maxLength={100} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
              {errors.name && <span className="auth-field-error" id="name-error">{errors.name}</span>}
            </label>
          )}
          {mode !== "reset" && (
            <label>
              Email address
              <input type="email" name="email" required autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
              {errors.email && <span className="auth-field-error" id="email-error">{errors.email}</span>}
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Password
              <input
                type="password"
                name="password"
                required
                minLength={mode === "login" ? undefined : 8}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
              {errors.password && <span className="auth-field-error" id="password-error">{errors.password}</span>}
            </label>
          )}
          {mode === "reset" && (
            <label>
              Confirm password
              <input
                type="password"
                name="confirm"
                aria-invalid={!!errors.confirm}
                aria-describedby={errors.confirm ? "confirm-error" : undefined}
                required
                minLength={8}
                autoComplete="new-password"
              />
              {errors.confirm && <span className="auth-field-error" id="confirm-error">{errors.confirm}</span>}
            </label>
          )}
          <button className="button primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : {
                  login: "Sign in",
                  register: "Create account",
                  forgot: "Send reset link",
                  reset: "Update password",
                }[mode]}
          </button>
        </form>
        <Link
          className="text-link"
          to={mode === "login" ? `/register?${params}` : `/login?${params}`}
        >
          {mode === "login" ? "New here? Create an account" : "Back to sign in"}{" "}
          <ArrowUpRight size={16} aria-hidden="true" className="inline-icon" />
        </Link>
        {mode === "login" && (
          <Link className="text-link" to="/forgot-password">
            Forgot your password?
          </Link>
        )}
        <Link className="text-link" to="/shop">
          Continue browsing
        </Link>
      </div>
    </section>
  );
}
