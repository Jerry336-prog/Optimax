// Read-only live schema/privilege checks. Does not select customer data.
const ref=new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0];
const token=process.env.SUPABASE_ACCESS_TOKEN;
if(!token) throw new Error('Supabase access token is required for this schema audit.');
const query=`select json_build_object(
 'payment_sessions',to_regclass('public.payment_sessions') is not null,
 'functions',coalesce((select json_agg(json_build_object('name',p.proname,'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),'customer_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),'server_execute',has_function_privilege('service_role',p.oid,'EXECUTE'))) from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname='public' and p.proname in ('begin_payment','complete_payment','fail_payment')),'[]'::json),
 'closure_guard',exists(select 1 from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname='public' and p.proname='begin_payment' and p.prosrc like '%store_open%'),
 'payment_rls',exists(select 1 from pg_class where oid=to_regclass('public.payment_sessions') and relrowsecurity)
) as audit`;
try {
 const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query,read_only:true}),signal:AbortSignal.timeout(20000)});
 if(!r.ok) {console.log(`Database schema audit unavailable: HTTP ${r.status}`);process.exitCode=1;}
 else {const data=await r.json();const audit=data[0]?.audit;console.log(JSON.stringify(audit));const okay=audit?.payment_sessions && audit?.payment_rls && audit?.closure_guard && audit.functions.length===3 && audit.functions.every(f=>!f.anon_execute&&!f.customer_execute&&f.server_execute);console.log(okay?'PASS live payment schema and server-only RPC permissions':'NOT READY live payment schema or permissions');if(!okay)process.exitCode=1;}
} catch {console.log('Database schema audit connection failed.');process.exitCode=1;}
