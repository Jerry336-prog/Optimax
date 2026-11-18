import {mkdir,writeFile,stat} from 'node:fs/promises';
const images=[
 ['foldable-solar-panel.webp','https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Foldable_solar_panel.webp/960px-Foldable_solar_panel.webp'],
 ['portable-power-station.jpg','https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Jackery_Explorer_300_Plus.jpg/960px-Jackery_Explorer_300_Plus.jpg'],
 ['smart-plug.jpg','https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Smart-plug.jpg/960px-Smart-plug.jpg'],
 ['smart-speaker.jpg','https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Echo_Dot_%283rd_Gen%29_01.jpg/960px-Echo_Dot_%283rd_Gen%29_01.jpg'],
];
await mkdir('public/demo-products',{recursive:true});
for(const [name,url] of images){
 const path=`public/demo-products/${name}`;
 try{if((await stat(path)).size>10000){console.log(`Already available: ${name}`);continue;}}catch{/* download missing file */}
 const response=await fetch(url,{headers:{'User-Agent':'OptimaxDemoCatalog/1.0 (local storefront development)'},signal:AbortSignal.timeout(30000)});
 if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))throw new Error(`Image download failed for ${name}: HTTP ${response.status}`);
 const data=new Uint8Array(await response.arrayBuffer());if(data.length>10000000 || data.length<10000)throw new Error(`Unexpected image size for ${name}`);
 await writeFile(path,data);console.log(`Downloaded ${name}: ${data.length} bytes`);
}
