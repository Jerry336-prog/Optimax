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
