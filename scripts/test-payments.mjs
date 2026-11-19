import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  validSignature,
  validatePayment,
  validatePaymentIdentity,
  validUUID,
} from "../supabase/functions/_shared/validation.js";
const secret = "local-test-secret";
const raw = JSON.stringify({
  event: "charge.success",
  data: { reference: "test" },
});
const signature = createHmac("sha512", secret).update(raw).digest("hex");
assert.equal(await validSignature(raw, signature, secret), true);
assert.equal(await validSignature(`${raw} `, signature, secret), false);
assert.equal(await validSignature(raw, "bad", secret), false);
assert.equal(await validSignature(raw, signature, "wrong-secret"), false);
console.log("PASS webhook HMAC signature, tampering and incorrect secrets");
const session = {
  reference: "optimax_test",
  amount: 50000,
  currency: "NGN",
  order_id: "order-id",
};
const payment = {
  status: "success",
  reference: session.reference,
  amount: 50000,
  currency: "NGN",
  metadata: { order_id: session.order_id },
  id: 100,
};
assert.equal(validatePayment(payment, session).providerId, 100);
for (const tampered of [
  { ...payment, amount: 1 },
  { ...payment, currency: "USD" },
  { ...payment, status: "pending" },
  { ...payment, reference: "other" },
  { ...payment, metadata: { order_id: "other" } },
  { ...payment, id: "invalid" },
])
  assert.throws(() => validatePayment(tampered, session));
console.log(
  "PASS payment status, amount, currency, order, reference and transaction ID checks",
);
assert.equal(validUUID("00000000-0000-4000-8000-000000000001"), true);
assert.equal(validUUID("bad"), false);
console.log("PASS order ID validation");

const { reconcilePayment } = await import('../supabase/functions/_shared/reconciliation.js');
for (const status of ['pending','ongoing','abandoned','processing','queued','reversed']) {
  const outcome=await reconcilePayment({...payment,status},session,()=>assert.fail('must not mark pending paid'),()=>assert.fail('must not mark pending failed'));
  assert.equal(outcome.status,'pending');
}
let failed;
assert.equal((await reconcilePayment({...payment,status:'failed'},session,()=>assert.fail('must not pay failed'),ref=>{failed=ref;})).status,'failed');
assert.equal(failed,session.reference);
for (const mismatch of [{amount:1},{reference:'other'},{currency:'USD'},{metadata:{order_id:'other'}}]) {
  assert.throws(()=>validatePaymentIdentity({...payment,...mismatch},session));
  await assert.rejects(()=>reconcilePayment({...payment,...mismatch,status:'failed'},session,()=>assert.fail('must not pay mismatch'),()=>assert.fail('must not fail mismatch')));
}
let recorded;
assert.equal((await reconcilePayment(payment,session,p=>{recorded=p;return session.order_id;},()=>assert.fail('must not fail paid'))).status,'paid');
assert.equal(recorded.amount,50000);
console.log('PASS pending/abandoned states remain unconfirmed; failed transactions require matching details; successful payments reconcile');

const {initializePayment}=await import('../supabase/functions/_shared/initialization.js');
const initSession={paid:false,reference:'optimax_fixed',amount:50000,currency:'NGN'};
function initClient(options={}) {
  let cached;
  const chain={update(value){cached=value;return chain;},eq(){return chain;},then(resolve){return Promise.resolve({error:options.cacheFailure?{message:'Unavailable'}:null}).then(resolve);}};
  return {get cached(){return cached;},rpc:async(name,args)=>{assert.equal(name,'begin_payment');assert.equal(args.p_user,'customer');return {data:{...initSession,...options.session},error:options.denied?{message:'Store closed'}:null};},from:name=>{assert.equal(name,'payment_sessions');return chain;}};
}
let init=initClient();let payload;
const initiated=await initializePayment(init,{id:'customer',email:'test@example.invalid'},'order-id','http://127.0.0.1:5173',async(path,options)=>{assert.equal(path,'/transaction/initialize');payload=JSON.parse(options.body);return {authorization_url:'https://checkout.paystack.com/test-code'};});
assert.equal(payload.amount,50000);assert.equal(payload.callback_url,'http://127.0.0.1:5173/payment/return');assert.equal(payload.metadata.order_id,'order-id');
assert.equal(initiated.authorization_url,init.cached.authorization_url);
const resumed=await initializePayment(initClient({session:{authorization_url:initiated.authorization_url}}),{id:'customer'},'order-id','http://127.0.0.1:5173',()=>assert.fail('must reuse existing checkout'));
assert.equal(resumed.authorization_url,initiated.authorization_url);
assert.equal((await initializePayment(initClient({session:{paid:true}}),{id:'customer'},'order-id','http://127.0.0.1:5173',()=>assert.fail('already paid'))).paid,true);
await assert.rejects(()=>initializePayment(initClient({denied:true}),{id:'customer'},'order-id','http://127.0.0.1:5173',()=>assert.fail('must not contact Paystack when DB denies')),/Store closed/);
await assert.rejects(()=>initializePayment(initClient(),{id:'customer'},'order-id','http://127.0.0.1:5173',async()=>({authorization_url:'https://evil.example/checkout'})),/unexpected checkout URL/);
console.log('PASS server-priced initialization, callback metadata, paid-order handling, checkout reuse and closed-store rejection');

const { paymentOrigin, paymentCors } = await import('../supabase/functions/_shared/paymentConfig.js');
const deployedOrigin = 'https://optimax-eight.vercel.app';
assert.equal(paymentOrigin(deployedOrigin, deployedOrigin, 'http://127.0.0.1:5173'), deployedOrigin);
assert.equal(paymentOrigin('http://127.0.0.1:5173', deployedOrigin, 'http://127.0.0.1:5173'), 'http://127.0.0.1:5173');
assert.equal(paymentOrigin(null, deployedOrigin), deployedOrigin);
assert.throws(() => paymentOrigin('https://evil.example', deployedOrigin), /Origin not allowed/);
assert.throws(() => paymentOrigin('https://optimax-eight.vercel.app.evil.example', deployedOrigin), /Origin not allowed/);
assert.throws(() => paymentOrigin(null, 'https://example.com/path'), /invalid/);
assert.ok(paymentCors(deployedOrigin)['Access-Control-Allow-Headers'].includes('x-supabase-client-platform'));
assert.equal(paymentCors(deployedOrigin)['Access-Control-Allow-Origin'], deployedOrigin);
console.log('PASS deployed/local exact origin allowlist, callback selection, and Supabase browser headers');
