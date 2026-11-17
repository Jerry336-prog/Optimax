import assert from 'node:assert/strict';
import { validateAuth, authError, authDestination } from '../src/lib/auth.js';
assert.deepEqual(validateAuth('register',{name:'  ',email:'bad',password:'123'}),{
  name:'Enter your full name.',email:'Enter a valid email address, such as you@example.com.',password:'Use at least 8 characters for your password.'
});
assert.deepEqual(validateAuth('register',{name:'Customer',email:'user@example.com',password:'password123'}),{});
assert.deepEqual(validateAuth('login',{email:'user@example.com',password:'short'}),{});
assert.equal(validateAuth('login',{email:'user@example.com',password:''}).password,'Enter your password.');
assert.equal(validateAuth('reset',{password:'password123',confirm:'different'}).confirm,'The passwords do not match.');
assert.deepEqual(validateAuth('forgot',{email:'user@example.com'}),{});
assert.match(authError({code:'invalid_credentials'}),/email or password is incorrect/);
assert.match(authError({message:'Invalid login credentials'}),/email or password is incorrect/);
assert.match(authError({code:'email_not_confirmed'}),/Confirm your email/);
assert.match(authError({code:'weak_password'}),/too weak/);
assert.match(authError({message:'Failed to fetch'}),/Check your internet/);
assert.equal(authError({message:'Custom server message'}),'Custom server message');
assert.equal(authDestination('register',{session:{}},'/checkout').path,'/');
assert.match(authDestination('register',{session:null}).notice,/confirmation link/);
assert.equal(authDestination('login',{}).path,'/');
assert.equal(authDestination('login',{},'/checkout?coupon=SAVE10').path,'/checkout?coupon=SAVE10');
for(const path of ['https://evil.example','//evil.example','/\\evil.example','/%2Fevil.example','/\nevil.example'])
  assert.equal(authDestination('login',{},path).path,'/');
console.log('PASS auth field validation, credential errors, confirmation notices, homepage redirects and safe return paths');
