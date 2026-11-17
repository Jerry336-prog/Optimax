import Avatar from "../ui/Avatar";
import { useMemo, useState } from "react";
import {
  Search,
  Users,
  MessageSquare,
  ShieldCheck,
  ArrowDown,
  ArrowUp,
  X,
} from "lucide-react";
import { useSession } from "../../store/session";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useEffect, useRef } from "react";
function MessageDialog({ customer, onClose, onSend, busy, message }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      className="gallery-dialog customer-message"
      ref={ref}
      aria-labelledby="customer-message-title"
      onCancel={onClose}
    >
      <div className="section-heading">
        <h2 id="customer-message-title">
          Message {customer.full_name || "customer"}
        </h2>
        <button
          className="icon-button"
          aria-label="Close notification"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <p>This notification will appear in their Optimax account inbox.</p>
      <form className="admin-form" onSubmit={onSend}>
        <label>
          Notification title
          <input name="title" required maxLength={120} />
        </label>
        <label>
          Message
          <textarea name="body" required maxLength={1000} rows={4} />
        </label>
        <p role="status" className="feedback">
          {message}
        </p>
        <button className="button primary" disabled={busy}>
          {busy ? "Sending…" : "Send notification"}
        </button>
      </form>
    </dialog>
  );
}
export default function CustomerList({ profiles, orders, onChange }) {
  const { user, profile } = useSession();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [roleChange, setRoleChange] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const adminCount = profiles.filter((p) => p.role === "admin").length;
  const statistics = useMemo(
    () =>
      orders.reduce((all, order) => {
        if (order.status === "cancelled") return all;
        all[order.user_id] = (all[order.user_id] || 0) + 1;
        return all;
      }, {}),
    [orders],
  );
  const visible = profiles.filter(
    (p) =>
      (filter === "all" || p.role === filter) &&
      `${p.full_name} ${p.phone}`.toLowerCase().includes(search.toLowerCase()),
  );
  async function changeRole() {
    const change = roleChange;
    setRoleChange(null);
    setBusy(true);
    setMessage("");
    try {
      const updated = resultOf(
        await requireBackend().rpc("set_account_role", {
          p_user: change.customer.id,
          p_role: change.role,
        }),
      );
      setMessage(
        `${change.customer.full_name || "Account"} is now ${change.role === "admin" ? "an administrator" : "a customer"}.`,
      );
      if (change.customer.id === user.id)
        useSession.setState((s) => ({
          profile: { ...s.profile, role: updated.role },
        }));
      onChange();
    } catch (error) {
      setMessage(backendError(error));
    } finally {
      setBusy(false);
    }
  }
  async function send(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      resultOf(
        await requireBackend().rpc("notify_customer", {
          p_user: selected.id,
          p_title: values.get("title"),
          p_body: values.get("body"),
        }),
      );
      setSelected(null);
      setMessage("Notification delivered to the account inbox.");
    } catch (error) {
      setMessage(backendError(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="customers-section">
      <div className="customers-heading">
        <div>
          <h2>Customer accounts</h2>
          <p>
            {profiles.length} accounts · {adminCount}{" "}
            {adminCount === 1 ? "administrator" : "administrators"}
          </p>
        </div>
        <Users size={26} />
      </div>
      <div className="customers-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            aria-label="Search customer accounts"
          />
        </label>
        <select
          aria-label="Filter account role"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All accounts</option>
          <option value="customer">Customers</option>
          <option value="admin">Administrators</option>
        </select>
      </div>
      {message && (
        <p className="feedback" role="status">
          {message}
        </p>
      )}
      <div className="customer-table-wrap">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Orders</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((customer) => {
              const name = customer.full_name || "Unnamed customer";
              const lastAdmin = customer.role === "admin" && adminCount <= 1;
              return (
                <tr key={customer.id}>
                  <td>
                    <div className="customer-identity">
                      <Avatar profile={customer.id === user.id ? profile || customer : customer} name={name} size={39} className="customer-avatar" decorative />
                      <span>
                        <strong>
                          {name}
                          {customer.id === user.id && (
                            <small className="self-label">You</small>
                          )}
                        </strong>
                        <small>
                          Joined{" "}
                          {new Date(customer.created_at).toLocaleDateString()}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td>{customer.phone || "Not provided"}</td>
                  <td>
                    <span className={`account-role ${customer.role}`}>
                      {customer.role === "admin" && <ShieldCheck size={12} />}{" "}
                      {customer.role === "admin" ? "Admin" : "Customer"}
                    </span>
                  </td>
                  <td>{statistics[customer.id] || 0}</td>
                  <td>
                    <div className="customer-actions">
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => {
                          setMessage("");
                          setSelected(customer);
                        }}
                      >
                        <MessageSquare size={14} />
                        Message
                      </button>
                      <button
                        className="button secondary"
                        disabled={busy || lastAdmin}
                        title={
                          lastAdmin
                            ? "At least one administrator must remain."
                            : undefined
                        }
                        onClick={() =>
                          setRoleChange({
                            customer,
                            role:
                              customer.role === "admin" ? "customer" : "admin",
                          })
                        }
                      >
                        {customer.role === "admin" ? (
                          <ArrowDown size={14} />
                        ) : (
                          <ArrowUp size={14} />
                        )}{" "}
                        {customer.role === "admin"
                          ? "Make customer"
                          : "Make admin"}
                      </button>
                    </div>
                    {lastAdmin && (
                      <small className="last-admin-note">
                        Last administrator
                      </small>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!visible.length && (
          <div className="empty-state">
            <h2>No accounts found.</h2>
            <p>Try another name, phone number, or role.</p>
          </div>
        )}
      </div>
      {selected && (
        <MessageDialog
          customer={selected}
          onClose={() => setSelected(null)}
          onSend={send}
          busy={busy}
          message={message}
        />
      )}
      {roleChange && (
        <ConfirmDialog
          title={
            roleChange.role === "admin"
              ? "Make this account an admin?"
              : "Change this admin to a customer?"
          }
          onCancel={() => setRoleChange(null)}
          onConfirm={changeRole}
          busy={busy}
          cancelLabel="Cancel"
          confirmLabel={
            roleChange.role === "admin" ? "Make admin" : "Make customer"
          }
        >
          <p>
            {roleChange.customer.full_name || "This account"}{" "}
            {roleChange.role === "admin"
              ? "will be able to manage products, orders, customer accounts, and store settings."
              : "will lose access to store management and keep their customer account."}
          </p>
          {roleChange.customer.id === user.id && (
            <p>
              This is your account. You will leave the admin dashboard after
              confirming.
            </p>
          )}
        </ConfirmDialog>
      )}
    </section>
  );
}
