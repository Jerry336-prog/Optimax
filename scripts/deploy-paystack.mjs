// Deploy only the payment functions and their two server-side settings.
// Never upload the frontend .env wholesale or print credentials.
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const {SUPABASE_ACCESS_TOKEN:token,PAYSTACK_SECRET_KEY:key,APP_ORIGIN:origin,VITE_SUPABASE_URL:url}=process.env;
if(!/^sbp_[a-zA-Z0-9]+$/.test(token || '')) throw new Error('SUPABASE_ACCESS_TOKEN must be the generated personal access token beginning sbp_, not the token name or a project API key.');
if(!/^sk_(live|test)_[a-zA-Z0-9]+$/.test(key || '')) throw new Error('A valid PAYSTACK_SECRET_KEY is required.');
if(!origin || new URL(origin).origin!==origin) throw new Error('APP_ORIGIN must be an exact website origin without a trailing slash.');
const ref=new URL(url).hostname.split('.')[0];
if(!/^[a-z0-9]{20}$/.test(ref)) throw new Error('The Supabase project reference is invalid.');
const directory=await mkdtemp(join(tmpdir(),'optimax-payment-deploy-'));
function cli(args) {
  return new Promise((resolve,reject)=>{
    const child=spawn('npx',['--yes','supabase@3.2.0',...args,`--remote=${ref}`,'--yes'],{env:process.env,stdio:['ignore','pipe','pipe']});
    for(const stream of [child.stdout,child.stderr]) stream.on('data',data=>{
      const safe=data.toString().split(key).join('[REDACTED]').split(token).join('[REDACTED]');
      process.stdout.write(safe);
    });
    child.on('error',reject);
    child.on('exit',code=>code===0?resolve():reject(new Error(`Supabase CLI exited with code ${code}.`)));
  });
}
try {
  const file=join(directory,'payment.env');
  await writeFile(file,`PAYSTACK_SECRET_KEY=${key}\nAPP_ORIGIN=${origin}\n`,{mode:0o600});
  console.log('Uploading only PAYSTACK_SECRET_KEY and APP_ORIGIN to Supabase.');
  await cli(['secrets','set','--env-file',file]);
  await cli(['functions','deploy','paystack-init','paystack-verify','paystack-webhook','--use-api','--no-verify-jwt']);
  console.log('Payment functions deployed. Run npm run check:payments for read-only live checks.');
  console.log(`Paystack webhook URL: ${url}/functions/v1/paystack-webhook`);
} finally {await rm(directory,{recursive:true,force:true});}
