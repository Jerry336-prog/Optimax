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
