import assert from 'node:assert/strict';
import {validateProfilePhoto,avatarUrl,avatarInitials,safeAvatarUrl} from '../src/lib/avatar.js';
import {saveProfileWithPhoto,ownedAvatarPath} from '../src/lib/profilePhoto.js';
const user='00000000-0000-4000-8000-000000000001';
const base='https://project.supabase.co/storage/v1/object/public/profile-photos/';
const file=new File(['photo'],'photo.jpg',{type:'image/jpeg'});
assert.equal(validateProfilePhoto(file),file);
for(const bad of [{type:'image/svg+xml',size:10},{type:'image/png',size:0},{type:'image/png',size:6*1024*1024}]) assert.throws(()=>validateProfilePhoto(bad));
assert.equal(avatarInitials('  Ada  Smith '),'AS');
assert.equal(avatarUrl({avatar_url:''},{user_metadata:{avatar_url:base+'old.jpg'}}),'');
assert.equal(avatarUrl(null,{user_metadata:{avatar_url:base+'old.jpg'}}),base+'old.jpg');
for(const url of ['javascript:alert(1)','http://example.com/photo.jpg','https://user:pass@example.com/photo.jpg']) assert.equal(safeAvatarUrl(url),'');
assert.equal(ownedAvatarPath(base+'other/photo.jpg',base,user),null);
assert.equal(ownedAvatarPath('https://other.example/'+user+'/photo.jpg',base,user),null);
function fake({saveError=false,uploadError=false,cleanupError=false}={}) {
  const events=[];
  let updates;
  const bucket={
    async upload(path,body,options){events.push(['upload',path,body,options]);return {error:uploadError?new Error('Upload failed'):null};},
    getPublicUrl(path){return {data:{publicUrl:base+path}};},
    async remove(paths){events.push(['remove',...paths]);return {error:cleanupError?new Error('Cleanup failed'):null};},
  };
  const client = {
    storage: { from(name) { assert.equal(name,'profile-photos'); return bucket; } },
    from(name) {
      assert.equal(name,'profiles');
      const chain = {
        update(values) { updates=values; return chain; },
        eq(column,id) { assert.equal(column,'id'); assert.equal(id,user); return chain; },
        select() { return chain; },
        async single() { events.push(['save']); return {data:{id:user,...updates},error:saveError?new Error('Save failed'):null}; },
      };
      return chain;
    },
  };
  return {client,events,get updates(){return updates;}};
}
let mock=fake();
let result=await saveProfileWithPhoto(mock.client,user,{file,values:{full_name:'Ada'},previousUrl:base+user+'/old.jpg'});
assert.equal(mock.updates.full_name,'Ada');
assert.ok(result.profile.avatar_url.startsWith(base+user+'/'));
assert.equal(mock.events[0][3].upsert,false);
assert.deepEqual(mock.events.map(e=>e[0]),['upload','save','remove']);
assert.equal(mock.events[2][1],user+'/old.jpg');
mock=fake({saveError:true});
await assert.rejects(()=>saveProfileWithPhoto(mock.client,user,{file,previousUrl:base+user+'/old.jpg'}),/Save failed/);
assert.deepEqual(mock.events.map(e=>e[0]),['upload','save','remove']);
assert.equal(mock.events[2][1],mock.events[0][1]);
assert.notEqual(mock.events[2][1],user+'/old.jpg');
mock=fake({uploadError:true});
await assert.rejects(()=>saveProfileWithPhoto(mock.client,user,{file}),/Upload failed/);
assert.deepEqual(mock.events.map(e=>e[0]),['upload']);
mock=fake();
result=await saveProfileWithPhoto(mock.client,user,{remove:true,previousUrl:base+user+'/old.jpg'});
assert.equal(result.profile.avatar_url,'');
assert.deepEqual(mock.events.map(e=>e[0]),['save','remove']);
mock=fake();
await saveProfileWithPhoto(mock.client,user,{remove:true,previousUrl:base+'other/old.jpg'});
assert.deepEqual(mock.events.map(e=>e[0]),['save']);
mock=fake({cleanupError:true});
assert.match((await saveProfileWithPhoto(mock.client,user,{remove:true,previousUrl:base+user+'/old.jpg'})).cleanupWarning,/profile is saved/);
console.log('PASS photo validation, avatar normalization, safe fallbacks, unique storage uploads, profile rollback cleanup and owned-file removal');
