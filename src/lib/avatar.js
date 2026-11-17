export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export function validateProfilePhoto(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG or WebP profile photo.");
  if (!file.size || file.size > PROFILE_PHOTO_MAX_BYTES)
    throw new Error("Choose a profile photo up to 5 MB.");
  return file;
}
export function avatarUrl(profile, user) {
  // An explicitly empty profile photo means the customer removed it.
  const value = profile && Object.hasOwn(profile, "avatar_url")
    ? profile.avatar_url : user?.user_metadata?.avatar_url;
  return safeAvatarUrl(value);
}
export function safeAvatarUrl(value) {
  if (typeof value !== "string" || value.length > 2048 || /\s/.test(value)) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}
export function avatarInitials(name) {
  return (name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "O";
}
