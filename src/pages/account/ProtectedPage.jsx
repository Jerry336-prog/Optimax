import { orderReference } from "../../lib/orderReference";
import InvoiceActions from "../../components/invoice/InvoiceActions";
import { ArrowUpRight, Plus } from "lucide-react";
import ProfilePhotoPicker from "../../components/account/ProfilePhotoPicker";
import { avatarUrl } from "../../lib/avatar";
import { saveProfilePhoto } from "../../services/profile";
import { pendingSignupPhoto, clearSignupPhoto } from "../../services/pendingPhoto";
import Skeleton from "../../components/ui/Skeleton";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import AccountNav from "../../components/ui/AccountNav";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
import { useQuery } from "../../hooks/useQuery";
import { accountData, saveAddress } from "../../services/account";
import { useSession } from "../../store/session";
import { currency } from "../../services/catalog";
async function pageData(key) {
  if (key.startsWith("profile:")) return [];
  return accountData(key);
}
export default function ProtectedPage({
  kind,
  embedded = false,
  onNavigate,
  addressView,
  onAddressViewChange,
}) {
  const { user, profile, photoUploading } = useSession();
  const query = useQuery(pageData, `${kind}:${user.id}`);
  const [localEditing, setLocalEditing] = useState(null);
  const editing =
    embedded && addressView && addressView !== "new"
      ? query.data?.find((row) => row.id === addressView)
      : localEditing;
  const showEditor = !embedded || !!addressView;
  function setEditing(row) {
    if (embedded) onAddressViewChange(row?.id || null);
    else setLocalEditing(row);
  }

  const [photo, setPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  useEffect(() => {
    let active = true;
    if (photoUploading) setPhoto(null);
    if (kind === "profile" && !profile?.avatar_url && !photoUploading)
      pendingSignupPhoto(user.email).then(file => { if (active && file) setPhoto(current => current || file); }).catch(() => {});
    return () => { active = false; };
  }, [kind, user.email, profile?.avatar_url, photoUploading]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  async function mutate(action) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const notice = await action();
      setMessage(notice || "Saved successfully.");
      query.refresh();
    } catch (error) {
      setMessage(backendError(error));
    } finally {
      setBusy(false);
    }
  }
  function addressSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    mutate(async () => {
      await saveAddress(values, editing?.id, user.id);
      setEditing(null);
      form.reset();
    });
  }
  function profileSubmit(event) {
    event.preventDefault();
    if (photoUploading) return;
    const form = new FormData(event.currentTarget);
    mutate(async () => {
      const values = {
        full_name: form.get("full_name").trim(),
        phone: form.get("phone").trim(),
        notifications_enabled: form.get("notifications_enabled") === "on",
      };
      const { profile: data, cleanupWarning } = await saveProfilePhoto(user.id, {
        file: photo, remove: removePhoto, values, previousUrl: avatarUrl(profile, user),
      });
      useSession.setState({ profile: data, photoError: null });
      await clearSignupPhoto(user.email).catch(() => {});
      setPhoto(null);
      setRemovePhoto(false);
      return cleanupWarning;
    });
  }
  const title = {
    orders: "Your orders.",
    addresses: "Saved addresses.",
    profile: "Your profile.",
    notifications: "Your notifications.",
  }[kind];
  return (
    <section className={embedded ? "drawer-view" : "container page"}>
      {!embedded && (
        <>
          <p className="eyebrow">YOUR OPTIMAX</p>
          <h1>{title}</h1>
          <div className="account-links">
            <Link to="/account">Account</Link>
            <Link to="/account/orders">Orders</Link>
            <Link to="/account/addresses">Addresses</Link>
            <Link to="/account/profile">Profile</Link>
            <Link to="/account/notifications">Notifications</Link>
          </div>
        </>
      )}
      <p role="status" className="feedback">
        {message}
      </p>
      {kind === "profile" ? (
        <form
          className="panel admin-form account-form"
          onSubmit={profileSubmit}
        >
          <ProfilePhotoPicker value={removePhoto ? "" : avatarUrl(profile, user)} file={photo} name={profile?.full_name} busy={busy || photoUploading} onChange={file => { setPhoto(file); setRemovePhoto(false); }} onRemove={() => { setPhoto(null); setRemovePhoto(true); }} />
          <label>
            Full name
            <input
              name="full_name"
              defaultValue={profile?.full_name || ""}
              maxLength={100}
              required
            />
          </label>
          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              defaultValue={profile?.phone || ""}
              maxLength={30}
            />
          </label>
          <label>
            Email
            <input readOnly value={user.email} />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              name="notifications_enabled"
              defaultChecked={profile?.notifications_enabled !== false}
            />
            Enable order update notifications in this browser
          </label>
          <p>
            Order updates are always available in your notification inbox.
            Browser alerts appear while Optimax is open.
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={async () => {
              if (!("Notification" in window)) {
                setMessage(
                  "This browser does not support desktop notifications.",
                );
                return;
              }
              const permission = await Notification.requestPermission();
              setMessage(
                permission === "granted"
                  ? "Browser alerts enabled while Optimax is open."
                  : "Browser alerts are not enabled. Your account inbox is still available.",
              );
            }}
          >
            Enable browser alerts
          </button>
          <button className="button primary" disabled={busy || photoUploading}>
            {photoUploading ? "Uploading signup photo…" : busy ? "Saving…" : "Save profile"}
          </button>
        </form>
      ) : (
        <>
          {kind === "addresses" && embedded && !showEditor && (
            <button
              className="button primary drawer-add-address"
              onClick={() => onAddressViewChange("new")}
            >
              <Plus size={16} aria-hidden="true" /> Add an address
            </button>
          )}
          {kind === "addresses" &&
            showEditor &&
            (!embedded || addressView === "new" || editing) && (
              <div className="panel account-form">
                {!embedded && (
                  <h2>{editing ? "Edit address" : "Add an address"}</h2>
                )}
                <form
                  className="admin-form"
                  key={editing?.id || "new"}
                  onSubmit={addressSubmit}
                >
                  {[
                    ["label", "Label (e.g. Home)"],
                    ["recipient", "Recipient name"],
                    ["phone", "Phone number"],
                    ["address_line", "Street address"],
                    ["city", "City"],
                    ["state", "State"],
                  ].map(([name, label]) => (
                    <label key={name}>
                      {label}
                      <input
                        name={name}
                        defaultValue={editing?.[name] || ""}
                        required
                        minLength={name === "address_line" ? 5 : 1}
                        maxLength={name === "address_line" ? 500 : 100}
                      />
                    </label>
                  ))}
                  <div className="inline-actions">
                    <button className="button primary" disabled={busy}>
                      {editing ? "Save changes" : "Add address"}
                    </button>
                    {(editing || embedded) && (
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          {embedded &&
          showEditor &&
          kind === "addresses" &&
          !query.loading &&
          !query.error &&
          addressView !== "new" &&
          !editing ? (
            <p role="alert">This address is no longer available.</p>
          ) : embedded &&
            showEditor &&
            kind === "addresses" &&
            (addressView === "new" || editing) ? null : query.loading ? (
            <Skeleton
              variant={
                kind === "addresses" && addressView ? "address-form" : "records"
              }
              label={`Loading your ${kind}…`}
            />
          ) : query.error ? (
            <div className="empty-state">
              <p role="alert">{query.error}</p>
              <button className="button secondary" onClick={query.refresh}>
                Try again
              </button>
            </div>
          ) : !query.data?.length ? (
            <div className="empty-state">
              <h2>Nothing here yet.</h2>
              <p>
                {kind === "orders"
                  ? "Your purchases will appear here."
                  : kind === "addresses"
                    ? "Add a delivery address to make checkout easier."
                    : "You’re all caught up."}
              </p>
            </div>
          ) : (
            <div className="account-records">
              {query.data.map((row) => (
                <article className="panel" key={row.id}>
                  {kind === "orders" ? (
                    <>
                      <div className="section-heading">
                        <div>
                          <p className="eyebrow">
                            {new Date(row.created_at).toLocaleDateString()}
                          </p>
                          <h2>Order {orderReference(row)}</h2>
                        </div>
                        <span className="status-badge">{row.status}</span>
                      </div>
                      <p>
                        {currency(row.total)} · {row.payment_status} · delivery
                        arranged separately
                      </p>
                      <div className="inline-actions">
                        <AccountNav
                          onNavigate={onNavigate}
                          className="button secondary"
                          to={`/account/orders/${row.id}`}
                        >
                          Order details & tracking <ArrowUpRight size={16} aria-hidden="true" className="inline-icon" />
                        </AccountNav>
                        {row.status === "pending" &&
                          row.payment_status === "unpaid" && (
                            <button
                              disabled={busy}
                              className="text-link"
                              onClick={() =>
                                mutate(async () =>
                                  resultOf(
                                    await requireBackend().rpc("update_order", {
                                      p_order: row.id,
                                      p_status: "cancelled",
                                      p_note: "Cancelled by customer.",
                                    }),
                                  ),
                                )
                              }
                            >
                              Cancel order
                            </button>
                          )}
                      </div>
                      {row.payment_status === "paid" && <InvoiceActions orderId={row.id} />}
                    </>
                  ) : kind === "addresses" ? (
                    <>
                      <h2>{row.label}</h2>
                      <p>
                        {row.recipient} · {row.phone}
                        <br />
                        {row.address_line}, {row.city}, {row.state}
                      </p>
                      <div className="inline-actions">
                        <button
                          className="button secondary"
                          onClick={() => {
                            setEditing(row);
                            if (!embedded)
                              window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-link"
                          disabled={busy}
                          onClick={() => setRemoving(row)}
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2>{row.title}</h2>
                      <p>{row.body}</p>
                      <p>{new Date(row.created_at).toLocaleString()}</p>
                      <div className="inline-actions">
                        {row.order_id && (
                          <AccountNav
                            onNavigate={onNavigate}
                            className="text-link"
                            to={`/account/orders/${row.order_id}`}
                          >
                            View order <ArrowUpRight size={16} aria-hidden="true" className="inline-icon" />
                          </AccountNav>
                        )}
                        {!row.read_at && (
                          <button
                            className="button secondary"
                            disabled={busy}
                            onClick={() =>
                              mutate(async () =>
                                resultOf(
                                  await requireBackend()
                                    .from("notifications")
                                    .update({
                                      read_at: new Date().toISOString(),
                                    })
                                    .eq("id", row.id)
                                    .eq("user_id", user.id),
                                ),
                              )
                            }
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {removing && (
        <ConfirmDialog
          title="Remove this address?"
          onCancel={() => setRemoving(null)}
          cancelLabel="Keep address"
          confirmLabel="Remove address"
          busy={busy}
          onConfirm={() => {
            const id = removing.id;
            setRemoving(null);
            mutate(async () =>
              resultOf(
                await requireBackend()
                  .from("addresses")
                  .delete()
                  .eq("id", id)
                  .eq("user_id", user.id),
              ),
            );
          }}
        >
          <p>
            {removing.label}: {removing.address_line}, {removing.city}. Existing
            orders keep their original delivery address.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
