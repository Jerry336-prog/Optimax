// Registers only this project's payment webhook. Does not charge, transfer or
// resend historical events, and leaves other webhook endpoints untouched.
const key=process.env.PAYSTACK_SECRET_KEY;
const webhook=`${process.env.VITE_SUPABASE_URL}/functions/v1/paystack-webhook`;
if(!key || !/^https:\/\/[a-z0-9]+\.supabase\.co\/functions\/v1\/paystack-webhook$/.test(webhook)) throw new Error('Valid Paystack and Supabase settings are required.');
async function api(path,options={}) {
 const response=await fetch(`https://api.paystack.co${path}`,{...options,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok || result.status!==true) throw new Error(`Paystack webhook API returned HTTP ${response.status}.`);
 return result;
}
let endpoint;let cursor;
do {
 const result=await api(`/integration/webhooks/endpoints?limit=50${cursor?`&next=${encodeURIComponent(cursor)}`:''}`);
 endpoint=result.data?.find(item=>item.webhook_url===webhook);
 cursor=result.meta?.next;
} while(!endpoint && cursor);
if(!endpoint) {
 endpoint=(await api('/integration/webhooks/endpoints',{method:'POST',body:JSON.stringify({name:'Optimax order payments',url:webhook,events:['charge.success']})})).data;
 console.log('Created Optimax successful-charge webhook endpoint.');
} else {
 const current=(await api(`/integration/webhooks/endpoints/${encodeURIComponent(endpoint.webhook_url_code)}`)).data;
 const events=Array.isArray(current.events)?current.events:Object.values(current.events || {}).flat();
 if(!current.enabled || !events.includes('charge.success')) {
  endpoint=(await api(`/integration/webhooks/endpoints/${encodeURIComponent(endpoint.webhook_url_code)}`,{method:'PATCH',body:JSON.stringify({enabled:true,events:[...new Set([...events,'charge.success'])]})})).data;
  console.log('Enabled successful-charge delivery for the existing Optimax webhook.');
 } else console.log('Optimax successful-charge webhook is already enabled.');
}
const verified=(await api(`/integration/webhooks/endpoints/${encodeURIComponent(endpoint.webhook_url_code)}`)).data;
const events=Array.isArray(verified.events)?verified.events:Object.values(verified.events || {}).flat();
if(!verified.enabled || verified.webhook_url!==webhook || !events.includes('charge.success')) throw new Error('Webhook registration did not verify.');
console.log('PASS webhook registered and subscribed to charge.success.');
const ping=(await api(`/integration/webhooks/endpoints/${encodeURIComponent(endpoint.webhook_url_code)}/ping`,{method:'POST'})).data;
console.log(`Paystack delivery ping: ${ping.ok ? 'PASS — webhook acknowledged delivery' : `FAIL — HTTP ${ping.http_status ?? 'unavailable'}`}`);
if(!ping.ok) process.exitCode=1;
