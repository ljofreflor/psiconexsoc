-- Migration: Sistema de Depósitos para Reducir No-Shows
-- Fecha: 2026-09-13
-- Descripción: Agrega campos para depósitos, reembolsos y tracking de pagos adelantados

-- 1. Agregar campos a la tabla reservas para tracking de depósitos
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS requiere_deposito BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposito_monto INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deposito_estado TEXT CHECK (deposito_estado IN ('pendiente', 'pagado', 'reembolsado', 'no_devuelto', 'exento')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS es_primera_sesion BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS asistencia TEXT CHECK (asistencia IN ('pendiente', 'asistio', 'no_asistio', 'cancelo_a_tiempo', 'cancelo_tarde')) DEFAULT 'pendiente';

-- 2. Crear tabla para tracking de transacciones de depósito
CREATE TABLE IF NOT EXISTS public.depositos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID NOT NULL REFERENCES public.reservas (id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  monto INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'reembolsado', 'no_devuelto', 'aplicado_credito')),
  payment_intent_id TEXT,
  pasarela TEXT CHECK (pasarela IN ('transbank', 'stripe', 'manual')),
  metadata JSONB DEFAULT '{}'::jsonb,
  fecha_pago TIMESTAMPTZ,
  fecha_reembolso TIMESTAMPTZ,
  motivo_no_reembolso TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_reservas_deposito_estado ON public.reservas (deposito_estado);
CREATE INDEX IF NOT EXISTS idx_reservas_asistencia ON public.reservas (asistencia);
CREATE INDEX IF NOT EXISTS idx_depositos_estado ON public.depositos (estado);
CREATE INDEX IF NOT EXISTS idx_depositos_perfil_id ON public.depositos (perfil_id);
CREATE INDEX IF NOT EXISTS idx_depositos_reserva_id ON public.depositos (reserva_id);

-- 4. Agregar política de cancelación en configuración
INSERT INTO public.configuracion (clave, valor) VALUES
  ('deposito_porcentaje_primera', '0'), -- Orientación: sin anticipo
  ('deposito_porcentaje_regulares', '100'), -- Sesión: anticipo = honorario completo
  ('politica_cancelacion_horas', '48'), -- Reagendar solo con ≥48 h
  ('politica_reembolso_parcial', '0') -- <48 h: no reagenda; honorario corresponde
ON CONFLICT (clave) DO NOTHING;

-- 5. Función para calcular si una reserva requiere depósito
CREATE OR REPLACE FUNCTION calcular_requiere_deposito(
  p_perfil_id UUID,
  p_inicio TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  sesiones_previas INTEGER;
BEGIN
  -- Contar sesiones previas del perfil
  SELECT COUNT(*)
  INTO sesiones_previas
  FROM public.reservas
  WHERE perfil_id = p_perfil_id
    AND inicio < p_inicio
    AND estado IN ('tomada', 'movida');
  
  -- Primera sesión: no requiere depósito
  IF sesiones_previas = 0 THEN
    RETURN false;
  END IF;
  
  -- Sesiones subsecuentes: sí requieren depósito
  RETURN true;
END;
$$;

-- 6. Función para procesar reembolso automático si asiste
CREATE OR REPLACE FUNCTION procesar_reembolso_asistencia()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deposito_id UUID;
  v_monto INTEGER;
BEGIN
  -- Solo procesar si cambió a "asistió" y había depósito pagado
  IF NEW.asistencia = 'asistio' AND OLD.asistencia != 'asistio' 
     AND NEW.deposito_estado = 'pagado' THEN
    
    -- Buscar el depósito asociado
    SELECT id, monto INTO v_deposito_id, v_monto
    FROM public.depositos
    WHERE reserva_id = NEW.id
      AND estado = 'pagado'
    LIMIT 1;
    
    IF v_deposito_id IS NOT NULL THEN
      -- Actualizar estado del depósito a "aplicado_credito"
      UPDATE public.depositos
      SET estado = 'aplicado_credito',
          updated_at = now()
      WHERE id = v_deposito_id;
      
      -- Crear movimiento de crédito para el perfil
      INSERT INTO public.movimientos (perfil_id, tipo, monto, reserva_id, nota)
      VALUES (
        NEW.perfil_id,
        'pago',
        v_monto,
        NEW.id,
        'Depósito convertido a crédito por asistencia confirmada'
      );
      
      -- Actualizar estado en la reserva
      UPDATE public.reservas
      SET deposito_estado = 'reembolsado'
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Trigger para reembolso automático
DROP TRIGGER IF EXISTS trigger_reembolso_asistencia ON public.reservas;
CREATE TRIGGER trigger_reembolso_asistencia
  AFTER UPDATE ON public.reservas
  FOR EACH ROW
  EXECUTE FUNCTION procesar_reembolso_asistencia();

-- 8. Vista para dashboard de métricas
CREATE OR REPLACE VIEW public.metricas_no_shows AS
SELECT
  DATE_TRUNC('month', inicio) AS mes,
  COUNT(*) AS total_reservas,
  COUNT(*) FILTER (WHERE asistencia = 'asistio') AS asistencias,
  COUNT(*) FILTER (WHERE asistencia = 'no_asistio') AS no_shows,
  COUNT(*) FILTER (WHERE asistencia = 'cancelo_a_tiempo') AS cancelaciones_a_tiempo,
  COUNT(*) FILTER (WHERE asistencia = 'cancelo_tarde') AS cancelaciones_tarde,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE asistencia = 'no_asistio') / NULLIF(COUNT(*), 0),
    2
  ) AS tasa_no_show_porcentaje,
  SUM(deposito_monto) FILTER (WHERE deposito_estado = 'no_devuelto') AS ingresos_protegidos_depositos
FROM public.reservas
WHERE inicio >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')
  AND NOT es_primera_sesion
GROUP BY DATE_TRUNC('month', inicio)
ORDER BY mes DESC;

-- 9. Comentarios para documentación
COMMENT ON COLUMN public.reservas.requiere_deposito IS 'Si esta reserva requiere depósito (false para primera sesión)';
COMMENT ON COLUMN public.reservas.deposito_monto IS 'Monto del depósito en CLP (30-50% del valor de la sesión)';
COMMENT ON COLUMN public.reservas.deposito_estado IS 'Estado del depósito: pendiente, pagado, reembolsado, no_devuelto, exento';
COMMENT ON COLUMN public.reservas.es_primera_sesion IS 'True si es la primera sesión del usuario (gratis, sin depósito)';
COMMENT ON COLUMN public.reservas.asistencia IS 'Tracking de asistencia para métricas y reembolsos';
COMMENT ON TABLE public.depositos IS 'Tracking detallado de transacciones de depósitos';
COMMENT ON VIEW public.metricas_no_shows IS 'Vista agregada para dashboard de métricas de no-shows';

-- 10. RLS (Row Level Security) policies
ALTER TABLE public.depositos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios depósitos"
  ON public.depositos
  FOR SELECT
  USING (auth.uid() = perfil_id);

CREATE POLICY "El equipo puede ver todos los depósitos"
  ON public.depositos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND es_equipo = true
    )
  );

-- ========================================
-- FASE 3: Sistema de Recordatorios y Lista de Espera
-- ========================================

-- Tabla para trackear recordatorios enviados
CREATE TABLE IF NOT EXISTS public.recordatorios_enviados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID NOT NULL REFERENCES public.reservas (id) ON DELETE CASCADE,
  ventana TEXT NOT NULL CHECK (ventana IN ('72h', '24h', '2h')),
  enviado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reserva_id, ventana)
);

CREATE INDEX IF NOT EXISTS idx_recordatorios_reserva ON public.recordatorios_enviados (reserva_id);
CREATE INDEX IF NOT EXISTS idx_recordatorios_enviado_at ON public.recordatorios_enviados (enviado_at);

-- Tabla para lista de espera
CREATE TABLE IF NOT EXISTS public.lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfiles (id) ON DELETE CASCADE,
  profesional TEXT,
  dias_preferidos TEXT[] DEFAULT '{}',
  horarios_preferidos TEXT[] DEFAULT '{}',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lista_espera_perfil ON public.lista_espera (perfil_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_activo ON public.lista_espera (activo);

-- Tabla para notificaciones de lista de espera
CREATE TABLE IF NOT EXISTS public.notificaciones_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_espera_id UUID NOT NULL REFERENCES public.lista_espera (id) ON DELETE CASCADE,
  bloque_id UUID NOT NULL REFERENCES public.bloques (id),
  enviada_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  respondida BOOLEAN NOT NULL DEFAULT false,
  reserva_tomada UUID REFERENCES public.reservas (id)
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_lista_espera ON public.notificaciones_espera (lista_espera_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_respondida ON public.notificaciones_espera (respondida);

-- Función para notificar lista de espera cuando se libera un slot
CREATE OR REPLACE FUNCTION notificar_lista_espera_slot_libre()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_lista_espera RECORD;
  v_dia_semana TEXT;
  v_hora_inicio TEXT;
BEGIN
  -- Solo ejecutar si se liberó un bloque (tomado: true -> false)
  IF OLD.tomado = true AND NEW.tomado = false THEN
    
    -- Obtener día de la semana y hora del bloque liberado
    v_dia_semana := TO_CHAR(NEW.inicio, 'Day');
    v_hora_inicio := TO_CHAR(NEW.inicio, 'HH24');
    
    -- Buscar usuarios en lista de espera que coincidan
    FOR v_lista_espera IN
      SELECT * FROM public.lista_espera
      WHERE activo = true
        AND (profesional IS NULL OR profesional = NEW.profesional)
        AND (
          dias_preferidos = '{}' 
          OR v_dia_semana = ANY(dias_preferidos)
        )
        AND (
          horarios_preferidos = '{}' 
          OR (
            (v_hora_inicio::INTEGER >= 6 AND v_hora_inicio::INTEGER < 12 AND 'morning' = ANY(horarios_preferidos))
            OR (v_hora_inicio::INTEGER >= 12 AND v_hora_inicio::INTEGER < 18 AND 'afternoon' = ANY(horarios_preferidos))
            OR (v_hora_inicio::INTEGER >= 18 AND v_hora_inicio::INTEGER < 22 AND 'evening' = ANY(horarios_preferidos))
          )
        )
      ORDER BY created_at ASC
      LIMIT 5
    LOOP
      -- Registrar notificación
      INSERT INTO public.notificaciones_espera (lista_espera_id, bloque_id)
      VALUES (v_lista_espera.id, NEW.id);
      
      -- Aquí se debería llamar a una Edge Function para enviar notificación
      -- Ejemplo: net.http_post('https://xxx.supabase.co/functions/v1/notificar-slot-disponible', ...)
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificaciones automáticas de lista de espera
DROP TRIGGER IF EXISTS trigger_notificar_lista_espera ON public.bloques;
CREATE TRIGGER trigger_notificar_lista_espera
  AFTER UPDATE ON public.bloques
  FOR EACH ROW
  EXECUTE FUNCTION notificar_lista_espera_slot_libre();

-- RLS para lista de espera
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_espera ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordatorios_enviados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propia lista de espera"
  ON public.lista_espera
  FOR SELECT
  USING (auth.uid() = perfil_id);

CREATE POLICY "Los usuarios pueden crear su propia lista de espera"
  ON public.lista_espera
  FOR INSERT
  WITH CHECK (auth.uid() = perfil_id);

CREATE POLICY "Los usuarios pueden actualizar su propia lista de espera"
  ON public.lista_espera
  FOR UPDATE
  USING (auth.uid() = perfil_id);

CREATE POLICY "El equipo puede ver toda la lista de espera"
  ON public.lista_espera
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND es_equipo = true
    )
  );

COMMENT ON TABLE public.recordatorios_enviados IS 'Trackeo de recordatorios SMS/Email enviados';
COMMENT ON TABLE public.lista_espera IS 'Lista de espera de usuarios para slots disponibles';
COMMENT ON TABLE public.notificaciones_espera IS 'Notificaciones enviadas cuando se libera un slot';
