import { prepareStoreSettings } from "../../lib/storeSettings";
import ProductEditor from "../../components/admin/ProductEditor";
import CustomerList from "../../components/admin/CustomerList";
import { resolveMedia } from "../../lib/productEditor";
import Skeleton from "../../components/ui/Skeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useState } from "react";
import { Link } from "react-router-dom";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
import { useQuery } from "../../hooks/useQuery";
import { useBusiness } from "../../hooks/useBusiness";
import { adminQuery, uploadImages } from "../../services/admin";
import { currency } from "../../services/catalog";
const transitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
export default function Admin() {
  const query = useQuery(adminQuery);
  const [tab, setTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  async function mutate(action, success = "Saved successfully.") {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
      query.refresh();
    } catch (error) {
      setMessage(backendError(error));
    } finally {
      setBusy(false);
    }
  }
  function saveProduct(values) {
    return mutate(
      async () => {
        const { gallery, frames, ...fields } = values;
        if (
          !Number.isInteger(fields.stock) ||
          fields.stock < 0 ||
          !Number.isFinite(fields.price) ||
          fields.price < 0
        )
          throw new Error(
            "Enter a valid price and a whole-number stock quantity.",
          );
        const [images, spin_images] = await Promise.all([
          resolveMedia(gallery, uploadImages),
          resolveMedia(frames, uploadImages),
        ]);
        const payload = { ...fields, images, spin_images };
        resultOf(
          await (editing
            ? requireBackend()
                .from("products")
                .update(payload)
                .eq("id", editing.id)
            : requireBackend().from("products").insert(payload)),
        );
        setEditing(null);
        setEditorVersion((v) => v + 1);
      },
      editing ? "Product updated." : "Product created.",
    );
  }
  function orderStatus(event, order) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutate(
      async () =>
        resultOf(
          await requireBackend().rpc("update_order", {
            p_order: order.id,
            p_status: form.get("status"),
            p_note: form.get("note"),
            p_tracking: form.get("tracking"),
          }),
        ),
      "Order and delivery timeline updated.",
    );
  }
  function couponSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    mutate(async () => {
      resultOf(
        await requireBackend()
          .from("coupons")
          .upsert({
            code: f.get("code").trim().toUpperCase(),
            percent: Number(f.get("percent")),
            minimum: Number(f.get("minimum")),
            expires_at: f.get("expires_at")
              ? new Date(f.get("expires_at")).toISOString()
              : null,
            active: true,
          }),
      );
      form.reset();
    });
  }
  function settingsSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const prepared = prepareStoreSettings(Object.fromEntries(new FormData(form)));
    if (prepared.error) {
      setMessage(prepared.error);
      const field = form.elements.namedItem(prepared.field);
      field?.focus();
      field?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const { values } = prepared;
    mutate(async () => {
      const data = resultOf(
        await requireBackend()
          .from("site_settings")
          .update(values)
          .eq("id", "store")
          .select()
          .single(),
      );
      useBusiness.setState((s) => ({ business: { ...s.business, ...data }, loading: false, error: null }));
    }, "Store settings saved across the website.");
  }
  const data = query.data;
  return (
    <section className="container page admin-page">
      <p className="eyebrow">OPTIMAX MANAGEMENT</p>
      <div className="section-heading">
        <h1>Your store.</h1>
        <Link className="button secondary" to="/account">
          Your account
        </Link>
      </div>
      <div className="filter-tabs">
        {[
          "overview",
          "products",
          "orders",
          "customers",
          "coupons",
          "reviews",
          "enquiries",
          "settings",
        ].map((name) => (
          <button
            className={tab === name ? "selected" : ""}
            key={name}
            onClick={() => {
              setTab(name);
              setMessage("");
              setSearch("");
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <p className="feedback" role="status">
        {message}
      </p>
      {query.loading ? (
        <Skeleton variant="admin" label="Loading store management…" />
      ) : query.error ? (
        <div className="empty-state">
          <p role="alert">{query.error}</p>
          <button className="button secondary" onClick={query.refresh}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {tab === "overview" && (
            <>
              <div className="account-grid">
                {[
                  [
                    "Product sales value",
                    currency(
                      data.orders
                        .filter((o) => o.status !== "cancelled")
                        .reduce((s, o) => s + Number(o.total), 0),
                    ),
                  ],
                  [
                    "Verified paid revenue",
                    currency(
                      data.orders
                        .filter((o) => o.payment_status === "paid")
                        .reduce((s, o) => s + Number(o.total), 0),
                    ),
                  ],
                  ["Orders", data.orders.length],
                  [
                    "Pending orders",
                    data.orders.filter((o) => o.status === "pending").length,
                  ],
                  [
                    "Low stock (< 5)",
                    data.products.filter((p) => p.stock < 5).length,
                  ],
                  [
                    "Customers",
                    data.profiles.filter((p) => p.role === "customer").length,
                  ],
                ].map(([title, value]) => (
                  <div className="panel" key={title}>
                    <p>{title}</p>
                    <h2>{value}</h2>
                  </div>
                ))}
              </div>
              <div className="admin-layout">
                <div className="panel">
                  <h2>Stock to watch</h2>
                  {data.products
                    .filter((p) => p.stock < 5)
                    .map((p) => (
                      <div className="inventory-row" key={p.id}>
                        <span>{p.name}</span>
                        <strong>{p.stock} left</strong>
                      </div>
                    ))}
                </div>
                <div className="panel">
                  <h2>Top ordered products</h2>
                  {Object.values(
                    data.orders
                      .filter((o) => o.status !== "cancelled")
                      .flatMap((o) => o.order_items)
                      .reduce((acc, i) => {
                        acc[i.product_id] ??= {
                          name: i.product_name,
                          quantity: 0,
                        };
                        acc[i.product_id].quantity += i.quantity;
                        return acc;
                      }, {}),
                  )
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5)
                    .map((p) => (
                      <div className="inventory-row" key={p.name}>
                        <span>{p.name}</span>
                        <strong>{p.quantity} ordered</strong>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
          {tab === "products" && (
            <div className="admin-layout">
              <div className="panel">
                <h2>{editing ? "Edit product" : "Add a product"}</h2>
                <ProductEditor
                  key={editing?.id || `new-${editorVersion}`}
                  product={editing}
                  busy={busy}
                  onSave={saveProduct}
                  onCancel={() => {
                    setEditing(null);
                    setEditorVersion((v) => v + 1);
                  }}
                />
              </div>
              <div className="panel">
                <h2>Inventory</h2>
                <input
                  aria-label="Search inventory"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                />
                {data.products
                  .filter((p) =>
                    p.name.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((p) => (
                    <div className="inventory-row" key={p.id}>
                      <div>
                        <strong>{p.name}</strong>
                        <p>
                          {currency(p.price)} · {p.stock} in stock ·{" "}
                          {p.active ? "Published" : "Draft"}
                        </p>
                        <div className="inline-actions">
                          <button
                            className="text-link"
                            onClick={() => {
                              setEditing(p);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            disabled={busy}
                            className="text-link"
                            onClick={() =>
                              mutate(async () =>
                                resultOf(
                                  await requireBackend()
                                    .from("products")
                                    .update({ active: !p.active })
                                    .eq("id", p.id),
                                ),
                              )
                            }
                          >
                            {p.active ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            className="text-link"
                            disabled={busy}
                            onClick={() => setConfirm(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {tab === "orders" && (
            <div className="account-records">
              {!data.orders.length && <p>No orders yet.</p>}
              {data.orders.map((o) => (
                <article className="panel" key={o.id}>
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">{o.id}</p>
                      <h2>
                        {currency(o.total)} · {o.status}
                      </h2>
                    </div>
                    <span className="status-badge">{o.payment_status}</span>
                  </div>
                  <p>
                    {o.address_snapshot.recipient} · {o.address_snapshot.phone}
                    <br />
                    {o.address_snapshot.address_line}, {o.address_snapshot.city}
                    , {o.address_snapshot.state}
                  </p>
                  <p>
                    {o.order_items
                      .map((i) => `${i.product_name} × ${i.quantity}`)
                      .join(" · ")}
                  </p>
                  {transitions[o.status]?.length > 0 && (
                    <form
                      className="admin-form"
                      onSubmit={(e) => orderStatus(e, o)}
                    >
                      <div className="form-pair">
                        <label>
                          Next status
                          <select name="status">
                            {transitions[o.status].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Tracking reference
                          <input
                            name="tracking"
                            defaultValue={o.tracking_number}
                            maxLength={100}
                          />
                        </label>
                      </div>
                      <label>
                        Update for customer
                        <input
                          name="note"
                          maxLength={500}
                          placeholder="e.g. Your package has been handed to the courier."
                        />
                      </label>
                      <button className="button primary" disabled={busy}>
                        Update order
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
          {tab === "customers" && (
            <CustomerList
              profiles={data.profiles}
              orders={data.orders}
              onChange={query.refresh}
            />
          )}
          {tab === "coupons" && (
            <div className="admin-layout">
              <form className="panel admin-form" onSubmit={couponSubmit}>
                <h2>Create or update coupon</h2>
                <label>
                  Code
                  <input
                    name="code"
                    required
                    minLength={3}
                    maxLength={32}
                    pattern="[A-Za-z0-9_-]+"
                  />
                </label>
                <label>
                  Discount (%)
                  <input
                    type="number"
                    name="percent"
                    required
                    min="1"
                    max="100"
                    step="1"
                  />
                </label>
                <label>
                  Minimum product subtotal
                  <input
                    name="minimum"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    required
                  />
                </label>
                <label>
                  Expires at (optional)
                  <input type="datetime-local" name="expires_at" />
                </label>
                <button className="button primary" disabled={busy}>
                  Save coupon
                </button>
              </form>
              <div className="panel">
                {data.coupons.map((c) => (
                  <div className="inventory-row" key={c.code}>
                    <div>
                      <strong>
                        {c.code} · {c.percent}%
                      </strong>
                      <p>
                        Minimum {currency(c.minimum)} ·{" "}
                        {c.active ? "Active" : "Disabled"}
                      </p>
                    </div>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() =>
                        mutate(async () =>
                          resultOf(
                            await requireBackend()
                              .from("coupons")
                              .update({ active: !c.active })
                              .eq("code", c.code),
                          ),
                        )
                      }
                    >
                      {c.active ? "Disable" : "Enable"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "reviews" && (
            <div className="account-records">
              {!data.reviews.length && <p>No reviews yet.</p>}
              {data.reviews.map((r) => (
                <article className="panel" key={r.id}>
                  <h2>
                    {r.product?.name} · {r.rating}/5
                  </h2>
                  <p>{r.body}</p>
                  <button
                    disabled={busy}
                    className="button secondary"
                    onClick={() =>
                      mutate(async () =>
                        resultOf(
                          await requireBackend()
                            .from("reviews")
                            .update({ approved: !r.approved })
                            .eq("id", r.id),
                        ),
                      )
                    }
                  >
                    {r.approved ? "Hide review" : "Approve review"}
                  </button>
                </article>
              ))}
            </div>
          )}
          {tab === "enquiries" && (
            <div className="account-records">
              {!data.enquiries.length && <p>No enquiries yet.</p>}
              {data.enquiries.map((e) => (
                <article className="panel" key={e.id}>
                  <p className="eyebrow">
                    {new Date(e.created_at).toLocaleString()} ·{" "}
                    {e.resolved ? "Resolved" : "Open"}
                  </p>
                  <h2>{e.topic}</h2>
                  <p>
                    {e.name} · <a href={`mailto:${e.email}`}>{e.email}</a>
                  </p>
                  <p className="preserve-lines">{e.message}</p>
                  <button
                    disabled={busy}
                    className="button secondary"
                    onClick={() =>
                      mutate(async () =>
                        resultOf(
                          await requireBackend()
                            .from("enquiries")
                            .update({ resolved: !e.resolved })
                            .eq("id", e.id),
                        ),
                      )
                    }
                  >
                    {e.resolved ? "Reopen" : "Mark resolved"}
                  </button>
                </article>
              ))}
            </div>
          )}
          {tab === "settings" && (
            <form
              className="panel admin-form account-form"
              key={JSON.stringify(data.settings)}
              onSubmit={settingsSubmit}
            >
              <h2>Store availability</h2>
              <p>Closing the store replaces Shop All with your message and adds a closure banner across every page. Other pages remain accessible; new orders and payment starts are paused.</p>
              <label>Store status
                <select name="store_open" defaultValue={String(data.settings.store_open !== false)}>
                  <option value="true">Open — accept orders</option>
                  <option value="false">Closed — pause shopping and payments</option>
                </select>
              </label>
              <label>Closure message
                <textarea name="closure_reason" rows={4} defaultValue={data.settings.closure_reason || ""} placeholder="We’re temporarily closed for restocking. Please contact our team on WhatsApp for urgent assistance." />
              </label>
              <label>WhatsApp contact number
                <input name="whatsapp" type="tel" autoComplete="tel" defaultValue={data.settings.whatsapp || ""} placeholder="+234 803 633 8604" aria-describedby="closure-whatsapp-help" />
              </label>
              <p id="closure-whatsapp-help">Customers use this number to chat with your team while closed. Include the country code; +, spaces and dashes are accepted. Keep the number separate from your message.</p>
              <p>Enter any non-empty closure message, with no character or word-count limit. Select Open and save to reopen.</p>
              <h2>Store contact details</h2>
              {[
                ["email", "Email"],
                ["phone", "Phone display"],
                ["address", "Shop address"],
                ["area", "City / area"],
                ["hours", "Opening hours"],
                ["note", "Contact information note"],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    name={name}
                    type={name === "email" ? "email" : "text"}
                    defaultValue={data.settings[name] || ""}
                    required={name !== "note"}
                    maxLength={500}
                  />
                </label>
              ))}
              <button className="button primary" disabled={busy}>
                Save store settings
              </button>
            </form>
          )}
        </>
      )}
      {confirm && (
        <ConfirmDialog
          title={`Delete ${confirm.name}?`}
          onCancel={() => setConfirm(null)}
          busy={busy}
          onConfirm={() => {
            const id = confirm.id;
            setConfirm(null);
            mutate(
              async () =>
                resultOf(
                  await requireBackend().from("products").delete().eq("id", id),
                ),
              "Product deleted.",
            );
          }}
        >
          <p>
            Products referenced by orders cannot be deleted. Unpublish them
            instead.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
