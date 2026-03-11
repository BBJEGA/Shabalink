-- FAIL-SAFE TRIGGER: Absolutely bare minimum logic to guarantee insertion.
-- Sometimes Supabase blocks triggers if they use Security Definer with complex metadata parsing on the Free Tier edge functions.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- The simplest possible SQL insert statement
  insert into public.profiles (id, email, full_name, wallet_balance)
  values (
    new.id,
    new.email,
    'Shabalink User', -- Hardcoded to bypass JSONB parsing errors
    0.00
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
