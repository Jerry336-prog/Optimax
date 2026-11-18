import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { useQuery } from '../../hooks/useQuery';
import { useSession } from '../../store/session';
import { invoiceQuery, downloadInvoice } from '../../services/invoices';
import { invoiceDate, invoiceMoney } from '../../lib/invoice';
import { backendError } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
export function InvoiceDocument({invoice}) {
  const customer=invoice.customer_snapshot || {};const business=invoice.business_snapshot || {};
  return <article className="invoice-paper" aria-label={`Paid invoice ${invoice.invoice_number}`}>
    <div className="invoice-watermark" aria-hidden="true">OPTIMAX</div>
    <div className="invoice-document-header"><div><strong className="invoice-brand">OPTIMAX</strong><p>{business.name}</p><p>{business.address}<br/>{business.area}</p><p>{business.email}<br/>{business.phone}</p></div><div><h1>INVOICE</h1><p>{invoice.invoice_number}</p><span className="invoice-paid">PAID</span><p>Issued {invoiceDate(invoice.issued_at)}</p></div></div>
    <div className="invoice-parties"><section><h2>Billed to</h2><strong>{customer.name}</strong><p>{customer.email}<br/>{customer.phone}</p><p>{customer.address_line}<br/>{[customer.city,customer.state].filter(Boolean).join(', ')}</p></section><section><h2>Order & payment</h2><p>Order: {invoice.order_ref}</p><p>Payment: {invoice.payment_reference}</p><p>Method: Paystack</p></section></div>
    <div className="invoice-table-scroll"><table className="invoice-items"><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{invoice.items.map((item,index)=><tr key={index}><td>{index+1}</td><td>{item.name}</td><td>{item.quantity}</td><td>{invoiceMoney(item.unit_price)}</td><td>{invoiceMoney(item.line_total)}</td></tr>)}</tbody></table></div>
    <dl className="invoice-totals">{[['Subtotal',invoice.subtotal],['Total paid',invoice.total],['Balance due',0]].map(([label,amount])=><div key={label}><dt>{label}</dt><dd>{invoiceMoney(amount)}</dd></div>)}</dl>
    <div className="invoice-document-notes"><p>Payment received and verified through Paystack.</p><p>Product payment only. Delivery charges are arranged separately.</p><p>Thank you for shopping with Optimax.</p></div>
  </article>;
}
export default function Invoice() {
  const {orderId}=useParams();const {profile}=useSession();
  const query=useQuery(invoiceQuery,orderId);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  return <section className="container page invoice-page"><div className="invoice-toolbar"><Link className="text-link" to={profile?.role==='admin'?'/admin?tab=invoices':`/account/orders/${orderId}`}><ArrowLeft size={16} aria-hidden="true" />{profile?.role==='admin'?'Back to admin':'Back to order'}</Link>{query.data && <button className="button primary" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await downloadInvoice(query.data);}catch(error){setError(backendError(error));}finally{setBusy(false);}}}><Download size={16} aria-hidden="true" />{busy?'Preparing PDF…':'Download PDF'}</button>}</div>
  {error && <p role="alert">{error}</p>}
  {query.loading?<Skeleton variant="order" label="Loading your invoice…"/>:query.error?<div className="empty-state"><h1>Invoice unavailable</h1><p role="alert">{query.error}</p><button className="button secondary" onClick={query.refresh}>Try again</button></div>:<InvoiceDocument invoice={query.data}/>}
  </section>;
}
