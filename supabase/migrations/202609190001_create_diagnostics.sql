create table if not exists public.diagnostics (
  diagnostic_id uuid primary key,
  created_at timestamptz not null default now(),
  source text not null default 'online',
  lead jsonb not null,
  total_score integer not null check (total_score between 0 and 24),
  maturity_pct integer not null check (maturity_pct between 0 and 100),
  profile jsonb not null,
  dimensions jsonb not null,
  answers jsonb not null,
  result_url text,
  inserted_at timestamptz not null default now()
);

alter table public.diagnostics enable row level security;

-- Não há política pública de INSERT/SELECT.
-- Apenas a Edge Function, usando service role, grava e consulta estes dados.

create index if not exists diagnostics_created_at_idx on public.diagnostics (created_at desc);
create index if not exists diagnostics_email_idx on public.diagnostics ((lead->>'email'));