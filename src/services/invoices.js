import { requireBackend, resultOf } from '../lib/supabase';
export async function invoiceQuery(orderId) {
  const result=await requireBackend().from('invoices').select('*').eq('order_id',orderId).maybeSingle();
  const invoice=resultOf(result);
  if(!invoice) throw new Error('No paid invoice is available for this order yet. It appears automatically after payment is verified.');
  return invoice;
}
export async function downloadInvoice(invoice) {
  const { createInvoicePDF } = await import('../lib/invoicePdf');
  createInvoicePDF(invoice).save(`${invoice.invoice_number}.pdf`);
}
