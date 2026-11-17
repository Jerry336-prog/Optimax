begin;
alter table public.profiles add column if not exists avatar_url text not null default '';
alter table public.profiles drop constraint if exists profile_avatar_url;
alter table public.profiles add constraint profile_avatar_url check (
 avatar_url='' or (length(avatar_url)<=2048 and avatar_url ~ '^https://[^[:space:]]+$')
);
grant update(avatar_url) on public.profiles to authenticated;
-- Public image delivery, but authenticated owners alone can upload/delete photos.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('profile-photos','profile-photos',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('product-images','product-images',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists optimax_profile_photo_read on storage.objects;
create policy optimax_profile_photo_read on storage.objects for select to authenticated using (
 bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text
);
drop policy if exists optimax_profile_photo_insert on storage.objects;
create policy optimax_profile_photo_insert on storage.objects for insert to authenticated with check (
 bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text
 and lower(storage.extension(name)) in ('jpg','png','webp')
);
drop policy if exists optimax_profile_photo_delete on storage.objects;
create policy optimax_profile_photo_delete on storage.objects for delete to authenticated using (
 bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text
);
drop policy if exists optimax_product_image_read on storage.objects;
create policy optimax_product_image_read on storage.objects for select to authenticated using (bucket_id='product-images' and public.is_admin());
drop policy if exists optimax_product_image_insert on storage.objects;
create policy optimax_product_image_insert on storage.objects for insert to authenticated with check (
 bucket_id='product-images' and public.is_admin() and (storage.foldername(name))[1]=auth.uid()::text
 and lower(storage.extension(name)) in ('jpg','png','webp')
);
drop policy if exists optimax_product_image_delete on storage.objects;
create policy optimax_product_image_delete on storage.objects for delete to authenticated using (bucket_id='product-images' and public.is_admin());
notify pgrst, 'reload schema';
commit;
