create table if not exists public.public_checkout_rate_limits (
  business_id uuid not null references public.businesses(id) on delete cascade,
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (business_id, ip_hash)
);
create index if not exists public_checkout_rate_limits_updated_at_idx
  on public.public_checkout_rate_limits(updated_at);

alter table public.public_checkout_rate_limits enable row level security;
revoke all on table public.public_checkout_rate_limits from public, anon, authenticated;
grant all on table public.public_checkout_rate_limits to service_role;

create or replace function public.consume_public_checkout_rate_limit(
  p_business_id uuid,
  p_ip_hash text,
  p_limit integer default 8,
  p_window_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path to public, pg_temp
as $function$
declare
  v_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Operación reservada al servicio de checkout.' using errcode = '42501';
  end if;
  if p_business_id is null
     or p_ip_hash is null
     or p_ip_hash !~ '^[0-9a-f]{64}$'
     or p_limit is null or p_limit < 1 or p_limit > 100
     or p_window_seconds is null or p_window_seconds < 30 or p_window_seconds > 86400 then
    raise exception 'Parámetros de límite de checkout inválidos.' using errcode = '22023';
  end if;

  insert into public.public_checkout_rate_limits as current_limit
    (business_id, ip_hash, window_started_at, request_count, updated_at)
  values (p_business_id, p_ip_hash, v_now, 1, v_now)
  on conflict (business_id, ip_hash) do update
    set request_count = case
          when current_limit.window_started_at <= v_now - make_interval(secs => p_window_seconds) then 1
          else least(current_limit.request_count + 1, p_limit + 1)
        end,
        window_started_at = case
          when current_limit.window_started_at <= v_now - make_interval(secs => p_window_seconds) then v_now
          else current_limit.window_started_at
        end,
        updated_at = v_now
  returning request_count into v_count;

  if random() < 0.01 then
    delete from public.public_checkout_rate_limits
    where updated_at < v_now - interval '2 days';
  end if;

  return v_count <= p_limit;
end;
$function$;

revoke all on function public.consume_public_checkout_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_checkout_rate_limit(uuid, text, integer, integer) to service_role;

revoke execute on function public.create_public_store_order(uuid, text, text, text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_public_store_order(uuid, text, text, text, text, text, jsonb, text) to service_role;
