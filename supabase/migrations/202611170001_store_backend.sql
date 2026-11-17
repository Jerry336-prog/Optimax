begin;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', role text not null default 'customer' check(role in ('customer','admin')),
 phone text not null default '', notifications_enabled boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists notifications_enabled boolean not null default true;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),name text not null check(length(trim(name)) between 1 and 180),
 category text not null check(category in ('cameras','smart-locks','solar-energy','smart-home')),
 description text not null default '',price numeric(12,2) not null check(price>=0),stock integer not null default 0 check(stock>=0),
 images text[] not null default '{}',specifications jsonb not null default '{}',active boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.products add column if not exists spin_images text[] not null default '{}';
create table if not exists public.addresses (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 label text not null check(length(trim(label)) between 1 and 80),address_line text not null check(length(trim(address_line)) between 5 and 500),
 city text not null check(length(trim(city)) between 1 and 100),state text not null check(length(trim(state)) between 1 and 100),
 recipient text not null default '',phone text not null default '',created_at timestamptz not null default now()
);
alter table public.addresses add column if not exists recipient text not null default '';
alter table public.addresses add column if not exists phone text not null default '';
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 status text not null default 'pending' check(status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
 total numeric(12,2) not null check(total>=0),created_at timestamptz not null default now()
);
alter table public.orders add column if not exists address_snapshot jsonb not null default '{}';
alter table public.orders add column if not exists payment_status text not null default 'unpaid' check(payment_status in ('unpaid','paid','refunded'));
alter table public.orders add column if not exists payment_method text not null default 'arrange_with_store';
alter table public.orders add column if not exists discount numeric(12,2) not null default 0;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists request_key uuid;
alter table public.orders add column if not exists tracking_number text not null default '';
create unique index if not exists orders_idempotency_idx on public.orders(user_id,request_key);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),product_id uuid not null references public.products(id),
 quantity integer not null check(quantity>0),unit_price numeric(12,2) not null check(unit_price>=0)
);
alter table public.order_items add column if not exists product_name text not null default '';
alter table public.order_items add column if not exists image text not null default '';
create table if not exists public.saved_products (
 user_id uuid not null references auth.users(id) on delete cascade,product_id uuid not null references public.products(id) on delete cascade,
 kind text not null check(kind in ('wishlist','recently-viewed')),created_at timestamptz not null default now(),primary key(user_id,product_id,kind)
);
create table if not exists public.carts (
 user_id uuid primary key references auth.users(id) on delete cascade,items jsonb not null default '[]' check(jsonb_typeof(items)='array' and jsonb_array_length(items)<=100),
 updated_at timestamptz not null default now()
);
create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 title text not null,body text not null,order_id uuid references public.orders(id),read_at timestamptz,created_at timestamptz not null default now()
);
create table if not exists public.tracking_events (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),status text not null,
 note text not null default '',created_at timestamptz not null default now()
);
create table if not exists public.coupons (
 code text primary key check(code=upper(code) and length(code) between 3 and 32),percent integer not null check(percent between 1 and 100),
 active boolean not null default true,expires_at timestamptz,minimum numeric(12,2) not null default 0 check(minimum>=0)
);
create table if not exists public.enquiries (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 100),email text not null check(length(email)<=254),
 topic text not null check(length(topic)<=200),message text not null check(length(trim(message)) between 10 and 2000),
 resolved boolean not null default false,created_at timestamptz not null default now()
);
create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),product_id uuid not null references public.products(id),
 rating integer not null check(rating between 1 and 5),body text not null check(length(trim(body)) between 10 and 2000),
 approved boolean not null default false,created_at timestamptz not null default now(),unique(user_id,product_id)
);
create table if not exists public.site_settings (
 id text primary key check(id='store'),email text not null default 'optimax@example.com',phone text not null default '+234 (0) 000 000 0000',
 address text not null default 'Shop 00, Lorem Plaza, 123 Example Road',area text not null default 'Ikeja, Lagos, Nigeria',
 hours text not null default 'Monday – Saturday · 9:00 am – 6:00 pm',note text not null default 'Sample contact details and opening hours for design preview.',
 whatsapp text not null default '' check(whatsapp='' or whatsapp ~ '^[0-9]{8,15}$')
);
insert into public.site_settings(id) values('store') on conflict(id) do nothing;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
 begin insert into public.profiles(id,full_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),100)) on conflict(id) do nothing; return new; end;
$$;
revoke all on function public.handle_new_user() from public,anon,authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
insert into public.profiles(id) select id from auth.users on conflict(id) do nothing;
-- Lock down each app table, including policies from the initial foundation.
do $$ declare t text; p record; begin
 foreach t in array array['profiles','products','addresses','orders','order_items','saved_products','carts','notifications','tracking_events','coupons','enquiries','reviews','site_settings'] loop
  execute format('alter table public.%I enable row level security',t);
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop execute format('drop policy %I on public.%I',p.policyname,t); end loop;
  execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end $$;
grant select on public.products,public.reviews,public.site_settings to anon,authenticated;
grant select on public.profiles,public.addresses,public.orders,public.order_items,public.saved_products,public.carts,public.notifications,public.tracking_events,public.coupons,public.enquiries to authenticated;
grant insert,update,delete on public.products,public.addresses,public.saved_products,public.carts,public.coupons to authenticated;
grant update(full_name,phone,notifications_enabled) on public.profiles to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant insert on public.enquiries,public.reviews to authenticated;
grant update(resolved) on public.enquiries to authenticated;
grant update(approved) on public.reviews to authenticated;
grant update(email,phone,address,area,hours,note,whatsapp) on public.site_settings to authenticated;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profile_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy product_read on public.products for select using(active or public.is_admin());
create policy product_admin on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy own_addresses on public.addresses for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_saved on public.saved_products for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_cart on public.carts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy order_read on public.orders for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy items_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy tracking_read on public.tracking_events for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy notification_read on public.notifications for select to authenticated using(user_id=auth.uid());
create policy notification_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy coupons_admin on public.coupons for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy enquiry_read on public.enquiries for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy enquiry_insert on public.enquiries for insert to authenticated with check(user_id=auth.uid() and resolved=false);
create policy enquiry_resolve on public.enquiries for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy review_read on public.reviews for select using(approved or user_id=auth.uid() or public.is_admin());
create policy review_submit on public.reviews for insert to authenticated with check(user_id=auth.uid() and approved=false and exists(select 1 from public.orders o join public.order_items i on i.order_id=o.id where o.user_id=auth.uid() and o.status='delivered' and i.product_id=reviews.product_id));
create policy review_moderate on public.reviews for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy settings_read on public.site_settings for select using(true);
create policy settings_admin on public.site_settings for update to authenticated using(public.is_admin()) with check(public.is_admin());
-- Prices, discounts and stock are resolved inside one transaction, never trusted from the browser.
create or replace function public.place_order(p_items jsonb,p_address uuid,p_request_key uuid,p_coupon text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_address jsonb; v_total numeric:=0; v_discount numeric:=0; v_coupon public.coupons%rowtype; r record; p public.products%rowtype;
begin
 if v_user is null then raise exception 'Please sign in to place an order.'; end if;
 if p_request_key is null then raise exception 'Missing order request identifier.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||p_request_key::text,0));
 select id into v_id from public.orders where user_id=v_user and request_key=p_request_key;
 if found then return v_id; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Your bag is invalid.'; end if;
 if jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>100 then raise exception 'Your bag must contain 1 to 100 products.'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) x where (x->>'quantity') is null or (x->>'quantity')!~'^[1-9][0-9]{0,3}$' or (x->>'id') is null) then raise exception 'Invalid product quantity.'; end if;
 select to_jsonb(a)-'user_id'-'id'-'created_at' into v_address from public.addresses a where id=p_address and user_id=v_user;
 if v_address is null then raise exception 'Choose one of your saved delivery addresses.'; end if;
 -- Deterministic lock order prevents competing carts from taking locks in opposite order.
 for r in select (x->>'id')::uuid as id,sum((x->>'quantity')::int)::int as quantity from jsonb_array_elements(p_items) x group by 1 order by 1 loop
  select * into p from public.products where id=r.id for update;
  if not found or not p.active then raise exception 'A product in your bag is no longer available.'; end if;
  if p.stock<r.quantity then raise exception 'Not enough stock for %. Only % available.',p.name,p.stock; end if;
  v_total:=v_total+(p.price*r.quantity);
 end loop;
 if trim(coalesce(p_coupon,''))<>'' then
  select * into v_coupon from public.coupons where code=upper(trim(p_coupon)) and active and (expires_at is null or expires_at>now()) for share;
  if not found or v_total<v_coupon.minimum then raise exception 'This coupon is unavailable or the minimum order value has not been met.'; end if;
  v_discount:=round(v_total*v_coupon.percent/100,2);
 end if;
 insert into public.orders(user_id,total,address_snapshot,discount,coupon_code,request_key) values(v_user,v_total-v_discount,v_address,v_discount,case when v_coupon.code is null then null else v_coupon.code end,p_request_key) returning id into v_id;
 for r in select (x->>'id')::uuid as id,sum((x->>'quantity')::int)::int as quantity from jsonb_array_elements(p_items) x group by 1 order by 1 loop
  select * into p from public.products where id=r.id;
  insert into public.order_items(order_id,product_id,quantity,unit_price,product_name,image) values(v_id,p.id,r.quantity,p.price,p.name,coalesce(p.images[1],''));
  update public.products set stock=stock-r.quantity where id=p.id;
 end loop;
 insert into public.tracking_events(order_id,status,note) values(v_id,'pending','Order received. The store will confirm delivery and payment arrangements.');
 insert into public.notifications(user_id,title,body,order_id) values(v_user,'Order received','Your order is awaiting store confirmation.',v_id);
 delete from public.carts where user_id=v_user;
 return v_id;
end $$;
revoke all on function public.place_order(jsonb,uuid,uuid,text) from public,anon;
grant execute on function public.place_order(jsonb,uuid,uuid,text) to authenticated;
create or replace function public.update_order(p_order uuid,p_status text,p_note text default '',p_tracking text default '') returns void language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; r record;
begin
 select * into o from public.orders where id=p_order for update;
 if not found or auth.uid() is null or (not public.is_admin() and o.user_id<>auth.uid()) then raise exception 'Order not available.'; end if;
 if not public.is_admin() and (p_status<>'cancelled' or o.status<>'pending') then raise exception 'Only pending orders can be cancelled by the customer.'; end if;
 if p_status=o.status then return; end if;
 if not ((o.status='pending' and p_status in ('confirmed','cancelled')) or (o.status='confirmed' and p_status in ('processing','cancelled')) or (o.status='processing' and p_status in ('shipped','cancelled')) or (o.status='shipped' and p_status='delivered')) then raise exception 'That order status transition is not allowed.'; end if;
 if p_status='cancelled' and o.payment_status<>'unpaid' then raise exception 'Verify any pending payment or arrange a refund before cancelling.'; end if;
 if p_status='cancelled' then
  for r in select product_id,quantity from public.order_items where order_id=p_order order by product_id loop update public.products set stock=stock+r.quantity where id=r.product_id; end loop;
 end if;
 update public.orders set status=p_status,tracking_number=case when public.is_admin() then left(p_tracking,100) else tracking_number end where id=p_order;
 insert into public.tracking_events(order_id,status,note) values(p_order,p_status,left(p_note,500));
 insert into public.notifications(user_id,title,body,order_id) values(o.user_id,'Order update', 'Your order is now '||p_status||'.',p_order);
end $$;
revoke all on function public.update_order(uuid,text,text,text) from public,anon;
grant execute on function public.update_order(uuid,text,text,text) to authenticated;
create or replace function public.notify_customer(p_user uuid,p_title text,p_body text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Administrator access required.'; end if;
 if length(trim(p_title)) not between 1 and 120 or length(trim(p_body)) not between 1 and 1000 then raise exception 'Enter a title and message.'; end if;
 insert into public.notifications(user_id,title,body) values(p_user,trim(p_title),trim(p_body));
end $$;
revoke all on function public.notify_customer(uuid,text,text) from public,anon;
grant execute on function public.notify_customer(uuid,text,text) to authenticated;
-- No browser-side payment-status setter. A verified payment provider integration is required.
create index if not exists products_category_idx on public.products(category) where active;
create index if not exists orders_user_idx on public.orders(user_id,created_at desc);
create index if not exists addresses_user_idx on public.addresses(user_id);
create index if not exists notifications_user_idx on public.notifications(user_id,created_at desc);
create index if not exists tracking_order_idx on public.tracking_events(order_id,created_at);
create index if not exists items_order_idx on public.order_items(order_id);
commit;
