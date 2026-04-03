--
-- Create ENUM types
--
do $$
begin
    if not exists (select 1 from pg_type where typname = 'profile_role') then
        create type public.profile_role as enum ('admin', 'volunteer', 'merchant', 'victim');
    end if;
    if not exists (select 1 from pg_type where typname = 'transaction_type') then
        create type public.transaction_type as enum ('AID_DISBURSEMENT', 'PURCHASE', 'FUNDS_RETURN');
    end if;
end
$$;


--
-- Create Tables
--

-- Profiles Table: Stores user information and roles
create table if not exists public.profiles (
    id uuid not null primary key default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    full_name text,
    national_id text unique,
    phone_number text unique,
    role profile_role not null default 'victim'
);
comment on table public.profiles is 'Stores user profiles and their roles within the system.';
-- RLS for profiles
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can manage all profiles" on public.profiles for all using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);


-- Wallets Table: Stores digital voucher balances
create table if not exists public.wallets (
    id uuid not null primary key default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    profile_id uuid not null unique references public.profiles(id) on delete cascade,
    balance numeric(10, 2) not null default 0.00 check (balance >= 0)
);
comment on table public.wallets is 'Manages the digital balance for each profile.';
-- RLS for wallets
alter table public.wallets enable row level security;
create policy "Users can view their own wallet" on public.wallets for select using (
    profile_id = auth.uid()
);
create policy "Admins can view all wallets" on public.wallets for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);


-- Campaigns Table: Stores aid disbursement campaigns
create table if not exists public.campaigns (
    id uuid not null primary key default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    name text not null,
    description text
);
comment on table public.campaigns is 'Stores aid disbursement campaigns run by admins.';
-- RLS for campaigns
alter table public.campaigns enable row level security;
create policy "All authenticated users can view campaigns" on public.campaigns for select using (auth.role() = 'authenticated');
create policy "Admins can manage campaigns" on public.campaigns for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);


-- Ledger Table: Append-only audit trail for all transactions
create table if not exists public.ledger (
    id bigserial primary key,
    created_at timestamp with time zone not null default now(),
    wallet_id uuid not null references public.wallets(id),
    campaign_id uuid references public.campaigns(id),
    amount numeric(10, 2) not null,
    transaction_type transaction_type not null,
    idempotency_key uuid not null,
    description text,
    metadata jsonb
);
create index if not exists idx_ledger_wallet_id on public.ledger(wallet_id);
create unique index if not exists idx_ledger_idempotency_key on public.ledger(idempotency_key);
comment on table public.ledger is 'Append-only audit trail for all financial transactions.';
-- RLS for ledger
alter table public.ledger enable row level security;
create policy "Users can view their own transactions" on public.ledger for select using (
    wallet_id = (select id from wallets where profile_id = auth.uid())
);
create policy "Admins can view all transactions" on public.ledger for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Triage Sessions Table: For PFA chatbot escalations
create table if not exists public.triage_sessions (
    id bigserial primary key,
    created_at timestamp with time zone not null default now(),
    victim_id uuid not null references public.profiles(id),
    last_message text,
    risk_score float,
    escalated boolean default false,
    notes text,
    status text not null default 'open' -- e.g., 'open', 'in_progress', 'closed'
);
comment on table public.triage_sessions is 'Tracks PFA chatbot conversations flagged for high risk.';
alter table public.triage_sessions enable row level security;
create policy "Admins can manage triage sessions" on public.triage_sessions for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);


--
-- Create Postgres Functions (RPC)
--

-- Function to register a new victim and create their wallet
create or replace function public.register_victim(
    p_full_name text,
    p_national_id text,
    p_phone_number text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
    new_profile_id uuid;
begin
    -- Insert into profiles table
    insert into public.profiles (full_name, national_id, phone_number, role)
    values (p_full_name, p_national_id, p_phone_number, 'victim')
    returning id into new_profile_id;

    -- Create a wallet for the new victim
    insert into public.wallets (profile_id, balance)
    values (new_profile_id, 0);

    return new_profile_id;
end;
$$;

-- Function to register a new merchant and create their wallet
create or replace function public.register_merchant(
    p_full_name text,
    p_phone_number text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
    new_profile_id uuid;
begin
    -- insert into profiles table
    insert into public.profiles (full_name, phone_number, role)
    values (p_full_name, p_phone_number, 'merchant')
    returning id into new_profile_id;

    -- create a wallet for the merchant
    insert into public.wallets (profile_id, balance)
    values (new_profile_id, 0);

    return new_profile_id;
end;
$$;

-- Function to register a new volunteer and create their wallet
create or replace function public.register_volunteer(
    p_full_name text,
    p_phone_number text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
    new_profile_id uuid;
begin
    -- insert into profiles table
    insert into public.profiles (full_name, phone_number, role)
    values (p_full_name, p_phone_number, 'volunteer')
    returning id into new_profile_id;

    -- create a wallet for the volunteer
    insert into public.wallets (profile_id, balance)
    values (new_profile_id, 0);

    return new_profile_id;
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
security definer set search_path = public
as $$
declare
    victim_wallet_id uuid;
    victim_balance numeric;
    merchant_wallet_id uuid;
    debit_description text;
    credit_description text;
begin
    -- 1. Check for idempotency
    if exists (select 1 from public.ledger where idempotency_key = process_aid_purchase.idempotency_key) then
        return 'Transaction already processed.';
    end if;
    
    -- 2. Get victim wallet and check balance
    select id, balance into victim_wallet_id, victim_balance
    from public.wallets where profile_id = victim_profile_id;

    if not found then
        raise exception 'Victim wallet not found';
    end if;

    if victim_balance < purchase_amount then
        raise exception 'Insufficient balance';
    end if;

    -- 3. Get merchant wallet
    select id into merchant_wallet_id
    from public.wallets where profile_id = merchant_profile_id;

    if not found then
        raise exception 'Merchant wallet not found';
    end if;

    -- 4. Create descriptions
    debit_description := 'Purchase at ' || (select full_name from profiles where id = merchant_profile_id);
    credit_description := 'Payment from ' || (select full_name from profiles where id = victim_profile_id);

    -- 5. Record debit from victim ledger
    insert into public.ledger (wallet_id, amount, transaction_type, idempotency_key, description)
    values (victim_wallet_id, -purchase_amount, 'PURCHASE', idempotency_key, debit_description);

    -- 6. Record credit to merchant ledger (using a different idempotency key to allow insertion)
    insert into public.ledger (wallet_id, amount, transaction_type, idempotency_key, description)
    values (merchant_wallet_id, purchase_amount, 'PURCHASE', gen_random_uuid(), credit_description);

    -- 7. Update wallet balances
    update public.wallets
    set balance = balance - purchase_amount
    where id = victim_wallet_id;

    update public.wallets
    set balance = balance + purchase_amount
    where id = merchant_wallet_id;

    return 'Transaction successful';
end;
$$;


-- Function to disburse aid to multiple victims
create or replace function public.disburse_aid(
    victim_profile_ids uuid[],
    disbursement_amount numeric,
    p_campaign_id uuid,
    idempotency_key_prefix text
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
    victim_id uuid;
    victim_wallet_id uuid;
    idem_key uuid;
    campaign_name_text text;
begin
    select name into campaign_name_text from public.campaigns where id = p_campaign_id;

    if not found then
        raise exception 'Campaign not found';
    end if;

    foreach victim_id in array victim_profile_ids
    loop
        -- Find the wallet for the current victim
        select id into victim_wallet_id from public.wallets where profile_id = victim_id;

        if found then
            -- Generate a unique idempotency key for each disbursement
            idem_key := (idempotency_key_prefix || victim_id::text)::uuid;

            -- Check if this specific disbursement has already been made
            if not exists (select 1 from public.ledger where idempotency_key = idem_key) then
                -- Add credit to victim's ledger
                insert into public.ledger (wallet_id, campaign_id, amount, transaction_type, idempotency_key, description)
                values (victim_wallet_id, p_campaign_id, disbursement_amount, 'AID_DISBURSEMENT', idem_key, 'Aid disbursement: ' || campaign_name_text);

                -- Update victim's wallet balance
                update public.wallets
                set balance = balance + disbursement_amount
                where id = victim_wallet_id;
            end if;
        end if;
    end loop;

    return 'Disbursement process completed for ' || array_length(victim_profile_ids, 1) || ' victims.';
end;
$$;
