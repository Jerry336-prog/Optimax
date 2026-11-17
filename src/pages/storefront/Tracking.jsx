import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
export default function Tracking() {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  function submit(event) {
    event.preventDefault();
    const id = new FormData(event.currentTarget).get("order").trim();
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      setMessage("Enter the full order ID from My Orders.");
      return;
    }
    navigate(`/account/orders/${id}`);
  }
  return (
    <section className="container page info-page">
      <p className="eyebrow">FROM OUR STORE TO YOUR DOOR</p>
      <h1>Follow your delivery.</h1>
      <p className="page-intro">
        Enter your full order reference to view its latest status. You can only
        access orders placed from your account.
      </p>
      <form className="panel admin-form" onSubmit={submit}>
        <label>
          Order reference
          <input name="order" required placeholder="Paste your full order ID" />
        </label>
        <button className="button primary">Track order</button>
        <p role="alert">{message}</p>
        <Link className="text-link" to="/account/orders">
          Find your orders ↗
        </Link>
      </form>
    </section>
  );
}
