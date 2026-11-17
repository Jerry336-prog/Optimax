function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
function checkoutUrl(value) {
  const url = new URL(value);
  if (url.origin !== 'https://checkout.paystack.com' || url.username || url.password)
    throw new Error('Paystack returned an unexpected checkout URL.');
  return url.href;
}
export async function initializePayment(client, user, orderId, origin, paystack) {
  const session = checked(await client.rpc('begin_payment', {p_order:orderId,p_user:user.id}));
  if(session.paid) return {paid:true,order_id:orderId};
  if(!Number.isSafeInteger(Number(session.amount)) || Number(session.amount)<=0 || session.currency!=='NGN')
    throw new Error('The order amount is invalid. Please contact the store.');
  if(session.authorization_url) return {authorization_url:checkoutUrl(session.authorization_url),reference:session.reference};
  const transaction = await paystack('/transaction/initialize', {
    method:'POST', body:JSON.stringify({
      email:user.email,amount:Number(session.amount),currency:'NGN',reference:session.reference,
      callback_url:new URL('/payment/return',origin).href,
      metadata:{order_id:orderId,user_id:user.id},
    }),
  });
  const url=checkoutUrl(transaction.authorization_url);
  // Initialization may already have succeeded at Paystack. A cache-write failure
  // must not discard the customer's checkout URL; reconciliation uses reference.
  try {
    const saved=await client.from('payment_sessions').update({authorization_url:url}).eq('reference',session.reference).eq('status','pending');
    if(saved.error) console.warn('Checkout link cache was not saved. Payment verification remains available.');
  } catch { console.warn('Checkout link cache was not saved. Payment verification remains available.'); }
  return {authorization_url:url,reference:session.reference};
}
