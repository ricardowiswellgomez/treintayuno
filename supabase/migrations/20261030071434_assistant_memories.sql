-- Explicit, private assistant memories scoped to a user and a business.
-- The production project already has this migration applied; keep the SQL in
-- source control so fresh environments receive the same protected schema.
create table if not exists public.assistant_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  memory_key text not null check (char_length(btrim(memory_key)) between 1 and 80),
  memory_type text not null check (memory_type in ('preference','business_context','objective')),
  memory_value text not null check (char_length(btrim(memory_value)) between 1 and 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_memories_user_business_key unique (user_id,business_id,memory_key)
);
create index if not exists assistant_memories_user_business_updated_idx
  on public.assistant_memories (user_id,business_id,updated_at desc);
alter table public.assistant_memories enable row level security;
revoke all on public.assistant_memories from anon;
grant select,insert,update,delete on public.assistant_memories to authenticated;
grant select,insert,update,delete on public.assistant_memories to service_role;
drop policy if exists assistant_memories_select_own_business on public.assistant_memories;
create policy assistant_memories_select_own_business on public.assistant_memories for select to authenticated
using (user_id=(select auth.uid()) and exists (
  select 1 from public.business_members bm
  where bm.business_id=assistant_memories.business_id and bm.user_id=(select auth.uid())
));
drop policy if exists assistant_memories_insert_own_business on public.assistant_memories;
create policy assistant_memories_insert_own_business on public.assistant_memories for insert to authenticated
with check (user_id=(select auth.uid()) and exists (
  select 1 from public.business_members bm
  where bm.business_id=assistant_memories.business_id and bm.user_id=(select auth.uid())
));
drop policy if exists assistant_memories_update_own_business on public.assistant_memories;
create policy assistant_memories_update_own_business on public.assistant_memories for update to authenticated
using (user_id=(select auth.uid()) and exists (
  select 1 from public.business_members bm
  where bm.business_id=assistant_memories.business_id and bm.user_id=(select auth.uid())
))
with check (user_id=(select auth.uid()) and exists (
  select 1 from public.business_members bm
  where bm.business_id=assistant_memories.business_id and bm.user_id=(select auth.uid())
));
drop policy if exists assistant_memories_delete_own_business on public.assistant_memories;
create policy assistant_memories_delete_own_business on public.assistant_memories for delete to authenticated
using (user_id=(select auth.uid()) and exists (
  select 1 from public.business_members bm
  where bm.business_id=assistant_memories.business_id and bm.user_id=(select auth.uid())
));
