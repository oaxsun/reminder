-- Ejecuta este script si ya tienes creado el schema principal y solo quieres agregar Stripe/Premium.

create table if not exists public.korah_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_premium boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  subscription_status text not null default 'none',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.korah_subscriptions enable row level security;

drop policy if exists "Users can read own Korah subscription" on public.korah_subscriptions;
create policy "Users can read own Korah subscription"
on public.korah_subscriptions for select
to authenticated
using (auth.uid() = user_id);
