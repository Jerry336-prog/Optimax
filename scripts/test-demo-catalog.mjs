import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {demoProducts} from './data/demo-products.mjs';
assert.equal(demoProducts.length,27);assert.equal(new Set(demoProducts.map(p=>p.id)).size,27);
const counts={};
for(const product of demoProducts){
 counts[product.category]=(counts[product.category]||0)+1;
 assert.ok(Number.isInteger(product.stock)&&product.stock>=20&&product.stock<=120);
 assert.ok(product.price>0&&product.active);
 assert.match(product.description,/Demo product/);assert.equal(product.specifications['Listing type'],'Demo product');
 for(const image of product.images){assert.ok(image.startsWith('/'));assert.ok((await stat('public'+image)).size>0);}
}
assert.deepEqual(counts,{cameras:9,'smart-locks':6,'solar-energy':7,'smart-home':5});
console.log('PASS 27 unique demo products, category coverage, stock quantities, sample labels and local image files');
