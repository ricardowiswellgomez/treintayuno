drop policy if exists cash_register_sessions_update_by_permission on public.cash_register_sessions;
create policy cash_register_sessions_update_by_permission
  on public.cash_register_sessions for update to authenticated
  using (opened_by=auth.uid() or private.can_manage_members(business_id))
  with check (opened_by=auth.uid() or private.can_manage_members(business_id));