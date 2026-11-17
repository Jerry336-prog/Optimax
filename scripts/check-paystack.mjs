import { createHmac } from "node:crypto";
// Read-only: never initializes a transaction, creates an order or charges money.
const env = process.env;
const key = env.PAYSTACK_SECRET_KEY;
const url = env.VITE_SUPABASE_URL;
const publicKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const origin = env.APP_ORIGIN || 'http://127.0.0.1:5173';
let ready = true;
function report(ok, label, detail) { if (!ok) ready = false; console.log(`${ok ? 'OK' : 'NOT READY'} ${label}: ${detail}`); }
async function request(target, options) {
  const result = await fetch(target, {...options, signal:AbortSignal.timeout(12000)});
  const data = await result.json().catch(()=>({}));
  return {status:result.status,data,headers:result.headers};
}
report(/^sk_(test|live)_/.test(key || ''),'Paystack secret',key ? key.startsWith('sk_live_') ? 'live mode (no charges performed)' : key.startsWith('sk_test_') ? 'test mode' : 'invalid key format' : 'missing');
report(!!env.APP_ORIGIN,'Callback origin',env.APP_ORIGIN ? 'configured locally' : 'APP_ORIGIN is missing; preflight check uses local development origin');
if (Object.keys(env).some(name=>name.startsWith('VITE_') && /SECRET|SERVICE_ROLE/.test(name))) report(false,'Frontend secrets','A server secret uses a VITE_ prefix. Remove that frontend exposure.');
const checks=[];
if (key) checks.push((async()=>{
  try {
    const result=await request('https://api.paystack.co/bank?country=nigeria&perPage=1',{headers:{Authorization:`Bearer ${key}`}});
    report(result.status===200 && result.data.status===true,'Paystack API authentication',`HTTP ${result.status}; ${result.data.status ? 'accepted' : 'not accepted'}`);
  } catch {report(false,'Paystack API authentication','connection failed');}
})());
if(url && publicKey) for(const name of ['paystack-init','paystack-verify','paystack-webhook']) checks.push((async()=>{
  try {
    const result=await request(`${url}/functions/v1/${name}`,{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json',...(name==='paystack-webhook'?{}:{Origin:origin})},body:'{}'});
    const message=typeof result.data.error==='string'?result.data.error:'';
    const expected=name==='paystack-webhook'?result.status===401 && message==='Invalid signature.':result.status===400 && /sign in/i.test(message);
    const detail=result.status===404?'not deployed':message==='Invalid signature.'?'invalid webhook signatures rejected':/sign in/i.test(message)?'unauthenticated payment requests rejected':message==='Online payments are not configured yet. Please contact Optimax.'?'PAYSTACK_SECRET_KEY missing on hosted function':message==='The store callback origin is not configured.'?'APP_ORIGIN missing on hosted function':message==='Origin not allowed.'?'frontend origin does not match hosted APP_ORIGIN':`HTTP ${result.status}; unexpected configuration or response`;
    report(expected,name,detail);
    if(name!=='paystack-webhook') {
      const preflight=await fetch(`${url}/functions/v1/${name}`,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,apikey,content-type'},signal:AbortSignal.timeout(12000)});
      report(preflight.ok && preflight.headers.get('access-control-allow-origin')===origin,`${name} browser CORS`,`HTTP ${preflight.status}`);
    }
  } catch { report(false,name,'connection failed'); }
})());
else report(false,'Supabase connection','frontend URL/public key missing');
if (url && publicKey && key) checks.push((async()=>{
 try {
  const body=JSON.stringify({event:'ping',data:{source:'optimax-read-only-health-check'}});
  const signature=createHmac('sha512',key).update(body).digest('hex');
  const result=await request(`${url}/functions/v1/paystack-webhook`,{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json','x-paystack-signature':signature},body});
  report(result.status===200 && result.data.received===true,'Signed webhook ping','HTTP '+result.status+' (no transaction processed)');
 } catch {report(false,'Signed webhook ping','connection failed');}
})());
await Promise.all(checks);
if(!ready) process.exitCode=1;
