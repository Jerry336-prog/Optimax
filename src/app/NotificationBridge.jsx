import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../store/session";
import { supabase } from "../lib/supabase";
export default function NotificationBridge() {
  const { user, profile } = useSession();
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    setNotice(null);
    if (!user || !supabase) return;
    let active = true;
    let last = new Date().toISOString();
    async function poll() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .gt("created_at", last)
        .order("created_at", { ascending: false });
      if (!active || error || !data?.length) return;
      last = data[0].created_at;
      setNotice(data[0]);
      if (
        profile?.notifications_enabled &&
        "Notification" in window &&
        Notification.permission === "granted"
      )
        new Notification(data[0].title, {
          body: data[0].body,
          icon: "/favicon.svg",
        });
    }
    const timer = setInterval(poll, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user, profile?.notifications_enabled]);
  return notice ? (
    <aside className="notification-toast" role="status">
      <strong>{notice.title}</strong>
      <p>{notice.body}</p>
      <Link
        className="text-link"
        to="/account/notifications"
        onClick={() => setNotice(null)}
      >
        Open inbox ↗
      </Link>
      <button
        className="icon-button"
        aria-label="Dismiss notification"
        onClick={() => setNotice(null)}
      >
        ×
      </button>
    </aside>
  ) : null;
}
