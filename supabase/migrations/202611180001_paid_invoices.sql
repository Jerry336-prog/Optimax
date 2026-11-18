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
