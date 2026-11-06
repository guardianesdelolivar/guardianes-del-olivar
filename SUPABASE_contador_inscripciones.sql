-- =============================================================
-- GUARDIANES DEL OLIVAR · Contador de inscritos e inscripción única
-- Pégalo en Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar una sola vez; no borra ningún dato.
-- =============================================================

-- 1) Una sola inscripción por cuenta y operación.
--    Si da error "could not create unique index", es que ya hay alguna
--    cuenta inscrita dos veces en la misma operación: avísame y lo vemos.
alter table public.inscripciones_registro
  add constraint inscripciones_registro_usuario_operacion_unica
  unique (user_id, operacion_id);

-- 2) Recuento público de inscritos por operación.
--    Devuelve solo el número, nunca quién se ha apuntado.
create or replace function public.contar_inscritos(op text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.inscripciones_registro
  where operacion_id = op;
$$;

grant execute on function public.contar_inscritos(text) to anon, authenticated;
