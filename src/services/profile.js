import { requireBackend } from "../lib/supabase";
import { saveProfileWithPhoto } from "../lib/profilePhoto";
export function saveProfilePhoto(userId, options) {
  return saveProfileWithPhoto(requireBackend(), userId, options);
}
