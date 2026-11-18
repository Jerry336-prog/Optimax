// Synthetic fixture only; never inserted into the live database.
export const sampleInvoice = {
 id:'90000000-0000-4000-8000-000000000001',order_id:'30000000-0000-4000-8000-000000000001',
 order_ref:'OPT-20261118-000001',invoice_number:'OPT-SAMPLE-000001',issued_at:'2026-11-18T00:05:00+01:00',currency:'NGN',
 payment_reference:'optimax_sample_payment_reference',payment_method:'paystack',
 business_snapshot:{name:'Optimax Resources',address:'Shop 00, Lorem Plaza, 123 Example Road',area:'Ikeja, Lagos, Nigeria',email:'optimax@example.com',phone:'+234 000 000 0000'},
 customer_snapshot:{name:'Example Customer (sample)',email:'customer@example.com',phone:'+234 000 000 0000',address_line:'123 Example Street',city:'Lagos',state:'Lagos'},
 items:[{name:'Solar security camera kit (sample)',quantity:2,unit_price:85000,line_total:170000},{name:'Smart door lock (sample)',quantity:1,unit_price:120000,line_total:120000}],
 subtotal:290000,discount:0,total:290000,
};
