export function pageLoadingVariant(path) {
  if (path === "/" || path.startsWith("/account")) return "home";
  if (
    [
      "/shop",
      "/search",
      "/categories",
      "/wishlist",
      "/recently-viewed",
    ].includes(path)
  )
    return "products";
  if (path.startsWith("/product/")) return "product";
  if (path === "/cart") return "cart";
  if (path === "/checkout") return "checkout";
  if (path === "/payment/return") return "order";
  if (path === "/admin") return "admin";
  if (
    ["/login", "/register", "/forgot-password", "/reset-password"].includes(
      path,
    )
  )
    return "profile";
  return "records";
}
