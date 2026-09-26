-- Pedidos de hora desde la web → notificación al secretario (teléfono + correo).
-- Aplicar en el SQL editor de Supabase (o supabase db push).

create table if not exists public.pedidos_hora (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('orientacion', 'sesion')),
  nombre text not null,
  correo text not null,
  telefono text,
  modalidad text,
  franjas text not null,
  nota text,
  origen text default 'agenda',
  notificado_tel boolean not null default false,
  notificado_email boolean not null default false,
  error_notif text,
  created_at timestamptz not null default now()
);

create index if not exists pedidos_hora_created_at_idx on public.pedidos_hora (created_at desc);
create index if not exists pedidos_hora_correo_idx on public.pedidos_hora (correo);

alter table public.pedidos_hora enable row level security;

drop policy if exists pedidos_hora_equipo on public.pedidos_hora;
create policy pedidos_hora_equipo on public.pedidos_hora
  for select using (public.es_equipo());

-- Solo el service role (Edge Function) inserta; el anon no escribe directo.
revoke all on public.pedidos_hora from anon, authenticated;
grant select on public.pedidos_hora to authenticated;

comment on table public.pedidos_hora is
  'Pedidos de hora desde el sitio. El cobro no vive aquí: solo aviso al secretario.';
