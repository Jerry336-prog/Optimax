// Isolated authenticated test-mode initialization. Never submits or charges a payment.
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const env=process.env;
if(!env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_'))throw new Error('This check requires an active Paystack test secret.');
const url=env.VITE_SUPABASE_URL;const ref=new URL(url).hostname.split('.')[0];
const publicKey=env.VITE_SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_ANON_KEY;
async function request(target,options={}){const response=await fetch(target,{...options,signal:AbortSignal.timeout(25000)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(`QA request failed: HTTP ${response.status}; ${typeof data.error==='string'?data.error:data.msg||data.message||'request rejected'}`);return data;}
const managementHeaders={Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'};
async function sql(query){return request(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:managementHeaders,body:JSON.stringify({query,read_only:false})});}
const keys=await request(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`,{headers:managementHeaders});
const key=keys.find(k=>k.name==='service_role')?.api_key;if(!key)throw new Error('Server access required for isolated QA.');
const adminHeaders={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
const suffix=randomUUID();const email=`optimax-payment-qa-${suffix}@example.com`;const password=randomUUID()+randomUUID();let userId;const orderId=randomUUID();
try{
 const user=await request(`${url}/auth/v1/admin/users`,{method:'POST',headers:adminHeaders,body:JSON.stringify({email,password,email_confirm:true,user_metadata:{full_name:'Temporary payment QA'}})});userId=user.id;
 await sql(`insert into public.orders(id,user_id,total,address_snapshot) values('${orderId}','${userId}',100,'{"recipient":"Temporary test-mode checkout QA"}'::jsonb)`);
 const session=await request(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 const payment=await request(`${url}/functions/v1/paystack-init`,{method:'POST',headers:{apikey:publicKey,Authorization:`Bearer ${session.access_token}`,Origin:env.APP_ORIGIN,'Content-Type':'application/json','x-supabase-client-platform':'web'},body:JSON.stringify({order_id:orderId})});
 if(new URL(payment.authorization_url).origin!=='https://checkout.paystack.com')throw new Error('Unexpected checkout destination.');
 const transaction=await request(`https://api.paystack.co/transaction/verify/${encodeURIComponent(payment.reference)}`,{headers:{Authorization:`Bearer ${env.PAYSTACK_SECRET_KEY}`}});
 if(transaction.data?.domain!=='test'||transaction.data?.status==='success'||transaction.data?.amount!==10000)throw new Error('Unexpected test transaction state.');
 await writeFile('/tmp/optimax-test-checkout.json',JSON.stringify({authorization_url:payment.authorization_url,domain:transaction.data.domain,status:transaction.data.status}),{mode:0o600});
 console.log('PASS authenticated deployed-origin initialization → Paystack test checkout; correct ₦100 amount; no payment submitted.');
}finally{
 if(userId){
  await sql(`begin; delete from public.payment_sessions where order_id='${orderId}' and status='pending'; delete from public.orders where id='${orderId}' and user_id='${userId}' and payment_status in ('unpaid','pending'); commit;`);
  await request(`${url}/auth/v1/admin/users/${userId}`,{method:'DELETE',headers:adminHeaders});
  console.log('Temporary QA order, session and account removed. Existing customer orders and stock untouched.');
 }
}
