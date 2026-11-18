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
