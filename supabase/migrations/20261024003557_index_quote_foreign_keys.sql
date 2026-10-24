create index if not exists quote_items_quote_id_idx
  on public.quote_items (quote_id);
create index if not exists quotes_created_by_idx
  on public.quotes (created_by);
create index if not exists quotes_customer_id_idx
  on public.quotes (customer_id);
