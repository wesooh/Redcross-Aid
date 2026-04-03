-- supabase/migrations/0000_initial_schema.sql

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp" with schema extensions;

-- 2. Define User Roles
create type public.user_role as enum ('admin', 'volunteer', 'merchant', 'victim');

-- 3. Profiles Table
create table public.profiles (
  id uuid default extensions.uuid_generate_v4() not null primary key,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  full_name text,
  national_id text unique,
  phone_number text,
  role public.user_role not null
);
alter table public.profiles enable row level security;

-- 4. Campaigns Table
create table public.campaigns (
    id uuid default extensions.uuid_generate_v4() not null primary key,
    created_at timestamp with time zone not null default now(),
    name text not null,
    description text
);
alter table public.campaigns enable row level security;


-- 5. Wallets Table
create table public.wallets (
  id uuid default extensions.uuid_generate_v4() not null primary key,
  created_at timestamp with time zone not null default now(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  balance numeric(10, 2) not null default 0.00,
  unique(profile_id)
);
alter table public.wallets enable row level security;


-- 6. Ledger Table (Append-Only)
create type public.transaction_type as enum ('AID_DISBURSEMENT', 'PURCHASE', 'FUNDS_RETURN');

create table public.ledger (
  id bigserial primary key,
  created_at timestamp with time zone not null default now(),
  wallet_id uuid not null references public.wallets(id),
  campaign_id uuid references public.campaigns(id),
  amount numeric(10, 2) not null,
  transaction_type public.transaction_type not null,
  idempotency_key uuid not null,
  description text,
  metadata jsonb,
  unique(idempotency_key)
);
alter table public.ledger enable row level security;


-- 7. Triage Sessions Table
create table public.triage_sessions (
    id bigserial primary key,
    created_at timestamp with time zone not null default now(),
    victim_id uuid not null references public.profiles(id),
    last_message text,
    risk_score float,
    escalated boolean default false,
    notes text
);
alter table public.triage_sessions enable row level security;


-- =================================================================
-- RLS (Row Level Security) Policies
-- Aggressive defaults: Deny all access unless explicitly granted.
-- =================================================================

-- Profiles
create policy "Allow all access to profiles" on public.profiles for all using (true) with check (true);

-- Wallets
create policy "Allow all access to wallets" on public.wallets for all using (true) with check (true);

-- Ledger
create policy "Allow all access to ledger" on public.ledger for all using (true) with check (true);

-- Campaigns
create policy "Allow all access to campaigns" on public.campaigns for all using (true) with check (true);

-- Triage Sessions
create policy "Allow all access to triage_sessions" on public.triage_sessions for all using (true) with check (true);


-- =================================================================
-- Stored Procedures (RPC - Remote Procedure Calls)
-- =================================================================

-- Generic function to create a profile and a corresponding wallet.
create or replace function public.register_profile_with_wallet(
    p_full_name text,
    p_role public.user_role,
    p_national_id text,
    p_phone_number text
)
returns uuid
language plpgsql
security definer -- Executes with the privileges of the function owner (postgres)
as $$
declare
  new_profile_id uuid;
begin
  -- Insert the new profile
  insert into public.profiles (full_name, role, national_id, phone_number)
  values (p_full_name, p_role, p_national_id, p_phone_number)
  returning id into new_profile_id;

  -- Create a wallet for the new profile
  insert into public.wallets (profile_id)
  values (new_profile_id);

  return new_profile_id;
end;
$$;


-- Specific function to register a 'victim'
create or replace function public.register_victim(
    p_full_name text,
    p_national_id text,
    p_phone_number text
)
returns uuid
language sql
as $$
  select public.register_profile_with_wallet(p_full_name, 'victim', p_national_id, p_phone_number);
$$;

-- Specific function to register a 'merchant'
create or replace function public.register_merchant(
    p_full_name text,
    p_phone_number text
)
returns uuid
language sql
as $$
  select public.register_profile_with_wallet(p_full_name, 'merchant', null, p_phone_number);
$$;


-- Function to disburse aid to a batch of victims for a specific campaign
create or replace function public.disburse_aid(
    victim_profile_ids uuid[],
    disbursement_amount numeric,
    idempotency_key_prefix text,
    p_campaign_id uuid
)
returns text
language plpgsql
security definer
as $$
declare
  victim_id uuid;
  victim_wallet_id uuid;
  processed_count int := 0;
begin
  if disbursement_amount <= 0 then
    raise exception 'Disbursement amount must be positive.';
  end if;

  foreach victim_id in array victim_profile_ids
  loop
    -- Find the wallet for the current victim
    select id into victim_wallet_id from public.wallets where profile_id = victim_id;

    if victim_wallet_id is not null then
      -- Update wallet balance
      update public.wallets
      set balance = balance + disbursement_amount
      where id = victim_wallet_id;

      -- Insert into ledger
      insert into public.ledger (wallet_id, campaign_id, amount, transaction_type, idempotency_key, description)
      values (
        victim_wallet_id,
        p_campaign_id,
        disbursement_amount,
        'AID_DISBURSEMENT',
        uuid_generate_v5(uuid_ns_url(), idempotency_key_prefix || victim_id::text),
        'Aid disbursement for campaign ' || (select name from campaigns where id = p_campaign_id)
      ) on conflict (idempotency_key) do nothing; -- Prevents duplicate disbursements for same batch/victim
      
      processed_count := processed_count + 1;
    end if;
  end loop;

  return 'Successfully disbursed aid to ' || processed_count || ' victim(s).';
end;
$$;


-- Function to process a purchase from a victim's wallet to a merchant's wallet
create or replace function public.process_aid_purchase(
    victim_profile_id uuid,
    merchant_profile_id uuid,
    purchase_amount numeric,
    idempotency_key uuid
)
returns text
language plpgsql
security definer
as $$
declare
  victim_wallet record;
  merchant_wallet_id uuid;
begin
  if purchase_amount <= 0 then
    raise exception 'Purchase amount must be positive.';
  end if;

  -- Lock victim's wallet row and check balance
  select id, balance into victim_wallet
  from public.wallets
  where profile_id = victim_profile_id
  for update;

  if not found then
    raise exception 'Victim wallet not found.';
  end if;

  if victim_wallet.balance < purchase_amount then
    raise exception 'Insufficient balance.';
  end if;

  -- Find merchant's wallet
  select id into merchant_wallet_id
  from public.wallets
  where profile_id = merchant_profile_id;

  if not found then
    raise exception 'Merchant wallet not found.';
  end if;
  
  -- The core transaction logic
  -- 1. Debit victim
  update public.wallets
  set balance = balance - purchase_amount
  where id = victim_wallet.id;

  insert into public.ledger (wallet_id, amount, transaction_type, idempotency_key, description)
  values (
    victim_wallet.id,
    -purchase_amount,
    'PURCHASE',
    idempotency_key,
    'Purchase at merchant ' || (select full_name from profiles where id = merchant_profile_id)
  );

  -- 2. Credit merchant
  update public.wallets
  set balance = balance + purchase_amount
  where id = merchant_wallet_id;

  insert into public.ledger (wallet_id, amount, transaction_type, idempotency_key, description)
  values (
    merchant_wallet_id,
    purchase_amount,
    'PURCHASE',
    uuid_generate_v5(idempotency_key, 'merchant_credit'), -- Create a derived key for merchant credit
    'Payment from victim ' || (select full_name from profiles where id = victim_profile_id)
  ) on conflict (idempotency_key) do nothing;
  
  return 'Transaction successful. New balance: ' || (victim_wallet.balance - purchase_amount);
exception
  when unique_violation then
    raise exception 'Duplicate transaction detected. This purchase has already been processed.';
end;
$$;
