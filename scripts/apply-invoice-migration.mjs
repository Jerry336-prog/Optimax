// Applies only the reviewed invoice migration; never charges or changes payment status.
import {readFile} from 'node:fs/promises';
const token=process.env.SUPABASE_ACCESS_TOKEN;
if(!/^sbp_[a-zA-Z0-9]+$/.test(token || '')) throw new Error('A Supabase personal access token is required in local .env.');
const ref=new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0];
if(!/^[a-z0-9]{20}$/.test(ref)) throw new Error('Invalid Supabase project reference.');
async function query(sql,readOnly=true){
 const result=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query:sql,read_only:readOnly}),signal:AbortSignal.timeout(30000)});
 if(!result.ok) throw new Error(`Supabase invoice migration request failed: HTTP ${result.status}.`);
 return result.json();
}
const paid=`o.payment_status='paid' and exists(select 1 from public.payment_sessions s where s.order_id=o.id and s.status='success' and s.amount=round(o.total*100)::bigint and s.currency='NGN')`;
const preflight=await query(`select count(*)::int as eligible,count(*) filter(where (select sum(i.quantity*i.unit_price) from public.order_items i where i.order_id=o.id)-o.discount is distinct from o.total)::int as inconsistent from public.orders o where ${paid}`);
console.log(`Verified historical paid orders: ${preflight[0].eligible}. Inconsistent order totals: ${preflight[0].inconsistent}.`);
if(preflight[0].inconsistent) throw new Error('Historical order totals need review before invoices can be issued. No migration applied.');
const referenceSchema=(await query("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='order_ref') as ready"))[0].ready;
if(!referenceSchema) await query(await readFile(new URL('../supabase/migrations/202611180001_paid_invoices.sql',import.meta.url),'utf8'),false);
// Preserve the latest invoice function when this setup command is rerun.
await query(await readFile(new URL('../supabase/migrations/202611180003_order_references.sql',import.meta.url),'utf8'),false);
console.log('Applied current automatic paid-invoice and order-reference setup.');
const result=await query(`select json_build_object(
 'invoice_count',(select count(*) from public.invoices),
 'missing_paid_invoices',(select count(*) from public.orders o where ${paid} and not exists(select 1 from public.invoices i where i.order_id=o.id)),
 'rls',(select relrowsecurity from pg_class where oid='public.invoices'::regclass),
 'customer_can_write',has_table_privilege('authenticated','public.invoices','INSERT,UPDATE,DELETE'),
 'anonymous_can_read',has_table_privilege('anon','public.invoices','SELECT'),
 'customer_can_issue',has_function_privilege('authenticated','public.create_paid_invoice(uuid)','EXECUTE'),
 'payment_trigger',exists(select 1 from pg_trigger where tgrelid='public.orders'::regclass and tgname='invoice_after_verified_payment' and tgenabled='O'),
 'immutable_trigger',exists(select 1 from pg_trigger where tgrelid='public.invoices'::regclass and tgname='preserve_invoice_snapshot' and tgenabled='O')
) as audit`);
const audit=result[0].audit;console.log(JSON.stringify(audit));
if(audit.missing_paid_invoices!==0 || !audit.rls || audit.customer_can_write || audit.anonymous_can_read || audit.customer_can_issue || !audit.payment_trigger || !audit.immutable_trigger)throw new Error('Live invoice audit did not pass.');
console.log('PASS live invoice generation, backfill coverage, RLS and immutability checks.');
