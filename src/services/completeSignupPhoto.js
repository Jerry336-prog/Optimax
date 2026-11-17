import { pendingSignupPhoto, clearSignupPhoto } from "./pendingPhoto";
import { saveProfilePhoto } from "./profile";
import { useSession } from "../store/session";
const running = new Map();
export function completeSignupPhoto(user) {
  if (running.has(user.id)) return running.get(user.id);
  const task = (async () => {
    let file;
    // Browsers without IndexedDB can still sign in and upload in settings.
    try { file = await pendingSignupPhoto(user.email); } catch { return; }
    if (!file || useSession.getState().user?.id !== user.id) return;
    const current = useSession.getState().profile;
    if (current?.avatar_url) {
      await clearSignupPhoto(user.email).catch(() => {});
      return;
    }
    useSession.setState({ photoUploading: true });
    const { profile } = await saveProfilePhoto(user.id, { file });
    await clearSignupPhoto(user.email).catch(() => {});
    if (useSession.getState().user?.id === user.id)
      useSession.setState({ profile, photoError: null });
  })().finally(() => {
    running.delete(user.id);
    if (useSession.getState().user?.id === user.id) useSession.setState({ photoUploading: false });
  });
  running.set(user.id, task);
  return task;
}
