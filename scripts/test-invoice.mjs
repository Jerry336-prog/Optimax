import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createInvoicePDF} from '../src/lib/invoicePdf.js';
import {validateInvoice,invoiceMoney,INVOICE_WATERMARK} from '../src/lib/invoice.js';
import {sampleInvoice} from './fixtures/invoice.mjs';
assert.equal(validateInvoice(sampleInvoice),sampleInvoice);
for(const change of [{total:1},{subtotal:1},{payment_reference:''},{currency:'USD'},{items:[]},{items:[{quantity:1,unit_price:1,line_total:5}]}])assert.throws(()=>validateInvoice({...sampleInvoice,...change}));
assert.equal(invoiceMoney(290000),'NGN 290,000.00');
assert.equal(INVOICE_WATERMARK.text,'OPTIMAX');assert.equal(INVOICE_WATERMARK.angle,-24);assert.equal(INVOICE_WATERMARK.opacity,.075);
const preview=createInvoicePDF(sampleInvoice);
assert.equal(preview.getNumberOfPages(),1);
const items=Array.from({length:100},(_,i)=>({name:`Sample item ${i+1}: Smart security equipment with mounting accessories, installation kit and extended product information`,quantity:3,unit_price:12345.67,line_total:37037.01}));
const subtotal=Number((items.reduce((sum,item)=>sum+Math.round(item.line_total*100),0)/100).toFixed(2));
const long={...sampleInvoice,invoice_number:'OPT-SAMPLE-PAGINATION',items,subtotal,discount:0,total:subtotal};
const paginated=createInvoicePDF(long);
assert.ok(paginated.getNumberOfPages()>2);
assert.ok(Buffer.from(preview.output('arraybuffer')).subarray(0,5).toString()==='%PDF-');
if(process.argv.includes('--write-preview')){
 await mkdir('output/pdf',{recursive:true});
 await writeFile('output/pdf/optimax-invoice-preview.pdf',Buffer.from(preview.output('arraybuffer')));
 await writeFile('output/pdf/optimax-invoice-pagination.pdf',Buffer.from(paginated.output('arraybuffer')));
 console.log(`Wrote sample PDFs: 1 page and ${paginated.getNumberOfPages()} pages.`);
}
console.log('PASS invoice validation, currency totals, native PDF export and multi-page layout');
