import { create } from "zustand";
import { persist } from "zustand/middleware";
export const useShop = create(
  persist(
    (set) => ({
      cart: [],
      cartOwner: null,
      cartDirty: false,
      cartSyncing: true,
      setCartSyncing: (cartSyncing) => set({ cartSyncing }),
      wishlist: [],
      recentlyViewed: [],
      theme: "dark",
      setCart: (cart, cartOwner, cartDirty = false) =>
        set({ cart, cartOwner, cartDirty }),
      markCartClean: () => set({ cartDirty: false }),
      clearCart: () => set({ cart: [], cartDirty: true }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      addToCart: (product) => {
        if (product.stock < 1) return;
        set((s) => ({
          cartDirty: true,
          cart: s.cart.some((i) => i.id === product.id)
            ? s.cart.map((i) =>
                i.id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
                  : i,
              )
            : [...s.cart, { ...product, quantity: 1 }],
        }));
      },
      quantity: (id, quantity) =>
        set((s) => ({
          cartDirty: true,
          cart:
            quantity <= 0
              ? s.cart.filter((i) => i.id !== id)
              : s.cart.map((i) =>
                  i.id === id
                    ? {
                        ...i,
                        quantity: Math.min(
                          Math.max(1, Math.floor(quantity) || 1),
                          i.stock,
                        ),
                      }
                    : i,
                ),
        })),
      toggleWish: (product) =>
        set((s) => ({
          wishlist: s.wishlist.some((i) => i.id === product.id)
            ? s.wishlist.filter((i) => i.id !== product.id)
            : [...s.wishlist, product],
        })),
      view: (product) =>
        set((s) => ({
          recentlyViewed: [
            product,
            ...s.recentlyViewed.filter((i) => i.id !== product.id),
          ].slice(0, 12),
        })),
    }),
    {
      name: "optimax-shopping",
      version: 1,
      merge: (persisted, current) => {
        const clean = { ...persisted };
        delete clean.comparison;
        delete clean.compare;
        return { ...current, ...clean };
      },
      partialize: ({
        cart,
        cartOwner,
        cartDirty,
        wishlist,
        recentlyViewed,
        theme,
      }) => ({
        cart,
        cartOwner,
        cartDirty,
        wishlist,
        recentlyViewed,
        theme,
      }),
    },
  ),
);
