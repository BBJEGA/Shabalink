
-- Create a table for public profiles (extends auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  wallet_balance decimal(12, 2) default 0.00,
  transaction_pin text, -- Encrypted or simple 4-digit (hashed ideally in real app)
  tier text default 'level_1', -- 'level_1' or 'level_2'
  account_number text,
  bank_name text,
  account_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a table for transactions
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  type text not null, -- 'deposit', 'purchase', 'refund'
  amount decimal(12, 2) not null,
  reference text unique not null, -- Unique transaction ref
  status text default 'pending', -- 'pending', 'success', 'failed'
  description text,
  metadata jsonb, -- Store extra details like plan_id, phone_number
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for transactions
alter table transactions enable row level security;

create policy "Users can view own transactions."
  on transactions for select
  using ( auth.uid() = user_id );
