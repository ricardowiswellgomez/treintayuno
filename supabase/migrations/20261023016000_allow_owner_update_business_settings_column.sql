-- Allow signed-in users to update the business settings column.
-- Row-level security still restricts the affected business row to its owner.
GRANT UPDATE (settings) ON TABLE public.businesses TO authenticated;
