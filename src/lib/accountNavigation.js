export const accountTitles = {
  menu: "Your Optimax",
  orders: "My orders",
  addresses: "Saved addresses",
  profile: "Profile settings",
  notifications: "Notifications",
  wishlist: "Wishlist",
  "recently-viewed": "Recently viewed",
  order: "Order details",
};
export function accountRoute(pathname) {
  if (pathname === "/account") return { view: "menu" };
  const order = pathname.match(/^\/account\/orders\/([^/]+)$/);
  if (order) return { view: "order", orderId: order[1] };
  const section = pathname.match(
    /^\/account\/(orders|addresses|profile|notifications)$/,
  );
  if (section) return { view: section[1] };
  if (["/wishlist", "/recently-viewed"].includes(pathname))
    return { view: pathname.slice(1) };
  return null;
}
