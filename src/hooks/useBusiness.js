import { create } from "zustand";
import { business } from "../config/business";
export const useBusiness = create(() => ({ business, loading: true, error: null }));
