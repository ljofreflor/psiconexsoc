import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Twilio } from 'https://esm.sh/twilio@4.19.0'

/**
 * Sistema de Recordatorios Automatizados
 * 
 * Este Edge Function se ejecuta cada hora (configurar con pg_cron) y envía
 * recordatorios SMS/Email/WhatsApp en múltiples puntos:
 * - 72 horas antes: Reminder inicial
 * - 24 horas antes: Reminder con WhatsApp
 * - 2 horas antes: Confirmación final
 * 
 * Deploy: supabase functions deploy enviar-recordatorios
 * Cron: SELECT cron.schedule('enviar-recordatorios', '0 * * * *', 'SELECT net.http_post(...)')
 */

const twilioClient = new Twilio(
  Deno.env.get('TWILIO_ACCOUNT_SID'),
  Deno.env.get('TWILIO_AUTH_TOKEN')
)

const TWILIO_PHONE = Deno.env.get('TWILIO_PHONE_NUMBER')
const TWILIO_WHATSAPP = Deno.env.get('TWILIO_WHATSAPP_NUMBER') // whatsapp:+14155238886
const PUBLIC_URL = Deno.env.get('PUBLIC_SITE_URL')

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const ahora = new Date()
    
    // Calcular ventanas de tiempo
    const en72Horas = new Date(ahora.getTime() + 72 * 60 * 60 * 1000)
    const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
    const en2Horas = new Date(ahora.getTime() + 2 * 60 * 60 * 1000)
    
    // Buscar reservas que necesitan recordatorios
    const { data: reservasPara72h } = await buscarReservasParaRecordatorio(
      supabaseClient,
      en72Horas,
      '72h'
    )
    
    const { data: reservasPara24h } = await buscarReservasParaRecordatorio(
      supabaseClient,
      en24Horas,
      '24h'
    )
    
    const { data: reservasPara2h } = await buscarReservasParaRecordatorio(
      supabaseClient,
      en2Horas,
      '2h'
    )
    
    const resultados = {
      enviados_72h: 0,
      enviados_24h: 0,
      enviados_2h: 0,
      errores: []
    }
    
    // Enviar recordatorios de 72 horas (SMS + Email)
    for (const reserva of reservasPara72h || []) {
      try {
        await enviarRecordatorio72h(supabaseClient, reserva)
        resultados.enviados_72h++
      } catch (error) {
        resultados.errores.push({
          reserva_id: reserva.id,
          error: error.message
        })
      }
    }
    
    // Enviar recordatorios de 24 horas (WhatsApp + Email)
    for (const reserva of reservasPara24h || []) {
      try {
        await enviarRecordatorio24h(supabaseClient, reserva)
        resultados.enviados_24h++
      } catch (error) {
        resultados.errores.push({
          reserva_id: reserva.id,
          error: error.message
        })
      }
    }
    
    // Enviar recordatorios de 2 horas (SMS urgente)
    for (const reserva of reservasPara2h || []) {
      try {
        await enviarRecordatorio2h(supabaseClient, reserva)
        resultados.enviados_2h++
      } catch (error) {
        resultados.errores.push({
          reserva_id: reserva.id,
          error: error.message
        })
      }
    }
    
    return new Response(JSON.stringify(resultados), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Buscar reservas que necesitan recordatorio
 */
async function buscarReservasParaRecordatorio(supabase, fechaObjetivo, ventana) {
  // Buscar reservas en la ventana de tiempo que aún no han recibido este recordatorio
  const margenMin = new Date(fechaObjetivo.getTime() - 30 * 60 * 1000) // -30min
  const margenMax = new Date(fechaObjetivo.getTime() + 30 * 60 * 1000) // +30min
  
  return await supabase
    .from('reservas')
    .select(`
      id,
      perfil_id,
      profesional,
      inicio,
      fin,
      perfiles!inner (
        correo,
        telefono,
        nombre
      ),
      recordatorios:recordatorios_enviados!left (
        ventana
      )
    `)
    .eq('estado', 'tomada')
    .eq('asistencia', 'pendiente')
    .gte('inicio', margenMin.toISOString())
    .lte('inicio', margenMax.toISOString())
    .is('recordatorios.ventana', null) // No ha recibido este recordatorio
}

/**
 * Enviar recordatorio 72 horas antes (SMS + Email)
 */
async function enviarRecordatorio72h(supabase, reserva) {
  const perfil = reserva.perfiles
  const fechaFormateada = formatearFecha(reserva.inicio)
  const linkReagendar = generarLinkReagendar(reserva.id)
  
  // Generar magic link para reagendar en un toque
  const { data: magicLink } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: perfil.correo,
    options: {
      redirectTo: `${PUBLIC_URL}/cuenta/reagendar?reserva=${reserva.id}`
    }
  })
  
  // Enviar SMS
  if (perfil.telefono) {
    await twilioClient.messages.create({
      from: TWILIO_PHONE,
      to: perfil.telefono,
      body: `Hola ${perfil.nombre}! Te recordamos tu sesión con ${reserva.profesional} el ${fechaFormateada}. ¿Necesitas reagendar? ${magicLink.properties.action_link}`
    })
  }
  
  // Enviar Email (usando Supabase Auth emails o servicio personalizado)
  await enviarEmail({
    to: perfil.correo,
    subject: `Recordatorio: Tu sesión el ${fechaFormateada}`,
    html: plantillaEmail72h(perfil.nombre, reserva.profesional, fechaFormateada, magicLink.properties.action_link)
  })
  
  // Registrar envío
  await registrarRecordatorioEnviado(supabase, reserva.id, '72h')
}

/**
 * Enviar recordatorio 24 horas antes (WhatsApp + Email)
 */
async function enviarRecordatorio24h(supabase, reserva) {
  const perfil = reserva.perfiles
  const fechaFormateada = formatearFecha(reserva.inicio)
  
  const { data: magicLink } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: perfil.correo,
    options: {
      redirectTo: `${PUBLIC_URL}/cuenta/reagendar?reserva=${reserva.id}`
    }
  })
  
  // Enviar WhatsApp
  if (perfil.telefono) {
    await twilioClient.messages.create({
      from: TWILIO_WHATSAPP,
      to: `whatsapp:${perfil.telefono}`,
      body: `🔔 PSICONEXSOC: Mañana tienes tu sesión con ${reserva.profesional} a las ${formatearHora(reserva.inicio)}. ¿Necesitas cambiar la hora? Reagenda aquí: ${magicLink.properties.action_link}`
    })
  }
  
  // Email de refuerzo
  await enviarEmail({
    to: perfil.correo,
    subject: `Mañana: Tu sesión con ${reserva.profesional}`,
    html: plantillaEmail24h(perfil.nombre, reserva.profesional, fechaFormateada, magicLink.properties.action_link)
  })
  
  await registrarRecordatorioEnviado(supabase, reserva.id, '24h')
}

/**
 * Enviar recordatorio 2 horas antes (SMS urgente)
 */
async function enviarRecordatorio2h(supabase, reserva) {
  const perfil = reserva.perfiles
  const horaFormateada = formatearHora(reserva.inicio)
  
  if (perfil.telefono) {
    await twilioClient.messages.create({
      from: TWILIO_PHONE,
      to: perfil.telefono,
      body: `🕐 En 2 horas: Tu sesión con ${reserva.profesional} a las ${horaFormateada}. Nos vemos pronto!`
    })
  }
  
  await registrarRecordatorioEnviado(supabase, reserva.id, '2h')
}

/**
 * Registrar que se envió un recordatorio
 */
async function registrarRecordatorioEnviado(supabase, reservaId, ventana) {
  await supabase
    .from('recordatorios_enviados')
    .insert({
      reserva_id: reservaId,
      ventana: ventana,
      enviado_at: new Date().toISOString()
    })
}

/**
 * Generar link mágico para reagendar en un toque
 */
function generarLinkReagendar(reservaId) {
  return `${PUBLIC_URL}/cuenta/reagendar?r=${reservaId}`
}

/**
 * Formatear fecha legible
 */
function formatearFecha(isoString) {
  return new Date(isoString).toLocaleString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatearHora(isoString) {
  return new Date(isoString).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Plantillas de email
 */
function plantillaEmail72h(nombre, profesional, fecha, linkReagendar) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Inter, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #eb6608; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; background: #eb6608; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; color: #929292; font-size: 14px; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PSICONEXSOC</h1>
    </div>
    <div class="content">
      <p>Hola ${nombre},</p>
      <p>Te recordamos que tienes una sesión programada:</p>
      <ul>
        <li><strong>Con:</strong> ${profesional}</li>
        <li><strong>Fecha:</strong> ${fecha}</li>
      </ul>
      <p>Si necesitas reagendar, puedes hacerlo en un clic:</p>
      <a href="${linkReagendar}" class="button">Reagendar mi hora</a>
      <p><small>Reagendar es posible solo con al menos 48 horas de anticipación.</small></p>
    </div>
    <div class="footer">
      <p>PSICONEXSOC — La palabra tiene efectos</p>
      <p><a href="tel:+56981216395">+56 9 8121 6395</a></p>
    </div>
  </div>
</body>
</html>
  `
}

function plantillaEmail24h(nombre, profesional, fecha, linkReagendar) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Inter, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #eb6608; color: white; padding: 20px; text-align: center; }
    .alert { background: #fff3e0; border-left: 4px solid #eb6608; padding: 15px; margin: 20px 0; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; background: #eb6608; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Mañana es tu sesión</h1>
    </div>
    <div class="content">
      <p>Hola ${nombre},</p>
      <div class="alert">
        <strong>Mañana tienes tu sesión con ${profesional}</strong><br>
        ${fecha}
      </div>
      <p>¿Necesitas cambiar la hora? Hazlo ahora:</p>
      <a href="${linkReagendar}" class="button">Reagendar</a>
      <p><small><strong>Importante:</strong> Reagendar solo es posible con al menos 48 horas de anticipación.</small></p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Enviar email (integración con servicio de email)
 */
async function enviarEmail(config) {
  // Implementar con Resend, SendGrid, o servicio preferido
  // Por ahora, placeholder
  console.log('Email enviado:', config.to, config.subject)
}
