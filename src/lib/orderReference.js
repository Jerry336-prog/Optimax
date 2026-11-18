export function orderReference(order) { return order?.order_ref || 'Reference pending'; }
export function normalizeOrderReference(value) { return String(value || '').trim().toUpperCase(); }
export function validOrderReference(value) { return /^OPT-\d{8}-\d{6,}$/.test(normalizeOrderReference(value)); }
export function matchesOrderSearch(order, term, invoice) {
  const query=String(term || '').trim().toLowerCase();
  return !query || [order.order_ref,order.id,order.tracking_number,order.address_snapshot?.recipient,order.address_snapshot?.phone,invoice?.invoice_number,invoice?.customer_snapshot?.name].some(value=>String(value || '').toLowerCase().includes(query));
}
export function matchesInvoiceSearch(invoice,term) {
  const query=String(term || '').trim().toLowerCase();
  return !query || [invoice.order_ref,invoice.invoice_number,invoice.customer_snapshot?.name,invoice.customer_snapshot?.phone].some(value=>String(value || '').toLowerCase().includes(query));
}
