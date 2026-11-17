import { create } from "zustand";
export const useSaved = create(() => ({
  owner: null,
  ids: [],
  loading: true,
  error: null,
  revision: 0,
}));
export function updateSaved(userId, productId, saved) {
  useSaved.setState((state) =>
    state.owner === userId
      ? {
          ids: saved
            ? [...new Set([...state.ids, productId])]
            : state.ids.filter((id) => id !== productId),
          revision: state.revision + 1,
        }
      : {},
  );
}
