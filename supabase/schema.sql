-- =============================================================================
--  Florece · Esquema completo de base de datos (Supabase / Postgres 15+)
--  Pégalo completo en Supabase → SQL Editor → Run.
--  Es idempotente: puedes volver a ejecutarlo sin romper nada.
--
--  Convenciones:
--  · Montos en BIGINT (pesos colombianos enteros, sin decimales).
--  · Fechas de negocio en DATE, calculadas en America/Bogota.
--  · Todas las tablas tienen user_id + Row Level Security (auth.uid() = user_id).
--  · Las FK hacia categorías y metas son compuestas (id, user_id) para que sea
--    imposible referenciar filas de otra persona, aunque las FK ignoren RLS.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.frecuencia_pago as enum ('quincenal', 'mensual', 'variable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tipo_movimiento as enum ('gasto', 'ingreso');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.clasificacion_gasto as enum ('necesidad', 'gusto', 'ahorro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_meta as enum ('activa', 'cumplida', 'pausada');
exception when duplicate_object then null; end $$;

-- Fecha de "hoy" en Colombia (las transacciones se agrupan por día local).
create or replace function public.hoy_bogota()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Bogota')::date;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  nombre               text not null default '' check (char_length(nombre) <= 40),
  avatar_emoji         text not null default '🌸' check (char_length(avatar_emoji) between 1 and 16),
  frecuencia_pago      public.frecuencia_pago not null default 'mensual',
  dias_pago            smallint[] not null default '{30}'
                         check (
                           cardinality(dias_pago) between 1 and 2
                           and 1 <= all (dias_pago)
                           and 31 >= all (dias_pago)
                         ),
  ingreso_estimado     bigint check (ingreso_estimado is null or ingreso_estimado >= 0),
  onboarding_completo  boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre         text not null check (char_length(nombre) between 1 and 40),
  emoji          text not null check (char_length(emoji) between 1 and 16),
  color          text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  tipo           public.tipo_movimiento not null,
  clasificacion  public.clasificacion_gasto,
  orden          integer not null default 0,
  created_at     timestamptz not null default now(),
  -- Los gastos siempre se clasifican (50/30/20); los ingresos no.
  constraint categories_clasificacion_chk
    check ((tipo = 'gasto' and clasificacion is not null) or (tipo = 'ingreso' and clasificacion is null)),
  constraint categories_nombre_unico unique (user_id, tipo, nombre),
  constraint categories_id_user_unico unique (id, user_id)
);

-- -----------------------------------------------------------------------------
-- transactions
-- -----------------------------------------------------------------------------
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo         public.tipo_movimiento not null,
  monto        bigint not null check (monto > 0 and monto <= 1000000000000),
  category_id  uuid,
  nota         text check (nota is null or char_length(nota) <= 200),
  fecha        date not null default public.hoy_bogota(),
  created_at   timestamptz not null default now(),
  constraint transactions_category_fk
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete set null (category_id)
);

-- -----------------------------------------------------------------------------
-- recurring_expenses (gastos fijos)
-- -----------------------------------------------------------------------------
create table if not exists public.recurring_expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre       text not null check (char_length(nombre) between 1 and 60),
  monto        bigint not null check (monto > 0),
  dia_mes      smallint not null check (dia_mes between 1 and 31),
  category_id  uuid,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint recurring_category_fk
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete set null (category_id)
);

-- -----------------------------------------------------------------------------
-- savings_goals (Mi Jardín)
-- -----------------------------------------------------------------------------
create table if not exists public.savings_goals (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre               text not null check (char_length(nombre) between 1 and 60),
  emoji                text not null default '🌷' check (char_length(emoji) between 1 and 16),
  color                text not null default '#D97BA6' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  monto_objetivo       bigint not null check (monto_objetivo > 0),
  fecha_objetivo       date,
  estado               public.estado_meta not null default 'activa',
  es_fondo_emergencia  boolean not null default false,
  cumplida_at          timestamptz,
  created_at           timestamptz not null default now(),
  constraint savings_goals_id_user_unico unique (id, user_id)
);

-- -----------------------------------------------------------------------------
-- goal_contributions (abonos)
-- -----------------------------------------------------------------------------
create table if not exists public.goal_contributions (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  monto       bigint not null check (monto > 0),
  fecha       date not null default public.hoy_bogota(),
  nota        text check (nota is null or char_length(nota) <= 200),
  created_at  timestamptz not null default now(),
  constraint goal_contributions_goal_fk
    foreign key (goal_id, user_id)
    references public.savings_goals (id, user_id)
    on delete cascade
);

-- -----------------------------------------------------------------------------
-- budgets (límite mensual por categoría)
-- -----------------------------------------------------------------------------
create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id  uuid not null,
  mes          date not null check (extract(day from mes) = 1),
  limite       bigint not null check (limite > 0),
  created_at   timestamptz not null default now(),
  constraint budgets_category_fk
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete cascade,
  constraint budgets_unico unique (user_id, category_id, mes)
);

-- -----------------------------------------------------------------------------
-- achievements (logros)
-- -----------------------------------------------------------------------------
create table if not exists public.achievements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  codigo           text not null check (char_length(codigo) between 1 and 60),
  desbloqueado_at  timestamptz not null default now(),
  constraint achievements_unico unique (user_id, codigo)
);

-- -----------------------------------------------------------------------------
-- lesson_progress (Escuelita financiera)
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_slug    text not null check (char_length(lesson_slug) between 1 and 80),
  quiz_score     smallint check (quiz_score is null or quiz_score between 0 and 3),
  completado_at  timestamptz not null default now(),
  constraint lesson_progress_unico unique (user_id, lesson_slug)
);

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
create index if not exists transactions_user_fecha_idx      on public.transactions (user_id, fecha desc);
create index if not exists transactions_user_cat_fecha_idx  on public.transactions (user_id, category_id, fecha desc);
create index if not exists categories_user_orden_idx        on public.categories (user_id, tipo, orden);
create index if not exists recurring_user_idx               on public.recurring_expenses (user_id, activo);
create index if not exists goals_user_estado_idx            on public.savings_goals (user_id, estado);
create index if not exists contributions_user_fecha_idx     on public.goal_contributions (user_id, fecha desc);
create index if not exists contributions_goal_idx           on public.goal_contributions (goal_id);
create index if not exists budgets_user_mes_idx             on public.budgets (user_id, mes);

-- -----------------------------------------------------------------------------
-- updated_at automático en profiles
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Alta de usuaria: crea perfil + categorías por defecto
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), ''), 40)
  )
  on conflict (id) do nothing;

  insert into public.categories (user_id, nombre, emoji, color, tipo, clasificacion, orden)
  values
    (new.id, 'Belleza',    '💅', '#F4A7C3', 'gasto', 'gusto',     1),
    (new.id, 'Compras',    '🛍️', '#C9B6E4', 'gasto', 'gusto',     2),
    (new.id, 'Mercado',    '🍓', '#FF9AA8', 'gasto', 'necesidad', 3),
    (new.id, 'Transporte', '🚕', '#FFD3B6', 'gasto', 'necesidad', 4),
    (new.id, 'Antojos',    '☕', '#E8C4A8', 'gasto', 'gusto',     5),
    (new.id, 'Hogar',      '🏠', '#B8D8E8', 'gasto', 'necesidad', 6),
    (new.id, 'Salud',      '💊', '#8FD5B6', 'gasto', 'necesidad', 7),
    (new.id, 'Estudio',    '🎓', '#A8B8F0', 'gasto', 'necesidad', 8),
    (new.id, 'Regalos',    '🎁', '#F6C1D9', 'gasto', 'gusto',     9),
    (new.id, 'Otros',      '✨', '#E0D4DA', 'gasto', 'gusto',    10),
    (new.id, 'Salario',    '💼', '#8FD5B6', 'ingreso', null,      1),
    (new.id, 'Extras',     '💫', '#C9B6E4', 'ingreso', null,      2),
    (new.id, 'Regalos',    '🎀', '#F6D6E4', 'ingreso', null,      3)
  on conflict (user_id, tipo, nombre) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Vistas (security_invoker = respetan el RLS de quien consulta)
-- -----------------------------------------------------------------------------

-- Metas con su avance calculado desde los abonos.
create or replace view public.savings_goals_progress
with (security_invoker = true) as
select
  g.id,
  g.user_id,
  g.nombre,
  g.emoji,
  g.color,
  g.monto_objetivo,
  g.fecha_objetivo,
  g.estado,
  g.es_fondo_emergencia,
  g.cumplida_at,
  g.created_at,
  coalesce(sum(c.monto), 0)::bigint as monto_actual,
  least(100, round(coalesce(sum(c.monto), 0) * 100.0 / g.monto_objetivo, 1))::numeric(5, 1) as porcentaje
from public.savings_goals g
left join public.goal_contributions c on c.goal_id = g.id
group by g.id;

-- Resumen mensual: ingresos, gastos y balance.
create or replace view public.monthly_summary
with (security_invoker = true) as
select
  t.user_id,
  date_trunc('month', t.fecha)::date as mes,
  coalesce(sum(t.monto) filter (where t.tipo = 'ingreso'), 0)::bigint as ingresos,
  coalesce(sum(t.monto) filter (where t.tipo = 'gasto'), 0)::bigint   as gastos,
  (coalesce(sum(t.monto) filter (where t.tipo = 'ingreso'), 0)
   - coalesce(sum(t.monto) filter (where t.tipo = 'gasto'), 0))::bigint as balance,
  count(*)::integer as movimientos
from public.transactions t
group by t.user_id, date_trunc('month', t.fecha);

-- Gasto mensual por categoría (dona, presupuesto y detector de gastos hormiga).
create or replace view public.monthly_category_summary
with (security_invoker = true) as
select
  t.user_id,
  date_trunc('month', t.fecha)::date as mes,
  t.tipo,
  t.category_id,
  sum(t.monto)::bigint as total,
  count(*)::integer as cantidad,
  count(*) filter (where t.monto < 20000)::integer as cantidad_pequenos,
  coalesce(sum(t.monto) filter (where t.monto < 20000), 0)::bigint as total_pequenos
from public.transactions t
group by t.user_id, date_trunc('month', t.fecha), t.tipo, t.category_id;

-- Ahorro abonado por mes.
create or replace view public.monthly_savings
with (security_invoker = true) as
select
  c.user_id,
  date_trunc('month', c.fecha)::date as mes,
  sum(c.monto)::bigint as ahorrado,
  count(*)::integer as abonos
from public.goal_contributions c
group by c.user_id, date_trunc('month', c.fecha);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.transactions       enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.savings_goals      enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.budgets            enable row level security;
alter table public.achievements       enable row level security;
alter table public.lesson_progress    enable row level security;

-- profiles: la fila se crea por trigger; ella solo puede leer y editar la suya.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Política genérica "solo lo mío" para el resto de tablas.
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'transactions', 'recurring_expenses', 'savings_goals',
    'goal_contributions', 'budgets', 'achievements', 'lesson_progress'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)',
      t || '_own', t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Permisos explícitos (los proyectos nuevos de Supabase no los conceden por
-- defecto). El RLS de arriba sigue filtrando fila por fila.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;

grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;

grant select, insert, update, delete on
  public.categories,
  public.transactions,
  public.recurring_expenses,
  public.savings_goals,
  public.goal_contributions,
  public.budgets,
  public.achievements,
  public.lesson_progress
to authenticated;

grant select on
  public.savings_goals_progress,
  public.monthly_summary,
  public.monthly_category_summary,
  public.monthly_savings
to authenticated;

grant execute on function public.hoy_bogota() to authenticated;
