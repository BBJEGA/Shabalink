
-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, wallet_balance)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    0.00
  );
  return new;
end;
$$;

-- Trigger to call the function on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
