-- ANCHR Supabase schema
-- Ejecuta este script en Supabase > SQL Editor.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  frequency text not null check (frequency in ('monthly', 'bimonthly', 'quarterly', 'yearly')),
  amount_type text not null default 'variable' check (amount_type in ('fixed', 'variable')),
  amount numeric(12,2) not null default 0,
  due_day int not null check (due_day between 1 and 31),
  icon text not null default 'credit-card',
  icon_color text not null default 'blue',
  last_paid date,
  last_paid_amount numeric(12,2),
  paid_period text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  period text not null,
  paid_at date not null default current_date,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;
alter table public.payment_history enable row level security;

drop policy if exists "Users can read own payments" on public.payments;
create policy "Users can read own payments"
on public.payments for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own payments" on public.payments;
create policy "Users can insert own payments"
on public.payments for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own payments" on public.payments;
create policy "Users can update own payments"
on public.payments for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own payments" on public.payments;
create policy "Users can delete own payments"
on public.payments for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own payment history" on public.payment_history;
create policy "Users can read own payment history"
on public.payment_history for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own payment history" on public.payment_history;
create policy "Users can insert own payment history"
on public.payment_history for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own payment history" on public.payment_history;
create policy "Users can update own payment history"
on public.payment_history for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own payment history" on public.payment_history;
create policy "Users can delete own payment history"
on public.payment_history for delete
to authenticated
using (auth.uid() = user_id);
