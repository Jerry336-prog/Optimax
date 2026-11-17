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
