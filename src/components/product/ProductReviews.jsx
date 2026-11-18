import { ArrowUpRight } from "lucide-react";
import Skeleton from "../ui/Skeleton";
import { useState } from "react";
import { Link } from "react-router-dom";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
import { useSession } from "../../store/session";
import { useQuery } from "../../hooks/useQuery";
async function reviewQuery(id) {
  return resultOf(
    await requireBackend()
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false }),
  );
}
export default function ProductReviews({ productId }) {
  const user = useSession((s) => s.user);
  const query = useQuery(reviewQuery, productId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const f = new FormData(event.currentTarget);
    try {
      resultOf(
        await requireBackend()
          .from("reviews")
          .insert({
            user_id: user.id,
            product_id: productId,
            rating: Number(f.get("rating")),
            body: f.get("body").trim(),
          }),
      );
      setMessage("Thank you. Your review has been submitted for moderation.");
      query.refresh();
    } catch (error) {
      setMessage(
        error.code === "42501"
          ? "You can review this product after a delivered purchase."
          : error.code === "23505"
            ? "You have already reviewed this product."
            : backendError(error),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="reviews-section">
      <p className="eyebrow">FROM THE PEOPLE WHO USE IT</p>
      <h2>Product reviews.</h2>
      {query.loading ? (
        <Skeleton variant="reviews" count={2} label="Loading reviews…" />
      ) : query.error ? (
        <p role="alert">{query.error}</p>
      ) : query.data.length ? (
        query.data.map((review) => (
          <article className="panel" key={review.id}>
            <strong>
              {review.rating}/5 {review.approved ? "" : "· Awaiting moderation"}
            </strong>
            <p>{review.body}</p>
            <small>{new Date(review.created_at).toLocaleDateString()}</small>
          </article>
        ))
      ) : (
        <p>
          No reviews yet. Be the first to share your experience after a
          delivered purchase.
        </p>
      )}
      {user ? (
        <form className="panel admin-form account-form" onSubmit={submit}>
          <h3>Share your experience</h3>
          <label>
            Rating
            <select name="rating">
              {[5, 4, 3, 2, 1].map((n) => (
                <option value={n} key={n}>
                  {n} out of 5
                </option>
              ))}
            </select>
          </label>
          <label>
            Your review
            <textarea
              name="body"
              required
              minLength={10}
              maxLength={2000}
              rows={4}
            />
          </label>
          <button className="button secondary" disabled={busy}>
            Submit review
          </button>
          <p role="status">{message}</p>
        </form>
      ) : (
        <Link className="text-link" to="/login">
          Sign in to review a delivered purchase <ArrowUpRight size={16} aria-hidden="true" className="inline-icon" />
        </Link>
      )}
    </section>
  );
}
