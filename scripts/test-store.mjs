import assert from "node:assert/strict";
const memory = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key) => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  },
});
globalThis.window = { localStorage: globalThis.localStorage };
const { useShop } = await import("../src/store/shop.js");
const product = { id: "test-product", name: "Test", stock: 2, price: 100 };
useShop.getState().addToCart({ ...product, stock: 0 });
assert.equal(useShop.getState().cart.length, 0);
for (let i = 0; i < 3; i++) useShop.getState().addToCart(product);
assert.equal(useShop.getState().cart[0].quantity, 2);
assert.equal(useShop.getState().cartDirty, true);
assert.equal(JSON.parse(memory.get("optimax-shopping")).state.cartDirty, true);
useShop.getState().quantity(product.id, 1);
assert.equal(useShop.getState().cart[0].quantity, 1);
useShop.getState().markCartClean();
assert.equal(useShop.getState().cartDirty, false);
useShop.getState().clearCart();
assert.equal(useShop.getState().cart.length, 0);
assert.equal(useShop.getState().cartDirty, true);
useShop.getState().toggleWish(product);
useShop.getState().toggleWish(product);
assert.equal(useShop.getState().wishlist.length, 0);
useShop.getState().view(product);
useShop.getState().view(product);
assert.equal(useShop.getState().recentlyViewed.length, 1);
memory.set("optimax-shopping", JSON.stringify({ version: 1, state: { comparison: [product], wishlist: [product] } }));
await useShop.persist.rehydrate();
assert.equal(useShop.getState().comparison, undefined);
assert.equal(useShop.getState().compare, undefined);
assert.equal(useShop.getState().wishlist.length, 1);
console.log(
  "PASS bag stock limits, dirty-state persistence, quantity/removal, wishlist toggle, recent-view deduplication, legacy comparison removed without losing wishlist",
);
