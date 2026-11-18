import { validOrderReference } from './orderReference.js';
export const INVOICE_WATERMARK = { text: 'OPTIMAX', color: '#475569', opacity: 0.075, angle: -24, widthRatio: 0.68, fontScale: 0.06 };
export const invoiceMoney = amount => `NGN ${Number(amount).toLocaleString('en-NG', {minimumFractionDigits:2,maximumFractionDigits:2})}`;
export const invoiceDate = value => new Intl.DateTimeFormat('en-NG',{day:'2-digit',month:'short',year:'numeric',timeZone:'Africa/Lagos'}).format(new Date(value));
export function validateInvoice(invoice) {
  if(!invoice?.invoice_number || !invoice.order_id || !validOrderReference(invoice.order_ref) || !invoice.payment_reference || !Number.isFinite(Date.parse(invoice.issued_at)) || invoice.currency!=='NGN' || !Array.isArray(invoice.items) || !invoice.items.length)
    throw new Error('This paid invoice is incomplete. Please contact the store.');
  const cents=value=>Math.round(Number(value)*100);
  let subtotal=0;
  for(const item of invoice.items) {
    if(!Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity)<=0 || !Number.isFinite(Number(item.unit_price)) || Number(item.unit_price)<0 || cents(item.line_total)!==cents(item.unit_price)*Number(item.quantity))
      throw new Error('Invoice item totals do not match. Please contact the store.');
    subtotal+=cents(item.line_total);
  }
  if(!Number.isFinite(Number(invoice.discount)) || Number(invoice.discount)<0 || subtotal!==cents(invoice.subtotal) || cents(invoice.total)!==subtotal-cents(invoice.discount))
    throw new Error('Invoice totals do not match. Please contact the store.');
  return invoice;
}
