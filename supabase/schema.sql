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

begin;
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check(payment_status in ('unpaid','pending','paid','refunded'));
create table if not exists public.payment_sessions (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 reference text not null unique,amount bigint not null check(amount>0),currency text not null default 'NGN' check(currency='NGN'),
 status text not null default 'pending' check(status in ('pending','success','failed')),authorization_url text,
 provider_id bigint unique,created_at timestamptz not null default now(),paid_at timestamptz
);
create unique index if not exists one_pending_payment_per_order on public.payment_sessions(order_id) where status='pending';
alter table public.payment_sessions enable row level security;
revoke all on public.payment_sessions from anon,authenticated;
grant select on public.payment_sessions to authenticated;
grant select,update on public.payment_sessions to service_role;
grant select on public.orders to service_role;
drop policy if exists payment_owner_read on public.payment_sessions;
create policy payment_owner_read on public.payment_sessions for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create or replace function public.begin_payment(p_order uuid,p_user uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; s public.payment_sessions%rowtype;
begin
 select * into o from public.orders where id=p_order and user_id=p_user for update;
 if not found then raise exception 'Order not available.'; end if;
 if o.status='cancelled' or o.payment_status='refunded' then raise exception 'This order cannot be paid.'; end if;
 if o.payment_status='paid' then return jsonb_build_object('paid',true,'order_id',o.id); end if;
 if o.total<=0 then raise exception 'No online payment is required for this order.'; end if;
 select * into s from public.payment_sessions where order_id=o.id and status='pending';
 if not found then
  insert into public.payment_sessions(order_id,reference,amount) values(o.id,'optimax_'||replace(gen_random_uuid()::text,'-',''),round(o.total*100)::bigint) returning * into s;
 end if;
 update public.orders set payment_status='pending',payment_method='paystack' where id=o.id;
 return jsonb_build_object('paid',false,'reference',s.reference,'amount',s.amount,'currency',s.currency,'authorization_url',s.authorization_url,'order_id',o.id);
end $$;
revoke all on function public.begin_payment(uuid,uuid) from public,anon,authenticated;
grant execute on function public.begin_payment(uuid,uuid) to service_role;
create or replace function public.complete_payment(p_reference text,p_provider_id bigint,p_amount bigint,p_currency text) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.payment_sessions%rowtype; o public.orders%rowtype;
begin
 select * into s from public.payment_sessions where reference=p_reference;
 if not found then raise exception 'Unknown payment reference.'; end if;
 select * into o from public.orders where id=s.order_id for update;
 select * into s from public.payment_sessions where reference=p_reference for update;
 if s.amount<>p_amount or p_currency<>'NGN' or s.currency<>p_currency or round(o.total*100)::bigint<>p_amount then raise exception 'Payment amount or currency does not match.'; end if;
 if s.status='success' then
  if s.provider_id<>p_provider_id then raise exception 'Payment identity does not match.'; end if;
  return o.id;
 end if;
 if o.status='cancelled' or o.payment_status='refunded' then raise exception 'This payment needs manual reconciliation.'; end if;
 if o.payment_status='paid' then raise exception 'This order has already been paid.'; end if;
 update public.payment_sessions set status='success',provider_id=p_provider_id,paid_at=now() where id=s.id;
 update public.orders set payment_status='paid',payment_method='paystack' where id=o.id;
 insert into public.notifications(user_id,title,body,order_id) values(o.user_id,'Payment confirmed','Your Paystack payment has been verified.',o.id);
 return o.id;
end $$;
revoke all on function public.complete_payment(text,bigint,bigint,text) from public,anon,authenticated;
grant execute on function public.complete_payment(text,bigint,bigint,text) to service_role;
create or replace function public.fail_payment(p_reference text) returns void language plpgsql security definer set search_path='' as $$
declare s public.payment_sessions%rowtype; o public.orders%rowtype;
begin
 select * into s from public.payment_sessions where reference=p_reference;
 if not found then return; end if;
 select * into o from public.orders where id=s.order_id for update;
 select * into s from public.payment_sessions where reference=p_reference for update;
 if s.status<>'pending' or o.payment_status='paid' then return; end if;
 update public.payment_sessions set status='failed' where id=s.id;
 update public.orders set payment_status='unpaid' where id=o.id;
end $$;
revoke all on function public.fail_payment(text) from public,anon,authenticated;
grant execute on function public.fail_payment(text) to service_role;
commit;

begin;
create table if not exists public.account_role_events (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references auth.users(id) on delete set null,
 target_id uuid references auth.users(id) on delete set null,
 previous_role text not null,new_role text not null,
 created_at timestamptz not null default now()
);
alter table public.account_role_events enable row level security;
revoke all on public.account_role_events from anon,authenticated;
grant select on public.account_role_events to authenticated;
drop policy if exists role_events_admin_read on public.account_role_events;
create policy role_events_admin_read on public.account_role_events for select to authenticated using(public.is_admin());
-- All role changes share a transaction lock so concurrent demotions cannot
-- both observe another administrator and remove the final administrator.
create or replace function public.set_account_role(p_user uuid,p_role text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target public.profiles%rowtype; actor uuid:=auth.uid();
begin
 perform pg_advisory_xact_lock(hashtextextended('optimax-account-role-management',0));
 if actor is null or not public.is_admin() then raise exception 'Administrator access required.'; end if;
 if p_role is null or p_role not in ('admin','customer') then raise exception 'Choose a valid account role.'; end if;
 select * into target from public.profiles where id=p_user for update;
 if not found then raise exception 'Account not found.'; end if;
 if target.role=p_role then return jsonb_build_object('id',target.id,'role',target.role); end if;
 if target.role='admin' and p_role='customer' and (select count(*) from public.profiles where role='admin')<=1 then
  raise exception 'At least one administrator must remain. Promote another account before demoting this administrator.';
 end if;
 update public.profiles set role=p_role where id=p_user;
 insert into public.account_role_events(actor_id,target_id,previous_role,new_role) values(actor,p_user,target.role,p_role);
 return jsonb_build_object('id',p_user,'role',p_role);
end $$;
revoke all on function public.set_account_role(uuid,text) from public,anon;
grant execute on function public.set_account_role(uuid,text) to authenticated;
notify pgrst, 'reload schema';
commit;

-- Store closure preserves account access and settlement of existing payments.
alter table public.site_settings add column if not exists store_open boolean not null default true;
alter table public.site_settings add column if not exists closure_reason text not null default '';
alter table public.site_settings drop constraint if exists store_closure_details;
alter table public.site_settings add constraint store_closure_details check (
 store_open or (length(trim(closure_reason))>0 and whatsapp ~ '^[0-9]{8,15}$')
);
grant update(store_open,closure_reason) on public.site_settings to authenticated;
create or replace function public.place_order(p_items jsonb,p_address uuid,p_request_key uuid,p_coupon text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_address jsonb; v_total numeric:=0; v_discount numeric:=0; v_coupon public.coupons%rowtype; r record; p public.products%rowtype;
begin
 if v_user is null then raise exception 'Please sign in to place an order.'; end if;
 if p_request_key is null then raise exception 'Missing order request identifier.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||p_request_key::text,0));
 select id into v_id from public.orders where user_id=v_user and request_key=p_request_key;
 if found then return v_id; end if;
 perform 1 from public.site_settings where id='store' and store_open for share;
 if not found then raise exception 'The store is temporarily closed. Please contact our team on WhatsApp.'; end if;
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
create or replace function public.begin_payment(p_order uuid,p_user uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; s public.payment_sessions%rowtype;
begin
 select * into o from public.orders where id=p_order and user_id=p_user for update;
 if not found then raise exception 'Order not available.'; end if;
 if o.status='cancelled' or o.payment_status='refunded' then raise exception 'This order cannot be paid.'; end if;
 if o.payment_status='paid' then return jsonb_build_object('paid',true,'order_id',o.id); end if;
 
 perform 1 from public.site_settings where id='store' and store_open for share;
 if not found then raise exception 'The store is temporarily closed. Please contact our team on WhatsApp.'; end if;
 if o.total<=0 then raise exception 'No online payment is required for this order.'; end if;
 select * into s from public.payment_sessions where order_id=o.id and status='pending';
 if not found then
  insert into public.payment_sessions(order_id,reference,amount) values(o.id,'optimax_'||replace(gen_random_uuid()::text,'-',''),round(o.total*100)::bigint) returning * into s;
 end if;
 update public.orders set payment_status='pending',payment_method='paystack' where id=o.id;
 return jsonb_build_object('paid',false,'reference',s.reference,'amount',s.amount,'currency',s.currency,'authorization_url',s.authorization_url,'order_id',o.id);
end $$;
revoke all on function public.begin_payment(uuid,uuid) from public,anon,authenticated;
grant execute on function public.begin_payment(uuid,uuid) to service_role;

-- Accept any non-empty closure message, without a character or word-count cap.
-- WhatsApp remains a separate contact field, stored in international digits format.
alter table public.site_settings drop constraint if exists store_closure_details;
alter table public.site_settings add constraint store_closure_details check (
 store_open or (length(trim(closure_reason))>0 and whatsapp ~ '^[0-9]{8,15}$')
);

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

begin;
create sequence if not exists public.invoice_number_seq;
revoke all on sequence public.invoice_number_seq from public,anon,authenticated,service_role;
create table if not exists public.invoices (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.orders(id),
 user_id uuid not null references auth.users(id),
 invoice_number text not null unique,
 issued_at timestamptz not null,
 created_at timestamptz not null default now(),
 currency text not null default 'NGN' check(currency='NGN'),
 subtotal numeric(16,2) not null check(subtotal>=0),
 discount numeric(16,2) not null check(discount>=0),
 total numeric(16,2) not null check(total>=0 and total=subtotal-discount),
 items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items)>0),
 customer_snapshot jsonb not null,
 business_snapshot jsonb not null,
 payment_reference text not null,
 payment_method text not null default 'paystack'
);
alter table public.invoices enable row level security;
revoke all on public.invoices from anon,authenticated,service_role;
grant select on public.invoices to authenticated,service_role;
drop policy if exists invoice_owner_admin_read on public.invoices;
create policy invoice_owner_admin_read on public.invoices for select to authenticated using(user_id=auth.uid() or public.is_admin());
create or replace function public.create_paid_invoice(p_order uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; pay public.payment_sessions%rowtype; v_id uuid; v_items jsonb; v_subtotal numeric; v_customer jsonb; v_business jsonb;
begin
 select * into o from public.orders where id=p_order for update;
 if not found or o.payment_status<>'paid' then raise exception 'An invoice requires a verified paid order.'; end if;
 select id into v_id from public.invoices where order_id=o.id;
 if found then return v_id; end if;
 select * into pay from public.payment_sessions where order_id=o.id and status='success' and amount=round(o.total*100)::bigint and currency='NGN' order by paid_at,id limit 1;
 if not found then raise exception 'An invoice requires a verified payment.'; end if;
 select jsonb_agg(jsonb_build_object('product_id',i.product_id,'name',i.product_name,'quantity',i.quantity,'unit_price',i.unit_price,'line_total',i.quantity*i.unit_price) order by i.id),sum(i.quantity*i.unit_price) into v_items,v_subtotal from public.order_items i where i.order_id=o.id;
 if v_items is null or v_subtotal-o.discount<>o.total then raise exception 'Invoice totals do not match the order.'; end if;
 select o.address_snapshot || jsonb_build_object('name',coalesce(nullif(o.address_snapshot->>'recipient',''),nullif(p.full_name,''),'Customer'),'email',coalesce(u.email,'')) into v_customer from auth.users u left join public.profiles p on p.id=u.id where u.id=o.user_id;
 select jsonb_build_object('name','Optimax Resources','email',s.email,'phone',s.phone,'address',s.address,'area',s.area) into v_business from public.site_settings s where s.id='store';
 insert into public.invoices(order_id,user_id,invoice_number,issued_at,subtotal,discount,total,items,customer_snapshot,business_snapshot,payment_reference)
 values(o.id,o.user_id,'OPT-'||to_char(coalesce(pay.paid_at,now()) at time zone 'Africa/Lagos','YYYY')||'-'||lpad(nextval('public.invoice_number_seq')::text,6,'0'),coalesce(pay.paid_at,now()),v_subtotal,o.discount,o.total,v_items,coalesce(v_customer,o.address_snapshot),coalesce(v_business,jsonb_build_object('name','Optimax Resources')),pay.reference) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.create_paid_invoice(uuid) from public,anon,authenticated,service_role;
create or replace function public.invoice_after_verified_payment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.create_paid_invoice(new.id);
 return new;
end $$;
revoke all on function public.invoice_after_verified_payment() from public,anon,authenticated,service_role;
drop trigger if exists invoice_after_verified_payment on public.orders;
create trigger invoice_after_verified_payment after update of payment_status on public.orders for each row when(new.payment_status='paid' and old.payment_status is distinct from 'paid') execute function public.invoice_after_verified_payment();
create or replace function public.preserve_invoice_snapshot() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Issued invoices cannot be changed or deleted.'; end $$;
revoke all on function public.preserve_invoice_snapshot() from public,anon,authenticated,service_role;
drop trigger if exists preserve_invoice_snapshot on public.invoices;
create trigger preserve_invoice_snapshot before update or delete on public.invoices for each row execute function public.preserve_invoice_snapshot();
-- Backfill only historical orders with successful, matching verified payments.
do $$ declare r record; begin
 for r in select o.id from public.orders o where o.payment_status='paid' and not exists(select 1 from public.invoices i where i.order_id=o.id) and exists(select 1 from public.payment_sessions s where s.order_id=o.id and s.status='success' and s.amount=round(o.total*100)::bigint and s.currency='NGN') loop
  perform public.create_paid_invoice(r.id);
 end loop;
end $$;
notify pgrst,'reload schema';
commit;

begin;
-- Retain historical order/invoice amounts; no coupon feature remains available.
drop function if exists public.place_order(jsonb,uuid,uuid,text);
drop table if exists public.coupons;
create or replace function public.place_order(p_items jsonb,p_address uuid,p_request_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_address jsonb; v_total numeric:=0; r record; p public.products%rowtype;
begin
 if v_user is null then raise exception 'Please sign in to place an order.'; end if;
 if p_request_key is null then raise exception 'Missing order request identifier.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||p_request_key::text,0));
 select id into v_id from public.orders where user_id=v_user and request_key=p_request_key;
 if found then return v_id; end if;
 perform 1 from public.site_settings where id='store' and store_open for share;
 if not found then raise exception 'The store is temporarily closed. Please contact our team on WhatsApp.'; end if;
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
 insert into public.orders(user_id,total,address_snapshot,request_key) values(v_user,v_total,v_address,p_request_key) returning id into v_id;
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
revoke all on function public.place_order(jsonb,uuid,uuid) from public,anon;
grant execute on function public.place_order(jsonb,uuid,uuid) to authenticated;

notify pgrst,'reload schema';
commit;

begin;
alter table public.orders add column if not exists order_ref text;
create table if not exists public.order_reference_counters (
 reference_date date primary key,
 last_number bigint not null check(last_number>0)
);
alter table public.order_reference_counters enable row level security;
revoke all on public.order_reference_counters from public,anon,authenticated,service_role;
-- Assign references to historical orders in creation order, in Lagos local time.
with numbered as (
 select id,to_char(created_at at time zone 'Africa/Lagos','YYYYMMDD') as day,
 row_number() over(partition by (created_at at time zone 'Africa/Lagos')::date order by created_at,id) as serial
 from public.orders
) update public.orders o set order_ref='OPT-'||n.day||'-'||lpad(n.serial::text,greatest(6,length(n.serial::text)),'0') from numbered n where n.id=o.id and o.order_ref is null;
insert into public.order_reference_counters(reference_date,last_number)
 select (created_at at time zone 'Africa/Lagos')::date,max(substring(order_ref from 14)::bigint) from public.orders group by 1
on conflict(reference_date) do update set last_number=greatest(public.order_reference_counters.last_number,excluded.last_number);
alter table public.orders alter column order_ref set not null;
create unique index if not exists orders_order_reference_unique on public.orders(order_ref);
alter table public.orders drop constraint if exists orders_order_reference_format;
alter table public.orders add constraint orders_order_reference_format check(order_ref ~ '^OPT-[0-9]{8}-[0-9]{6,}$');
create or replace function public.assign_order_reference() returns trigger language plpgsql security definer set search_path='' as $$
declare v_day date; v_number bigint;
begin
 new.created_at:=coalesce(new.created_at,now());
 v_day:=(new.created_at at time zone 'Africa/Lagos')::date;
 insert into public.order_reference_counters(reference_date,last_number) values(v_day,1)
 on conflict(reference_date) do update set last_number=public.order_reference_counters.last_number+1 returning last_number into v_number;
 new.order_ref:='OPT-'||to_char(v_day,'YYYYMMDD')||'-'||lpad(v_number::text,greatest(6,length(v_number::text)),'0');
 return new;
end $$;
revoke all on function public.assign_order_reference() from public,anon,authenticated,service_role;
drop trigger if exists assign_order_reference on public.orders;
create trigger assign_order_reference before insert on public.orders for each row execute function public.assign_order_reference();
create or replace function public.preserve_order_reference() returns trigger language plpgsql set search_path='' as $$
begin
 if new.order_ref is distinct from old.order_ref then raise exception 'An order reference cannot be changed.'; end if;
 return new;
end $$;
revoke all on function public.preserve_order_reference() from public,anon,authenticated,service_role;
drop trigger if exists preserve_order_reference on public.orders;
create trigger preserve_order_reference before update of order_ref on public.orders for each row execute function public.preserve_order_reference();
alter table public.invoices add column if not exists order_ref text;
-- This one-time metadata backfill preserves every issued amount and invoice number.
-- Both trigger changes and the update are atomic within this transaction.
drop trigger if exists preserve_invoice_snapshot on public.invoices;
update public.invoices i set order_ref=o.order_ref from public.orders o where o.id=i.order_id and i.order_ref is null;
alter table public.invoices alter column order_ref set not null;
create trigger preserve_invoice_snapshot before update or delete on public.invoices for each row execute function public.preserve_invoice_snapshot();
create or replace function public.create_paid_invoice(p_order uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; pay public.payment_sessions%rowtype; v_id uuid; v_items jsonb; v_subtotal numeric; v_customer jsonb; v_business jsonb;
begin
 select * into o from public.orders where id=p_order for update;
 if not found or o.payment_status<>'paid' then raise exception 'An invoice requires a verified paid order.'; end if;
 select id into v_id from public.invoices where order_id=o.id;
 if found then return v_id; end if;
 select * into pay from public.payment_sessions where order_id=o.id and status='success' and amount=round(o.total*100)::bigint and currency='NGN' order by paid_at,id limit 1;
 if not found then raise exception 'An invoice requires a verified payment.'; end if;
 select jsonb_agg(jsonb_build_object('product_id',i.product_id,'name',i.product_name,'quantity',i.quantity,'unit_price',i.unit_price,'line_total',i.quantity*i.unit_price) order by i.id),sum(i.quantity*i.unit_price) into v_items,v_subtotal from public.order_items i where i.order_id=o.id;
 if v_items is null or v_subtotal-o.discount<>o.total then raise exception 'Invoice totals do not match the order.'; end if;
 select o.address_snapshot || jsonb_build_object('name',coalesce(nullif(o.address_snapshot->>'recipient',''),nullif(p.full_name,''),'Customer'),'email',coalesce(u.email,'')) into v_customer from auth.users u left join public.profiles p on p.id=u.id where u.id=o.user_id;
 select jsonb_build_object('name','Optimax Resources','email',s.email,'phone',s.phone,'address',s.address,'area',s.area) into v_business from public.site_settings s where s.id='store';
 insert into public.invoices(order_id,user_id,order_ref,invoice_number,issued_at,subtotal,discount,total,items,customer_snapshot,business_snapshot,payment_reference)
 values(o.id,o.user_id,o.order_ref,'OPT-'||to_char(coalesce(pay.paid_at,now()) at time zone 'Africa/Lagos','YYYY')||'-'||lpad(nextval('public.invoice_number_seq')::text,6,'0'),coalesce(pay.paid_at,now()),v_subtotal,o.discount,o.total,v_items,coalesce(v_customer,o.address_snapshot),coalesce(v_business,jsonb_build_object('name','Optimax Resources')),pay.reference) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.create_paid_invoice(uuid) from public,anon,authenticated,service_role;

do $$ declare r record; begin
 for r in select o.id from public.orders o where o.payment_status='paid' and not exists(select 1 from public.invoices i where i.order_id=o.id) and exists(select 1 from public.payment_sessions s where s.order_id=o.id and s.status='success' and s.amount=round(o.total*100)::bigint and s.currency='NGN') loop
  perform public.create_paid_invoice(r.id);
 end loop;
end $$;
notify pgrst,'reload schema';
commit;

begin;
-- Retain each demo product and its normal cover image, stock and pricing.
update public.products
set name = regexp_replace(name, '^360 Demo', 'Demo'),
    description = 'Demo product for preview. Pricing, specifications and stock are sample data. Original illustrative product render, not real product photography.',
    specifications = specifications - 'Preview'
where id in ('d3e00000-0000-4000-8000-000000000025','d3e00000-0000-4000-8000-000000000026','d3e00000-0000-4000-8000-000000000027')
  and name like '360 Demo%';
alter table public.products drop column if exists spin_images;
notify pgrst, 'reload schema';
commit;

begin;
create or replace function public.add_product_stock(p_product uuid,p_quantity integer)
returns integer language plpgsql security definer set search_path='' as $$
declare remaining integer;
begin
 if not public.is_admin() then raise exception 'Only administrators can add stock.' using errcode='42501'; end if;
 if p_quantity is null or p_quantity < 1 then raise exception 'Enter a positive whole number of units.'; end if;
 update public.products set stock=stock+p_quantity where id=p_product returning stock into remaining;
 if not found then raise exception 'Product not found.'; end if;
 return remaining;
end;
$$;
revoke all on function public.add_product_stock(uuid,integer) from public,anon;
grant execute on function public.add_product_stock(uuid,integer) to authenticated;
notify pgrst,'reload schema';
commit;
