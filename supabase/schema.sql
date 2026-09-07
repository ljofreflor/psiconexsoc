-- PSICONEXSOC — cuentas, libro, reservas y códigos.
-- Pegar en el SQL editor de Supabase después de crear el proyecto.
-- Auth: habilitar Google, Azure (Microsoft) y, si hay Apple Developer, Apple.
-- Un correo = un usuario de Auth. El saldo se deriva de movimientos; nadie
-- escribe credito_clp en la fila del perfil.

create extension if not exists "pgcrypto";

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  correo text unique,
  nombre text,
  telefono text,
  es_equipo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.configuracion (
  clave text primary key,
  valor text
);

insert into public.configuracion (clave, valor) values
  ('honorario_clp', null)
on conflict (clave) do nothing;

create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  tipo text not null check (tipo in ('pago', 'codigo', 'cortesia', 'cargo_sesion', 'ajuste')),
  monto integer not null,
  reserva_id uuid,
  canje_id uuid,
  nota text,
  creado_por uuid references public.perfiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.bloques (
  id uuid primary key default gen_random_uuid(),
  profesional text not null,
  inicio timestamptz not null,
  fin timestamptz not null,
  tomado boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  bloque_id uuid references public.bloques (id),
  profesional text not null,
  inicio timestamptz not null,
  fin timestamptz not null,
  modalidad text not null default 'Por definir',
  sobre_cupo boolean not null default false,
  estado text not null default 'tomada' check (estado in ('tomada', 'movida')),
  created_at timestamptz not null default now()
);

alter table public.movimientos
  drop constraint if exists movimientos_reserva_id_fkey;
alter table public.movimientos
  add constraint movimientos_reserva_id_fkey
  foreign key (reserva_id) references public.reservas (id);

create table if not exists public.reagendamientos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  desde timestamptz not null,
  hacia timestamptz not null,
  mes date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  pasarela text,
  externo_id text,
  monto integer not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'acreditado', 'fallido')),
  created_at timestamptz not null default now()
);

create table if not exists public.codigos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  tipo text not null check (tipo in ('invitacion', 'campana', 'giftcard')),
  monto integer not null check (monto > 0),
  usos_max integer not null default 1,
  usos_hechos integer not null default 0,
  vence date,
  correo_opcional text,
  campana text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.canjes (
  id uuid primary key default gen_random_uuid(),
  codigo_id uuid not null references public.codigos (id),
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (codigo_id, perfil_id)
);

alter table public.movimientos
  drop constraint if exists movimientos_canje_id_fkey;
alter table public.movimientos
  add constraint movimientos_canje_id_fkey
  foreign key (canje_id) references public.canjes (id);

create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null,
  modalidad text,
  motivo text,
  created_at timestamptz not null default now()
);

create or replace view public.saldos as
  select perfil_id, coalesce(sum(monto), 0) as saldo
  from public.movimientos
  group by perfil_id;

create or replace function public.es_equipo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select es_equipo from public.perfiles where id = auth.uid()), false);
$$;

create or replace function public.honorario_vigente()
returns integer
language sql
stable
as $$
  select nullif(valor, '')::integer
  from public.configuracion
  where clave = 'honorario_clp';
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, correo, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set correo = excluded.correo;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.canjear_codigo(p_codigo text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.codigos%rowtype;
  v_canje uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Entrar primero';
  end if;
  select email into v_email from auth.users where id = auth.uid();
  select * into c from public.codigos
    where lower(codigo) = lower(trim(p_codigo))
    for update;
  if not found or c.activo is false then
    raise exception 'Código no válido';
  end if;
  if c.vence is not null and c.vence < current_date then
    raise exception 'Código vencido';
  end if;
  if c.usos_hechos >= c.usos_max then
    raise exception 'Código agotado';
  end if;
  if c.correo_opcional is not null and lower(c.correo_opcional) <> lower(v_email) then
    raise exception 'Este código está ligado a otro correo';
  end if;
  if exists (select 1 from public.canjes where codigo_id = c.id and perfil_id = auth.uid()) then
    raise exception 'Este código ya fue canjeado en esta cuenta';
  end if;
  insert into public.canjes (codigo_id, perfil_id)
    values (c.id, auth.uid())
    returning id into v_canje;
  update public.codigos set usos_hechos = usos_hechos + 1 where id = c.id;
  insert into public.movimientos (perfil_id, tipo, monto, canje_id, creado_por)
    values (auth.uid(), 'codigo', c.monto, v_canje, auth.uid());
  return c.monto;
end;
$$;

create or replace function public.reservar_bloque(p_bloque uuid, p_modalidad text, p_sobre_cupo boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bloques%rowtype;
  v_honorario integer;
  v_saldo integer;
  v_reserva uuid;
begin
  if auth.uid() is null then
    raise exception 'Entrar primero';
  end if;
  v_honorario := public.honorario_vigente();
  if v_honorario is null then
    raise exception 'El honorario aún no está definido';
  end if;
  select coalesce(sum(monto), 0) into v_saldo from public.movimientos where perfil_id = auth.uid();
  if v_saldo < v_honorario then
    raise exception 'Saldo insuficiente';
  end if;
  select * into b from public.bloques where id = p_bloque for update;
  if not found or b.tomado then
    raise exception 'Ese bloque ya no está disponible';
  end if;
  update public.bloques set tomado = true where id = b.id;
  insert into public.reservas (perfil_id, bloque_id, profesional, inicio, fin, modalidad, sobre_cupo)
    values (auth.uid(), b.id, b.profesional, b.inicio, b.fin, coalesce(nullif(p_modalidad, ''), 'Por definir'), coalesce(p_sobre_cupo, false))
    returning id into v_reserva;
  insert into public.movimientos (perfil_id, tipo, monto, reserva_id, creado_por)
    values (auth.uid(), 'cargo_sesion', -v_honorario, v_reserva, auth.uid());
  return v_reserva;
end;
$$;

create or replace function public.reagendar_reserva(p_reserva uuid, p_bloque uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservas%rowtype;
  b public.bloques%rowtype;
  v_usados integer;
  v_mes date;
begin
  if auth.uid() is null then
    raise exception 'Entrar primero';
  end if;
  v_mes := date_trunc('month', timezone('America/Santiago', now()))::date;
  select count(*) into v_usados
    from public.reagendamientos
    where perfil_id = auth.uid() and mes = v_mes;
  if v_usados >= 2 then
    raise exception 'Este mes ya se usaron los dos reagendamientos';
  end if;
  select * into r from public.reservas where id = p_reserva and perfil_id = auth.uid() for update;
  if not found or r.estado <> 'tomada' then
    raise exception 'No hay una hora para mover';
  end if;
  select * into b from public.bloques where id = p_bloque for update;
  if not found or b.tomado then
    raise exception 'Ese bloque ya no está disponible';
  end if;
  if r.bloque_id is not null then
    update public.bloques set tomado = false where id = r.bloque_id;
  end if;
  update public.bloques set tomado = true where id = b.id;
  insert into public.reagendamientos (reserva_id, perfil_id, desde, hacia, mes)
    values (r.id, auth.uid(), r.inicio, b.inicio, v_mes);
  update public.reservas
    set bloque_id = b.id, profesional = b.profesional, inicio = b.inicio, fin = b.fin
    where id = r.id;
end;
$$;

create or replace function public.cargar_credito(p_perfil uuid, p_monto integer, p_nota text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_equipo() then
    raise exception 'Solo el equipo';
  end if;
  if p_monto = 0 then
    raise exception 'Monto vacío';
  end if;
  insert into public.movimientos (perfil_id, tipo, monto, nota, creado_por)
    values (p_perfil, case when p_monto > 0 then 'cortesia' else 'ajuste' end, p_monto, p_nota, auth.uid());
end;
$$;

create or replace function public.registrar_pago(p_perfil uuid, p_monto integer, p_pasarela text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago uuid;
begin
  if not public.es_equipo() then
    raise exception 'Solo el equipo';
  end if;
  insert into public.pagos (perfil_id, pasarela, monto, estado)
    values (p_perfil, coalesce(p_pasarela, 'transferencia'), p_monto, 'acreditado')
    returning id into v_pago;
  insert into public.movimientos (perfil_id, tipo, monto, nota, creado_por)
    values (p_perfil, 'pago', p_monto, 'pago ' || coalesce(p_pasarela, 'transferencia'), auth.uid());
  return v_pago;
end;
$$;

create or replace function public.emitir_codigo(
  p_codigo text,
  p_tipo text,
  p_monto integer,
  p_usos integer,
  p_vence date,
  p_correo text,
  p_campana text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.es_equipo() then
    raise exception 'Solo el equipo';
  end if;
  insert into public.codigos (codigo, tipo, monto, usos_max, vence, correo_opcional, campana)
    values (trim(p_codigo), p_tipo, p_monto, coalesce(p_usos, 1), p_vence, nullif(p_correo, ''), nullif(p_campana, ''))
    returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.enviar_solicitud(
  p_nombre text,
  p_correo text,
  p_modalidad text,
  p_motivo text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.solicitudes (nombre, correo, modalidad, motivo)
    values (trim(p_nombre), trim(p_correo), p_modalidad, nullif(trim(p_motivo), ''))
    returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.enviar_solicitud(text, text, text, text) to anon, authenticated;
grant execute on function public.canjear_codigo(text) to authenticated;
grant execute on function public.reservar_bloque(uuid, text, boolean) to authenticated;
grant execute on function public.reagendar_reserva(uuid, uuid) to authenticated;
grant execute on function public.cargar_credito(uuid, integer, text) to authenticated;
grant execute on function public.registrar_pago(uuid, integer, text) to authenticated;
grant execute on function public.emitir_codigo(text, text, integer, integer, date, text, text) to authenticated;
grant execute on function public.honorario_vigente() to anon, authenticated;
grant execute on function public.es_equipo() to authenticated;

alter table public.perfiles enable row level security;
alter table public.movimientos enable row level security;
alter table public.reservas enable row level security;
alter table public.reagendamientos enable row level security;
alter table public.pagos enable row level security;
alter table public.codigos enable row level security;
alter table public.canjes enable row level security;
alter table public.bloques enable row level security;
alter table public.solicitudes enable row level security;
alter table public.configuracion enable row level security;

create policy perfiles_propios on public.perfiles
  for select using (id = auth.uid() or public.es_equipo());
create policy perfiles_update_propio on public.perfiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

revoke update on public.perfiles from authenticated;
grant update (nombre, telefono) on public.perfiles to authenticated;

create policy mov_propios on public.movimientos
  for select using (perfil_id = auth.uid() or public.es_equipo());

create policy res_propias on public.reservas
  for select using (perfil_id = auth.uid() or public.es_equipo());

create policy reage_propios on public.reagendamientos
  for select using (perfil_id = auth.uid() or public.es_equipo());

create policy pagos_propios on public.pagos
  for select using (perfil_id = auth.uid() or public.es_equipo());

create policy canjes_propios on public.canjes
  for select using (perfil_id = auth.uid() or public.es_equipo());

create policy bloques_libres on public.bloques
  for select using (true);

create policy bloques_equipo on public.bloques
  for all using (public.es_equipo()) with check (public.es_equipo());

create policy config_lectura on public.configuracion
  for select using (true);

create policy config_equipo on public.configuracion
  for all using (public.es_equipo()) with check (public.es_equipo());

create policy solicitudes_equipo on public.solicitudes
  for select using (public.es_equipo());

create policy codigos_equipo_select on public.codigos
  for select using (public.es_equipo());
create policy codigos_equipo_write on public.codigos
  for all using (public.es_equipo()) with check (public.es_equipo());

grant usage on schema public to anon, authenticated;
grant select on public.configuracion, public.bloques to anon, authenticated;
grant select, insert, update, delete on public.bloques, public.configuracion, public.codigos to authenticated;
grant select on public.perfiles, public.movimientos, public.reservas, public.reagendamientos, public.pagos, public.canjes, public.solicitudes to authenticated;
grant insert, update on public.perfiles to authenticated;
