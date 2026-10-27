-- Platform subscription operations for treseiscinco.
-- All administrative APIs are guarded in PostgreSQL. Never expose service_role credentials to the browser.

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;
grant select on public.platform_admins to authenticated;
drop policy if exists platform_admins_read_self on public.platform_admins;
create policy platform_admins_read_self on public.platform_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Initial platform administrator is explicitly allow-listed here, not derived from user-editable profile metadata.
insert into public.platform_admins(user_id)
select id from auth.users where lower(email)=lower('riwiswell@gmail.com')
on conflict(user_id) do nothing;

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.platform_admins pa where pa.user_id=(select auth.uid())
  );
$$;
revoke all on function public.is_platform_admin() from public,anon;
grant execute on function public.is_platform_admin() to authenticated;

create table if not exists public.platform_user_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  last_seen_at timestamptz not null default now(),
  visit_count integer not null default 1 check (visit_count>0),
  is_standalone boolean not null default false,
  platform text,
  primary key(user_id,activity_date)
);
create index if not exists platform_user_activity_last_seen_idx on public.platform_user_activity(last_seen_at desc);
alter table public.platform_user_activity enable row level security;
revoke all on public.platform_user_activity from anon,authenticated;

create table if not exists public.platform_install_registry (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_seen_installed_at timestamptz not null default now(),
  last_seen_installed_at timestamptz not null default now(),
  platform text,
  source text not null default 'standalone_detection',
  updated_at timestamptz not null default now()
);
alter table public.platform_install_registry enable row level security;
revoke all on public.platform_install_registry from anon,authenticated;

create table if not exists public.platform_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  subscription_id uuid references public.business_subscriptions(id) on delete set null,
  billing_interval text not null check (billing_interval in ('month','quarter','year')),
  amount_minor bigint not null check (amount_minor>0),
  currency_code char(3) not null default 'COP' check (currency_code ~ '^[A-Z]{3}$'),
  payment_method text not null check (payment_method in ('Nequi','Transferencia bancaria','Efectivo','Wompi manual','Tarjeta manual','Otro')),
  external_reference text,
  status text not null default 'confirmed' check (status in ('pending','confirmed','rejected','refunded')),
  received_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists platform_subscription_payments_business_created_idx on public.platform_subscription_payments(business_id,created_at desc);
create index if not exists platform_subscription_payments_status_idx on public.platform_subscription_payments(status,received_at desc);
create unique index if not exists platform_subscription_payments_reference_unique
  on public.platform_subscription_payments(lower(payment_method),lower(trim(external_reference)))
  where external_reference is not null and trim(external_reference)<>'';
alter table public.platform_subscription_payments enable row level security;
revoke all on public.platform_subscription_payments from anon,authenticated;

create table if not exists public.platform_subscription_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  subscription_id uuid references public.business_subscriptions(id) on delete set null,
  payment_id uuid references public.platform_subscription_payments(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check(event_type in ('trial_started','trial_extended','status_changed','payment_confirmed','payment_recorded','subscription_activated','period_extended','payment_rejected','payment_refunded','admin_note')),
  old_status text,
  new_status text,
  amount_minor bigint check(amount_minor is null or amount_minor>=0),
  currency_code char(3),
  external_reference text,
  metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now()
);
create index if not exists platform_subscription_events_business_created_idx on public.platform_subscription_events(business_id,created_at desc);
create index if not exists platform_subscription_events_created_idx on public.platform_subscription_events(created_at desc);
alter table public.platform_subscription_events enable row level security;
revoke all on public.platform_subscription_events from anon,authenticated;

create or replace function public.prevent_platform_payment_mutation()
returns trigger language plpgsql
set search_path = pg_catalog, public
as $$
begin
  raise exception 'Subscription payment records are append-only; record a correcting event instead.';
end;
$$;
drop trigger if exists platform_subscription_payments_append_only on public.platform_subscription_payments;
create trigger platform_subscription_payments_append_only before update or delete on public.platform_subscription_payments
for each row execute function public.prevent_platform_payment_mutation();
revoke all on function public.prevent_platform_payment_mutation() from public,anon,authenticated;

create or replace function public.log_business_subscription_event()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_event_type text; v_old_status text; v_new_status text;
begin
  if tg_op='INSERT' then
    v_new_status:=new.status::text;
    v_event_type:=case when new.status::text='trialing' then 'trial_started' else 'subscription_activated' end;
    insert into public.platform_subscription_events(business_id,subscription_id,actor_user_id,event_type,new_status,metadata)
    values(new.business_id,new.id,(select auth.uid()),v_event_type,v_new_status,
      jsonb_build_object('period_start',new.current_period_start,'period_end',new.current_period_end,'provider',new.provider));
    return new;
  end if;
  v_old_status:=old.status::text; v_new_status:=new.status::text;
  if old.status is distinct from new.status then v_event_type:='status_changed';
  elsif old.current_period_end is distinct from new.current_period_end then
    v_event_type:=case when new.status::text='trialing' then 'trial_extended' else 'period_extended' end;
  elsif old.plan_id is distinct from new.plan_id then v_event_type:='subscription_activated';
  else return new;
  end if;
  insert into public.platform_subscription_events(business_id,subscription_id,actor_user_id,event_type,old_status,new_status,metadata)
  values(new.business_id,new.id,(select auth.uid()),v_event_type,v_old_status,v_new_status,
    jsonb_build_object('old_period_end',old.current_period_end,'new_period_end',new.current_period_end,'old_plan_id',old.plan_id,'new_plan_id',new.plan_id,'provider',new.provider));
  return new;
end;
$$;
drop trigger if exists business_subscription_history_trigger on public.business_subscriptions;
create trigger business_subscription_history_trigger after insert or update on public.business_subscriptions
for each row execute function public.log_business_subscription_event();
revoke all on function public.log_business_subscription_event() from public,anon,authenticated;

create or replace function public.log_platform_payment_event()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.platform_subscription_events(business_id,subscription_id,payment_id,actor_user_id,event_type,new_status,amount_minor,currency_code,external_reference,metadata)
  values(new.business_id,new.subscription_id,new.id,new.recorded_by,
    case when new.status='confirmed' then 'payment_confirmed' else 'payment_recorded' end,
    new.status,new.amount_minor,new.currency_code,new.external_reference,
    jsonb_build_object('billing_interval',new.billing_interval,'payment_method',new.payment_method,'received_at',new.received_at,'notes',new.notes));
  return new;
end;
$$;
drop trigger if exists platform_payment_history_trigger on public.platform_subscription_payments;
create trigger platform_payment_history_trigger after insert on public.platform_subscription_payments
for each row execute function public.log_platform_payment_event();
revoke all on function public.log_platform_payment_event() from public,anon,authenticated;

create or replace function public.start_business_trial()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists(select 1 from public.business_subscriptions s where s.business_id=new.id) then
    insert into public.business_subscriptions(business_id,status,provider,current_period_start,current_period_end)
    values(new.id,'trialing','trial',new.created_at,new.created_at+interval '30 days');
  end if;
  return new;
end;
$$;
drop trigger if exists business_trial_start_trigger on public.businesses;
create trigger business_trial_start_trigger after insert on public.businesses
for each row execute function public.start_business_trial();
revoke all on function public.start_business_trial() from public,anon,authenticated;

create unique index if not exists business_subscriptions_one_current_per_business on public.business_subscriptions(business_id);

-- Existing businesses receive a one-time trial anchored to the business creation date; no existing subscription is overwritten.
insert into public.business_subscriptions(business_id,status,provider,current_period_start,current_period_end)
select b.id,'trialing','trial',b.created_at,b.created_at+interval '30 days'
from public.businesses b
where not exists(select 1 from public.business_subscriptions s where s.business_id=b.id);

create or replace function public.record_platform_activity(
  p_event text default 'app_open',
  p_is_standalone boolean default false,
  p_platform text default null
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_user_id uuid:=(select auth.uid()); v_day date:=(now() at time zone 'America/Bogota')::date;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_event not in ('app_open','pwa_installed','install_help_opened') then raise exception 'Unsupported activity event'; end if;
  insert into public.platform_user_activity(user_id,activity_date,last_seen_at,visit_count,is_standalone,platform)
  values(v_user_id,v_day,now(),1,p_is_standalone,left(coalesce(p_platform,''),80))
  on conflict(user_id,activity_date) do update set last_seen_at=excluded.last_seen_at,
    visit_count=public.platform_user_activity.visit_count+1,
    is_standalone=public.platform_user_activity.is_standalone or excluded.is_standalone,
    platform=coalesce(nullif(excluded.platform,''),public.platform_user_activity.platform);
  if p_is_standalone or p_event='pwa_installed' then
    insert into public.platform_install_registry(user_id,first_seen_installed_at,last_seen_installed_at,platform,source,updated_at)
    values(v_user_id,now(),now(),left(coalesce(p_platform,''),80),'standalone_detection',now())
    on conflict(user_id) do update set last_seen_installed_at=now(),
      platform=coalesce(nullif(excluded.platform,''),public.platform_install_registry.platform),updated_at=now();
  end if;
  update public.business_subscriptions s set status='expired',updated_at=now()
  where s.status='trialing' and s.current_period_end is not null and s.current_period_end<=now()
    and exists(select 1 from public.businesses b where b.id=s.business_id and (
      b.owner_user_id=v_user_id or exists(select 1 from public.business_members m where m.business_id=b.id and m.user_id=v_user_id)
    ));
  return jsonb_build_object('ok',true,'activity_date',v_day,'standalone',p_is_standalone);
end;
$$;
revoke all on function public.record_platform_activity(text,boolean,text) from public,anon;
grant execute on function public.record_platform_activity(text,boolean,text) to authenticated;

create or replace function public.platform_admin_dashboard()
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare v_result jsonb;
begin
  if not public.is_platform_admin() then raise exception 'Platform administrator access required'; end if;
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'total_users',(select count(*) from auth.users),
      'active_today',(select count(distinct user_id) from public.platform_user_activity where activity_date=(now() at time zone 'America/Bogota')::date),
      'active_7d',(select count(distinct user_id) from public.platform_user_activity where last_seen_at>=now()-interval '7 days'),
      'active_30d',(select count(distinct user_id) from public.platform_user_activity where last_seen_at>=now()-interval '30 days'),
      'installed_users',(select count(*) from public.platform_install_registry),
      'businesses',(select count(*) from public.businesses),
      'trials_live',(select count(*) from public.business_subscriptions where status='trialing' and current_period_end>now()),
      'trials_expired',(select count(*) from public.business_subscriptions where status='expired'),
      'subscribers_active',(select count(*) from public.business_subscriptions where status='active' and current_period_end>now()),
      'past_due',(select count(*) from public.business_subscriptions where status='past_due'),
      'collected_month',(select coalesce(sum(amount_minor),0) from public.platform_subscription_payments where status='confirmed' and received_at>=date_trunc('month',now()))
    ),
    'subscriptions',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.business_created_at desc)
      from (
        select s.id as subscription_id,b.id as business_id,b.name as business_name,b.owner_user_id,
          u.email as owner_email,u.created_at as owner_created_at,b.created_at as business_created_at,
          s.status::text as status,s.provider,s.current_period_start,s.current_period_end,s.cancel_at_period_end,
          s.created_at as subscription_created_at,
          greatest(0,ceil(extract(epoch from (s.current_period_end-now()))/86400))::integer as days_remaining,
          (select max(a.last_seen_at) from public.platform_user_activity a where a.user_id=b.owner_user_id) as last_seen_at,
          exists(select 1 from public.platform_install_registry i where i.user_id=b.owner_user_id) as is_installed,
          (select max(p.received_at) from public.platform_subscription_payments p where p.business_id=b.id and p.status='confirmed') as last_payment_at,
          (select coalesce(sum(p.amount_minor),0) from public.platform_subscription_payments p where p.business_id=b.id and p.status='confirmed') as total_paid_minor
        from public.business_subscriptions s join public.businesses b on b.id=s.business_id join auth.users u on u.id=b.owner_user_id
      ) x
    ),'[]'::jsonb),
    'payments',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select p.id,p.business_id,b.name as business_name,u.email as owner_email,p.subscription_id,
          p.billing_interval,p.amount_minor,p.currency_code,p.payment_method,p.external_reference,p.status,
          p.received_at,p.recorded_by,p.notes,p.created_at
        from public.platform_subscription_payments p join public.businesses b on b.id=p.business_id
          join auth.users u on u.id=b.owner_user_id order by p.created_at desc limit 100
      ) x
    ),'[]'::jsonb),
    'events',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select e.id,e.business_id,b.name as business_name,e.subscription_id,e.payment_id,e.actor_user_id,
          actor.email as actor_email,e.event_type,e.old_status,e.new_status,e.amount_minor,e.currency_code,
          e.external_reference,e.metadata,e.created_at
        from public.platform_subscription_events e join public.businesses b on b.id=e.business_id
          left join auth.users actor on actor.id=e.actor_user_id order by e.created_at desc limit 150
      ) x
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.platform_admin_dashboard() from public,anon;
grant execute on function public.platform_admin_dashboard() to authenticated;

create or replace function public.platform_admin_update_subscription(
  p_business_id uuid,
  p_new_status text default null,
  p_period_end timestamptz default null,
  p_note text default null
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_sub public.business_subscriptions%rowtype; v_old_status text; v_new_end timestamptz;
begin
  if not public.is_platform_admin() then raise exception 'Platform administrator access required'; end if;
  if p_new_status is not null and p_new_status not in ('trialing','active','past_due','canceled','expired','paused') then raise exception 'Invalid subscription status'; end if;
  select * into v_sub from public.business_subscriptions where business_id=p_business_id for update;
  if not found then raise exception 'Business subscription not found'; end if;
  v_old_status:=v_sub.status::text; v_new_end:=coalesce(p_period_end,v_sub.current_period_end);
  update public.business_subscriptions set status=coalesce(p_new_status,status)::public.subscription_status,
    current_period_end=v_new_end,updated_at=now() where id=v_sub.id;
  if nullif(trim(coalesce(p_note,'')),'') is not null then
    insert into public.platform_subscription_events(business_id,subscription_id,actor_user_id,event_type,old_status,new_status,metadata)
    values(p_business_id,v_sub.id,(select auth.uid()),'admin_note',v_old_status,coalesce(p_new_status,v_old_status),
      jsonb_build_object('note',left(trim(p_note),2000)));
  end if;
  return jsonb_build_object('ok',true,'subscription_id',v_sub.id);
end;
$$;
revoke all on function public.platform_admin_update_subscription(uuid,text,timestamptz,text) from public,anon;
grant execute on function public.platform_admin_update_subscription(uuid,text,timestamptz,text) to authenticated;

create or replace function public.platform_admin_expire_trials()
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_expired integer;
begin
  if not public.is_platform_admin() then raise exception 'Platform administrator access required'; end if;
  update public.business_subscriptions set status='expired',updated_at=now()
  where status='trialing' and current_period_end is not null and current_period_end<=now();
  get diagnostics v_expired=row_count;
  return jsonb_build_object('expired',v_expired,'checked_at',now());
end;
$$;
revoke all on function public.platform_admin_expire_trials() from public,anon;
grant execute on function public.platform_admin_expire_trials() to authenticated;

create or replace function public.platform_admin_record_payment(
  p_business_id uuid,
  p_billing_interval text,
  p_amount_minor bigint,
  p_currency_code text default 'COP',
  p_payment_method text default 'Nequi',
  p_external_reference text default null,
  p_notes text default null,
  p_received_at timestamptz default now()
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_sub public.business_subscriptions%rowtype; v_payment_id uuid; v_start timestamptz; v_end timestamptz;
  v_reference text:=nullif(trim(coalesce(p_external_reference,'')),'');
begin
  if not public.is_platform_admin() then raise exception 'Platform administrator access required'; end if;
  if p_billing_interval not in ('month','quarter','year') then raise exception 'Invalid billing interval'; end if;
  if p_amount_minor is null or p_amount_minor<=0 then raise exception 'Payment amount must be positive'; end if;
  if p_currency_code is null or p_currency_code !~ '^[A-Z]{3}$' then raise exception 'Invalid currency code'; end if;
  if p_payment_method not in ('Nequi','Transferencia bancaria','Efectivo','Wompi manual','Tarjeta manual','Otro') then raise exception 'Invalid payment method'; end if;
  if p_payment_method in ('Nequi','Transferencia bancaria','Wompi manual','Tarjeta manual') and v_reference is null then raise exception 'A transaction reference is required for this payment method'; end if;
  if v_reference is not null and exists(select 1 from public.platform_subscription_payments p
    where lower(p.payment_method)=lower(p_payment_method) and lower(trim(p.external_reference))=lower(v_reference)) then
    raise exception 'This payment reference has already been recorded';
  end if;
  select * into v_sub from public.business_subscriptions where business_id=p_business_id for update;
  if not found then raise exception 'Business subscription not found'; end if;
  v_start:=case when v_sub.status::text='trialing' then greatest(coalesce(p_received_at,now()),now())
    else greatest(coalesce(v_sub.current_period_end,now()),now(),coalesce(p_received_at,now())) end;
  v_end:=case p_billing_interval when 'month' then v_start+interval '1 month'
    when 'quarter' then v_start+interval '3 months' when 'year' then v_start+interval '1 year' end;
  update public.business_subscriptions set status='active',provider='manual',current_period_start=v_start,
    current_period_end=v_end,cancel_at_period_end=false,updated_at=now() where id=v_sub.id;
  insert into public.platform_subscription_payments(business_id,subscription_id,billing_interval,amount_minor,currency_code,
    payment_method,external_reference,status,received_at,recorded_by,notes)
  values(p_business_id,v_sub.id,p_billing_interval,p_amount_minor,p_currency_code,p_payment_method,
    v_reference,'confirmed',coalesce(p_received_at,now()),(select auth.uid()),nullif(trim(coalesce(p_notes,''),'')))
  returning id into v_payment_id;
  return jsonb_build_object('ok',true,'payment_id',v_payment_id,'period_start',v_start,'period_end',v_end);
end;
$$;
revoke all on function public.platform_admin_record_payment(uuid,text,bigint,text,text,text,text,timestamptz) from public,anon;
grant execute on function public.platform_admin_record_payment(uuid,text,bigint,text,text,text,text,timestamptz) to authenticated;
