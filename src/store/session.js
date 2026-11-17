import { create } from "zustand";
export const useSession = create(() => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  recovery: false,
  photoError: null,
  photoUploading: false,
}));
