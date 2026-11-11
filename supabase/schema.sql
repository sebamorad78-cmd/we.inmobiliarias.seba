-- Esquema para producción en Supabase (Postgres).
-- Ejecutar una sola vez en: Supabase → SQL Editor → New query → Run.
-- Los tipos numéricos son integer / double precision para que lleguen como números a la app.

create table if not exists public.team_users (
  id            text primary key,
  name          text not null,
  email         text not null unique,
  phone         text not null default '',
  role          text not null check (role in ('admin','agente')),
  title         text not null default '',
  license       text,
  bio           text not null default '',
  active        boolean not null default true,
  public        boolean not null default true,
  password_hash text not null default '',
  created_at    timestamptz not null default now()
);

create table if not exists public.properties (
  id                  text primary key,
  slug                text not null unique,
  code                text not null unique,
  title               text not null,
  operation           text not null check (operation in ('venta','alquiler','temporario')),
  type                text not null,
  status              text not null check (status in ('publicada','reservada','vendida','borrador')),
  featured            boolean not null default false,
  price               bigint,
  currency            text not null check (currency in ('USD','ARS')),
  expenses            bigint,
  neighborhood        text not null,
  city                text not null,
  address             text not null default '',
  show_exact_location boolean not null default false,
  lat                 double precision,
  lng                 double precision,
  covered_area        integer,
  total_area          integer,
  rooms               integer,
  bedrooms            integer,
  bathrooms           integer,
  garages             integer,
  age                 integer,
  floor               text,
  orientation         text,
  mortgage_eligible   boolean not null default false,
  professional_use    boolean not null default false,
  amenities           text[] not null default '{}',
  description         text not null default '',
  images              jsonb not null default '[]',
  video_url           text,
  tour_url            text,
  agent_id            text references public.team_users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists properties_listing_idx on public.properties (status, operation, type);

create table if not exists public.leads (
  id             text primary key,
  created_at     timestamptz not null default now(),
  kind           text not null,
  status         text not null default 'nuevo',
  name           text not null,
  email          text not null default '',
  phone          text not null default '',
  message        text not null default '',
  property_id    text references public.properties(id) on delete set null,
  preferred_date text,
  details        jsonb not null default '{}',
  assigned_to    text references public.team_users(id) on delete set null,
  notes          text not null default '',
  source         text not null default ''
);
create index if not exists leads_created_idx on public.leads (created_at desc);

-- Datos internos de cada propiedad (propietario y autorización de venta).
alter table public.properties add column if not exists owner_contact_id text;
alter table public.properties add column if not exists mandate jsonb;

-- CRM: contactos, agenda, oportunidades, actividad y contratos.
create table if not exists public.crm_records (
  collection text not null,
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
create index if not exists crm_records_collection_idx on public.crm_records (collection, updated_at desc);

-- La app accede solo desde el servidor con la service role key.
-- Activar RLS sin políticas bloquea cualquier acceso directo con la clave pública.
alter table public.team_users enable row level security;
alter table public.properties enable row level security;
alter table public.leads      enable row level security;
alter table public.crm_records enable row level security;

-- Bucket público de imágenes (lectura pública, escritura solo desde el servidor).
insert into storage.buckets (id, name, public)
values ('propiedades', 'propiedades', true)
on conflict (id) do nothing;
