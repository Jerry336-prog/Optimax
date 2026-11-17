import Skeleton from "./Skeleton";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../../store/session";
export default function RequireAuth({ children, admin = false }) {
  const { user, profile, loading, error } = useSession();
  const location = useLocation();
  if (loading)
    return (
      <section className="container page">
        <Skeleton
          variant={admin ? "admin" : "profile"}
          label="Loading your account…"
        />
      </section>
    );
  if (!user)
    return (
      <section className="container page empty-state">
        <h1>Make yourself at home.</h1>
        <p>
          Sign in to continue to {admin ? "store management" : "your account"}.
        </p>
        <Link
          className="button primary"
          to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        >
          Sign in
        </Link>
      </section>
    );
  if (admin && profile?.role !== "admin")
    return (
      <section className="container page empty-state">
        <h1>Store management</h1>
        <p>{error || "Administrator access is required."}</p>
        <Link to="/account" className="button secondary">
          Your account
        </Link>
      </section>
    );
  return children;
}
