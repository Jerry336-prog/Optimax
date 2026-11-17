import { useCallback, useEffect, useState } from "react";
import { backendError } from "../lib/supabase";
// Loaders are module-level functions. Never expose a previous account's result
// while the effect for a new key is waiting to run.
export function useQuery(loader, key = "") {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    context: null,
  });
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let active = true;
    const context = { loader, key, version };
    setState({ data: null, loading: true, error: null, context });
    Promise.resolve()
      .then(() => loader(key))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null, context });
      })
      .catch((error) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error: backendError(error),
            context,
          });
      });
    return () => {
      active = false;
    };
  }, [loader, key, version]);
  const current =
    state.context?.loader === loader &&
    state.context?.key === key &&
    state.context?.version === version;
  return current
    ? { ...state, refresh }
    : { data: null, loading: true, error: null, refresh };
}
