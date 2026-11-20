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
