// Adds customer-facing references without changing internal IDs or financial records.
import {readFile} from 'node:fs/promises';
const {VITE_SUPABASE_URL:url,SUPABASE_ACCESS_TOKEN:token}=process.env;
if(!/^sbp_[a-zA-Z0-9]+$/.test(token||''))throw new Error('A Supabase personal access token is required.');
const ref=new URL(url).hostname.split('.')[0];
async function query(sql,readOnly=true){const response=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query:sql,read_only:readOnly}),signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`Order-reference migration failed: HTTP ${response.status}`);return response.json();}
const fingerprint=`select json_build_object('orders',coalesce((select md5(string_agg((to_jsonb(o)-'order_ref')::text,'' order by id)) from public.orders o),''),'invoices',coalesce((select json_agg(json_build_object('id',i.id,'digest',md5((to_jsonb(i)-'order_ref')::text)) order by i.id) from public.invoices i),'[]'::json)) as fingerprint`;
const before=(await query(fingerprint))[0].fingerprint;
await query(await readFile(new URL('../supabase/migrations/202611180003_order_references.sql',import.meta.url),'utf8'),false);
const after=(await query(fingerprint))[0].fingerprint;
const afterInvoices=new Map(after.invoices.map(invoice=>[invoice.id,invoice.digest]));
if(before.orders!==after.orders || !before.invoices.every(invoice=>afterInvoices.get(invoice.id)===invoice.digest))throw new Error('Financial snapshots changed unexpectedly; review required.');
const audit=(await query(`select json_build_object('orders',(select count(*) from public.orders),'missing_references',(select count(*) from public.orders where order_ref is null),'duplicate_references',(select count(*) from(select order_ref from public.orders group by 1 having count(*)>1) x),'invoice_reference_mismatches',(select count(*) from public.invoices i join public.orders o on o.id=i.order_id where i.order_ref is distinct from o.order_ref),'counter_rls',(select relrowsecurity from pg_class where oid='public.order_reference_counters'::regclass),'customer_can_change_counters',has_table_privilege('authenticated','public.order_reference_counters','INSERT,UPDATE,DELETE'),'example_order_reference',(select order_ref from public.orders where id='5d4fa682-bc00-49a5-bc48-d4d622faa448'::uuid)) as audit`))[0].audit;
console.log(JSON.stringify(audit));
if(audit.missing_references || audit.duplicate_references || audit.invoice_reference_mismatches || !audit.counter_rls || audit.customer_can_change_counters)throw new Error('Order reference audit did not pass.');
console.log('PASS live order references and invoice links; all existing IDs, amounts and snapshots preserved.');
