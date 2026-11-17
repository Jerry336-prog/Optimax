import { Link } from "react-router-dom";
import { useSession } from "../../store/session";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
import { useState } from "react";
import { Mail, Phone, MapPin, ArrowUpRight, Check } from "lucide-react";
import { useBusiness } from "../../hooks/useBusiness";
import VisitStore from "../../components/ui/VisitStore";
import ShoppingFAQ from "../../components/ui/ShoppingFAQ";
export default function Contact() {
  const business = useBusiness((s) => s.business);
  const user = useSession((s) => s.user);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  async function prepare(event) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setFeedback(null);
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      resultOf(
        await requireBackend()
          .from("enquiries")
          .insert({
            user_id: user.id,
            name: fields.get("name").trim(),
            email: fields.get("email").trim(),
            topic: fields.get("topic"),
            message: fields.get("message").trim(),
          }),
      );
      setFeedback({
        success: true,
        message:
          "Your enquiry has been received. The Optimax team can view it in their inbox.",
      });
      form.reset();
    } catch (error) {
      setFeedback({ success: false, message: backendError(error) });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="container brand-hero contact-hero">
        <div>
          <p className="eyebrow">A REAL CONVERSATION STARTS HERE</p>
          <h1>
            A question? An idea?
            <br />
            <span>Let’s talk about it.</span>
          </h1>
        </div>
        <p className="brand-lead">
          Choosing your next upgrade, checking a product detail, or following up
          on an order? You are in the right place.
        </p>
      </section>
      <section className="container contact-options">
        <article>
          <Mail />
          <p className="eyebrow">DROP US A LINE</p>
          <h2>{business.email}</h2>
          <p>Product questions, order enquiries, and everything in between.</p>
          <a className="text-link" href={`mailto:${business.email}`}>
            Open your email app <ArrowUpRight size={15} />
          </a>
        </article>
        <article>
          <Phone />
          <p className="eyebrow">LET’S TALK IT THROUGH</p>
          <h2>{business.phone}</h2>
          <p>For a little help finding the right fit for your space.</p>
          <span className="sample-note">Sample phone number</span>
        </article>
        <article>
          <MapPin />
          <p className="eyebrow">MAKE IT A PERSONAL VISIT</p>
          <h2>Find us in Lagos.</h2>
          <p>
            {business.address}
            <br />
            {business.area}
          </p>
          <a className="text-link" href="#visit">
            View shop details <ArrowUpRight size={15} />
          </a>
        </article>
      </section>
      <section id="message" className="container message-section">
        <div className="message-intro">
          <p className="eyebrow">START WITH A HELLO</p>
          <h2>
            What can we
            <br />
            help you with?
          </h2>
          <p>
            A little context goes a long way. Tell us about your space, the
            product you have in mind, or your order question.
          </p>
          <div className="contact-note">
            <Mail size={20} />
            <p>
              Send your enquiry directly to the Optimax team. Sign in so your
              message can be linked to your account.
            </p>
          </div>
          <p className="sample-note">
            {business.note} Email uses the reserved example.com domain.
          </p>
        </div>
        <form
          className="message-form"
          onSubmit={prepare}
          onChange={() => setFeedback(null)}
        >
          <div className="form-pair">
            <label>
              Your name
              <input
                name="name"
                placeholder="e.g. Alex Johnson"
                autoComplete="name"
                required
                maxLength={100}
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
          </div>
          <label>
            What is it about?
            <select name="topic">
              <option>Help choosing a product</option>
              <option>Product specifications & compatibility</option>
              <option>Delivery & order enquiry</option>
              <option>Something else</option>
            </select>
          </label>
          <label>
            Your message
            <textarea
              name="message"
              rows={6}
              placeholder="Tell us a little about what you need…"
              required
              minLength={10}
              maxLength={2000}
            />
          </label>
          <div className="form-bottom">
            <span>
              Your enquiry is stored securely for the Optimax team to review.
            </span>
            {user ? (
              <button className="button primary" disabled={busy}>
                {busy ? "Sending…" : "Send enquiry"} <ArrowUpRight size={17} />
              </button>
            ) : (
              <Link className="button primary" to="/login?next=/contact">
                Sign in to send <ArrowUpRight size={17} />
              </Link>
            )}
          </div>
          {feedback && (
            <div className="draft-ready" role="status">
              {feedback.success && <Check size={20} />}
              <p>{feedback.message}</p>
            </div>
          )}
        </form>
      </section>
      <div id="visit" className="visit-anchor">
        <VisitStore contactPage />
      </div>
      <ShoppingFAQ />
    </>
  );
}
