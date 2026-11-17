import { completeSignupPhoto } from "../services/completeSignupPhoto";
import { useEffect } from "react";
import { supabase, backendError } from "../lib/supabase";
import { useSession } from "../store/session";
export default function BackendSession() {
  useEffect(() => {
    if (!supabase) {
      useSession.setState({ loading: false });
      return;
    }
    let active = true;
    let generation = 0;
    let profileRequest = 0;
    async function loadProfile(id, current = generation) {
      const request = ++profileRequest;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (
        active &&
        current === generation &&
        request === profileRequest &&
        useSession.getState().user?.id === id
      )
        useSession.setState({
          profile: data,
          loading: false,
          error: error ? backendError(error) : null,
        });
    }
    function refreshRole() {
      const id = useSession.getState().user?.id;
      if (id && document.visibilityState === "visible") loadProfile(id);
    }
    const roleTimer = setInterval(refreshRole, 30000);
    window.addEventListener("focus", refreshRole);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const current = ++generation;
      const previous = useSession.getState();
      const same = previous.user?.id === session?.user?.id;
      useSession.setState({
        user: session?.user || null,
        profile: same ? previous.profile : null,
        error: null,
        loading: session?.user ? (same ? previous.loading : true) : false,
        photoError: same ? previous.photoError : null,
        photoUploading: same ? previous.photoUploading : false,
        recovery: event === "PASSWORD_RECOVERY" || (same && previous.recovery),
      });
      // Avoid making further auth requests inside the synchronous auth callback.
      if (session?.user)
        setTimeout(async () => {
          await loadProfile(session.user.id, current);
          if (!active || current !== generation) return;
          if (["SIGNED_IN", "INITIAL_SESSION"].includes(event)) {
            try { await completeSignupPhoto(session.user); }
            catch (error) {
              if (active && useSession.getState().user?.id === session.user.id)
                useSession.setState({ photoError: backendError(error) });
            }
          }
        }, 0);
    });
    return () => {
      active = false;
      generation++;
      subscription.unsubscribe();
      clearInterval(roleTimer);
      window.removeEventListener("focus", refreshRole);
    };
  }, []);
  return null;
}
