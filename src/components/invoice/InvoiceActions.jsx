import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download } from 'lucide-react';
import { downloadInvoice, invoiceQuery } from '../../services/invoices';
import { backendError } from '../../lib/supabase';
export default function InvoiceActions({orderId}) {
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  return <div className="invoice-actions"><div className="inline-actions">
    <Link className="button secondary" to={`/invoices/${orderId}`}><FileText size={16} aria-hidden="true" /> View invoice</Link>
    <button className="button secondary" disabled={busy} onClick={async()=>{if(busy)return;setBusy(true);setError('');try{await downloadInvoice(await invoiceQuery(orderId));}catch(error){setError(backendError(error));}finally{setBusy(false);}}}><Download size={16} aria-hidden="true" />{busy?'Preparing PDF…':'Download invoice'}</button>
  </div>{error && <p role="alert">{error}</p>}</div>;
}
