// Read-only webhook registration lookup. No transactions or event resends.
const url = `${process.env.VITE_SUPABASE_URL}/functions/v1/paystack-webhook`;
try {
 const response=await fetch('https://api.paystack.co/integration/webhooks/endpoints?limit=50',{headers:{Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`},signal:AbortSignal.timeout(15000)});
 if(response.status===403) {console.log('Paystack webhook endpoint API unavailable for this account. Configure the dashboard webhook URL manually.');process.exitCode=1;}
 else if(!response.ok) {console.log(`Webhook registration lookup unavailable: HTTP ${response.status}`);process.exitCode=1;}
 else {const result=await response.json();const endpoint=result.data?.find(item=>item.webhook_url===url);console.log(endpoint?.enabled?'Webhook endpoint is registered and enabled.':'No enabled matching webhook endpoint found.');if(!endpoint?.enabled)process.exitCode=1;}
 console.log(`Required webhook URL: ${url}`);
} catch {console.log('Webhook registration lookup connection failed.');process.exitCode=1;}
