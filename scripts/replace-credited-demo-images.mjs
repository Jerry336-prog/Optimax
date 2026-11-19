// Replace only the two attributed demo photographs; preserve product and order data.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {VITE_SUPABASE_URL:url,SUPABASE_ACCESS_TOKEN:token}=process.env;
const ref=new URL(url).hostname.split('.')[0];
async function management(path,options={}){const r=await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`Supabase request failed: HTTP ${r.status}`);return r.json();}
const keys=await management('/api-keys?reveal=true');const key=keys.find(k=>k.name==='service_role')?.api_key;if(!key)throw new Error('Storage service access is required.');
const replacements=[];
for(const [old,filename] of [['portable-power-station.jpg','power-station-original.jpg'],['smart-plug.jpg','smart-plug-original.jpg']]){
 const bytes=await readFile(`public/demo-products/${filename}`);const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);const path=`demo-catalog/${hash}-${filename}`;
 const r=await fetch(`${url}/storage/v1/object/product-images/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'image/jpeg','x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(30000)});
 if(!r.ok){const b=await r.json().catch(()=>({}));if(r.status!==409&&!/already exists|duplicate/i.test(b.message||''))throw new Error(`Image upload failed: HTTP ${r.status}`);}
 replacements.push({old,url:`${url}/storage/v1/object/public/product-images/${path}`});
}
const cases=replacements.map(r=>`when image like '%-${r.old}' or image='/demo-products/${r.old}' then '${r.url}'`).join(' ');
const query=`begin; update public.products set images=array(select case ${cases} else image end from unnest(images) with ordinality as img(image,n) order by n) where exists(select 1 from unnest(images) image where image like '%-portable-power-station.jpg' or image like '%-smart-plug.jpg' or image in ('/demo-products/portable-power-station.jpg','/demo-products/smart-plug.jpg')); commit; select count(*)::int as remaining_credited_photo_references from public.products where exists(select 1 from unnest(images) image where image like '%-portable-power-station.jpg' or image like '%-smart-plug.jpg');`;
const result=await management('/database/query',{method:'POST',body:JSON.stringify({query,read_only:false})});console.log(JSON.stringify(result));
console.log('Original demo illustrations uploaded; active product image references replaced. Prices, stock, IDs and order snapshots preserved.');
