import { validateProfilePhoto, safeAvatarUrl } from "./avatar.js";
export function ownedAvatarPath(url, bucketBase, userId) {
  if (!url || !url.startsWith(bucketBase)) return null;
  const path = url.slice(bucketBase.length);
  return path.startsWith(`${userId}/`) && /^[a-zA-Z0-9/-]+\.(jpg|png|webp)$/.test(path) ? path : null;
}
// Keep the existing image until the replacement is uploaded and the profile is saved.
export async function saveProfileWithPhoto(client, userId, { file, remove = false, values = {}, previousUrl = "" }) {
  const bucket = client.storage.from("profile-photos");
  let newPath;
  const updates = { ...values };
  if (file) {
    validateProfilePhoto(file);
    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    newPath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const upload = await bucket.upload(newPath, file, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (upload.error) throw upload.error;
    updates.avatar_url = safeAvatarUrl(bucket.getPublicUrl(newPath).data.publicUrl);
    if (!updates.avatar_url) {
      await bucket.remove([newPath]).catch(() => {});
      throw new Error("The image upload returned an invalid photo URL.");
    }
  } else if (remove) updates.avatar_url = "";
  let profile;
  try {
    const result = await client.from("profiles").update(updates).eq("id", userId).select().single();
    if (result.error) throw result.error;
    profile = result.data;
  } catch (error) {
    if (newPath) await bucket.remove([newPath]).catch(() => {});
    throw error;
  }
  const base = bucket.getPublicUrl("").data.publicUrl;
  const previousPath = ownedAvatarPath(previousUrl, base.endsWith("/") ? base : `${base}/`, userId);
  let cleanupWarning = "";
  if ((newPath || remove) && previousPath && previousPath !== newPath) {
    try {
      const result = await bucket.remove([previousPath]);
      if (result.error) throw result.error;
    } catch { cleanupWarning = "Your profile is saved, but the previous photo could not be removed from storage. Please try again later."; }
  }
  return { profile, cleanupWarning };
}
