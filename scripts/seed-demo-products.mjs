// Adds only the fixed demo IDs. Existing products, orders and store status are preserved.
// Service credentials are read into memory and are never printed or written to files.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {demoProducts} from './data/demo-products.mjs';
const {VITE_SUPABASE_URL:url,SUPABASE_ACCESS_TOKEN:token}=process.env;
if(!/^sbp_[a-zA-Z0-9]+$/.test(token||''))throw new Error('A Supabase personal access token is required.');
const ref=new URL(url).hostname.split('.')[0];
if(!/^[a-z0-9]{20}$/.test(ref))throw new Error('Invalid project reference.');
async function management(path,options={}){
 const response=await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`Supabase management request failed: HTTP ${response.status}`);
 return response.json();
}
async function sql(query,readOnly=true){return management('/database/query',{method:'POST',body:JSON.stringify({query,read_only:readOnly})});}
const before=(await sql('select count(*)::int as products from public.products'))[0].products;
console.log(`Existing products: ${before}. Existing IDs will not be overwritten.`);
const keys=await management('/api-keys?reveal=true');
const key=keys.find(item=>item.name==='service_role')?.api_key || keys.find(item=>item.type==='secret' && item.api_key)?.api_key;
if(!key)throw new Error('A server-side storage key is not available for media upload. No catalog changes applied.');
const images=[...new Set(demoProducts.flatMap(p=>p.images))];
const mapping=new Map();
for(let offset=0;offset<images.length;offset+=4){
 await Promise.all(images.slice(offset,offset+4).map(async image=>{
  const bytes=await readFile(`public${image}`);
  const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const filename=image.split('/').pop().replaceAll(' ','-');const path=`demo-catalog/${hash}-${filename}`;
  const response=await fetch(`${url}/storage/v1/object/product-images/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':filename.endsWith('.png')?'image/png':filename.endsWith('.webp')?'image/webp':'image/jpeg','x-upsert':'false','Cache-Control':'public, max-age=31536000'},body:bytes,signal:AbortSignal.timeout(30000)});
  if(!response.ok){const body=await response.json().catch(()=>({}));if(!['409','Duplicate','ResourceAlreadyExists'].includes(String(body.statusCode)) && response.status!==409 && !/already exists|duplicate/i.test(body.message||''))throw new Error(`Storage upload failed for ${filename}: HTTP ${response.status}`);}
  mapping.set(image,`${url}/storage/v1/object/public/product-images/${path}`);
 }));
 console.log(`Prepared ${Math.min(offset+4,images.length)} / ${images.length} product images in Supabase Storage.`);
}
const products=demoProducts.map(product=>({...product,images:product.images.map(path=>mapping.get(path))}));
const encoded=JSON.stringify(products).replaceAll("'","''");
const insert=`insert into public.products(id,name,category,description,price,stock,images,specifications,active,created_at)
 select (p->>'id')::uuid,p->>'name',p->>'category',p->>'description',(p->>'price')::numeric,(p->>'stock')::integer,array(select jsonb_array_elements_text(p->'images')),p->'specifications',true,now()-((n-1)*interval '1 minute') from jsonb_array_elements('${encoded}'::jsonb) with ordinality as seed(p,n) on conflict(id) do nothing;`;
await sql(insert,false);
const ids=products.map(p=>`'${p.id}'::uuid`).join(',');
const audit=(await sql(`select json_build_object('demo_count',count(*),'stock_total',sum(stock),'minimum_stock',min(stock),'maximum_stock',max(stock),'supabase_images',bool_and(images[1] like '${url}/storage/v1/object/public/product-images/%'),'coupon_table_removed',to_regclass('public.coupons') is null,'legacy_checkout_removed',to_regprocedure('public.place_order(jsonb,uuid,uuid,text)') is null,'full_price_checkout',to_regprocedure('public.place_order(jsonb,uuid,uuid)') is not null,'store_open',(select store_open from public.site_settings where id='store')) as audit from public.products where id in (${ids})`))[0].audit;
console.log(JSON.stringify(audit));
if(audit.demo_count!==demoProducts.length || !audit.supabase_images || !audit.coupon_table_removed || !audit.legacy_checkout_removed || !audit.full_price_checkout)throw new Error('Catalog verification did not pass.');
console.log('PASS demo catalog inserted, Supabase-hosted images connected, and standard product galleries connected.');
