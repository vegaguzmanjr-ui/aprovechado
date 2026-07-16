-- ═══════════════════════════════════════════════
-- Aprovecha.do — Esquema de base de datos (Supabase)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text,
  telefono text,
  rol text not null default 'vendedor' check (rol in ('vendedor','admin')),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre) values (new.id, new.raw_user_meta_data->>'nombre');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles(id) on delete cascade,
  tipo text not null check (tipo in ('negocio','franquicia')),
  nombre text not null,
  categoria text not null,
  ciudad text not null,
  precio numeric not null check (precio > 0),
  ingresos text,
  empleados int,
  anos int,
  descripcion text,
  telefono text not null,
  whatsapp text,
  cuota_franquicia text,
  regalias text,
  fotos text[] default '{}',
  plan text check (plan in ('estandar','destacado')),
  destacado boolean not null default false,
  verificado boolean not null default false,
  estado text not null default 'borrador'
    check (estado in ('borrador','pendiente','activo','pausado','rechazado','vencido')),
  vistas int not null default 0,
  vence_at timestamptz,
  created_at timestamptz default now()
);
create index listings_estado_idx on public.listings (estado, tipo, destacado desc);

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  owner uuid references public.profiles(id),
  plan text not null,
  monto numeric not null,
  moneda text not null default 'DOP',
  metodo text not null default 'azul' check (metodo in ('azul','transferencia')),
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','rechazado')),
  referencia_azul text,
  created_at timestamptz default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and rol = 'admin');
$$;

create or replace function public.increment_views(listing uuid)
returns void language sql security definer set search_path = public as $$
  update listings set vistas = vistas + 1 where id = listing and estado = 'activo';
$$;

-- Cron sugerido (Supabase → Integrations → Cron, diario):
-- update listings set estado='vencido' where estado='activo' and vence_at < now();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.pagos enable row level security;

create policy "perfil propio" on profiles for select using (auth.uid() = id or is_admin());
create policy "editar perfil propio" on profiles for update using (auth.uid() = id);

create policy "ver activos o propios" on listings for select
  using (estado = 'activo' or owner = auth.uid() or is_admin());
create policy "crear propios" on listings for insert with check (owner = auth.uid());
create policy "editar propios o admin" on listings for update
  using (owner = auth.uid() or is_admin());
create policy "borrar admin" on listings for delete using (is_admin());

create policy "pagos propios o admin" on pagos for select using (owner = auth.uid() or is_admin());
create policy "crear pago propio" on pagos for insert with check (owner = auth.uid());
create policy "actualizar pagos admin" on pagos for update using (is_admin());

insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true);
create policy "fotos publicas" on storage.objects for select using (bucket_id = 'fotos');
create policy "subir fotos autenticado" on storage.objects for insert
  with check (bucket_id = 'fotos' and auth.role() = 'authenticated');

-- Primer admin: ejecutar tras registrarte con tu correo
-- update profiles set rol = 'admin' where id = (select id from auth.users where email = 'TU-CORREO@aprovecha.do');
