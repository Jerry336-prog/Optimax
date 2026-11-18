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
