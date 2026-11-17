import { useState } from "react";
import { UserRound } from "lucide-react";
import { avatarUrl, avatarInitials } from "../../lib/avatar";
export default function Avatar({ profile, user, name, src, className = "", size = 40, decorative = false }) {
  const [failed, setFailed] = useState(null);
  const url = src ?? avatarUrl(profile, user);
  const label = name || profile?.full_name || user?.user_metadata?.full_name || "";
  const hasImage = !!url && failed !== url;
  return (
    <span className={`avatar ${hasImage ? "avatar-image" : "avatar-fallback"} ${className}`} style={{ width: size, height: size }} role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `${label || "Your"} profile picture`}>
      {hasImage ? <img key={url} src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(url)} /> : label ? avatarInitials(label) : <UserRound size={Math.round(size * .5)} />}
    </span>
  );
}
