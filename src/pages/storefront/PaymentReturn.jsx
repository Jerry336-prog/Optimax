import { PageSkeleton } from "../../components/ui/Skeleton";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { paymentFunction } from "../../services/payments";
import { backendError } from "../../lib/supabase";
export default function PaymentReturn() {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref");
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    if (!reference) {
      setState({
        error:
          "No payment reference was returned. Check My Orders before attempting another payment.",
      });
      return;
    }
    paymentFunction("paystack-verify", { reference })
      .then((data) => {
        if (active) setState({ data });
      })
      .catch((error) => {
        if (active) setState({ error: backendError(error) });
      });
    return () => {
      active = false;
    };
  }, [reference, attempt]);
  if (state.loading) return <PageSkeleton variant="order" />;
  return (
    <section className="container page empty-state">
      <h1>
        {state.loading
          ? "Verifying payment…"
          : state.data?.status === "paid"
            ? "Payment confirmed."
            : state.data?.status === "pending" ? "Payment is still pending." : "Check your payment."}
      </h1>
      <p>
        {state.loading
          ? "Please wait while we check the transaction directly with Paystack."
          : state.error ||
            (state.data?.status === "paid"
              ? "Your payment has been verified and recorded against your order."
              : state.data?.status === "pending"
                ? "Your payment has not been confirmed yet. Check again shortly or view your order. Please verify before making another payment."
                : "This payment failed. Review the order before trying again.")}
      </p>
      {(state.error || state.data?.status === "pending") && (
        <button
          className="button secondary"
          onClick={() => setAttempt((v) => v + 1)}
        >
          Verify again
        </button>
      )}
      <Link
        className="button primary"
        to={
          state.data?.order_id
            ? `/account/orders/${state.data.order_id}`
            : "/account/orders"
        }
      >
        View your order
      </Link>
    </section>
  );
}
