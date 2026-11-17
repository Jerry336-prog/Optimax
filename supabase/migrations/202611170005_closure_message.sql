-- Accept any non-empty closure message, without a character or word-count cap.
-- WhatsApp remains a separate contact field, stored in international digits format.
alter table public.site_settings drop constraint if exists store_closure_details;
alter table public.site_settings add constraint store_closure_details check (
 store_open or (length(trim(closure_reason))>0 and whatsapp ~ '^[0-9]{8,15}$')
);
