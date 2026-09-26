/**
 * notificar-pedido-hora
 *
 * Recibe un pedido de hora desde agenda.html (sin cobro).
 * 1) Guarda el pedido en public.pedidos_hora
 * 2) Notifica al secretario por WhatsApp o SMS (Twilio)
 * 3) Envía copia por correo (Resend) a SECRETARIO_EMAIL
 * 4) Opcional: acuse al correo de quien pide
 *
 * Deploy:
 *   supabase functions deploy notificar-pedido-hora --no-verify-jwt
 *
 * Secrets (supabase secrets set ...):
 *   SECRETARIO_TELEFONO=+56981216395
 *   SECRETARIO_EMAIL=secretario@tudominio.cl
 *   TWILIO_ACCOUNT_SID=...
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_FROM=+1...          (SMS)  o
 *   TWILIO_WHATSAPP=whatsapp:+14155238886
 *   RESEND_API_KEY=re_...
 *   RESEND_FROM=PSICONEXSOC <noreply@tudominio.cl>
 *   (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase)
 *
 * El honorario NO se cobra aquí. Solo llega el aviso humano.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function limpio(s: unknown, max = 500) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function emailOk(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function telNorm(s: string) {
  const d = s.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("56")) return "+" + d;
  if (d.startsWith("9") && d.length === 9) return "+56" + d;
  return d ? "+56" + d.replace(/^0/, "") : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json(405, { error: "POST only" });
  }

  const secretarioTel =
    Deno.env.get("SECRETARIO_TELEFONO") || "+56981216395";
  const secretarioEmail = Deno.env.get("SECRETARIO_EMAIL") || "";
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
  const twilioFrom = Deno.env.get("TWILIO_FROM") || "";
  const twilioWa = Deno.env.get("TWILIO_WHATSAPP") || "";
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";
  const resendFrom =
    Deno.env.get("RESEND_FROM") || "PSICONEXSOC <onboarding@resend.dev>";

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "JSON inválido" });
  }

  const tipo = limpio(payload.tipo, 20) === "sesion" ? "sesion" : "orientacion";
  const nombre = limpio(payload.nombre, 120);
  const correo = limpio(payload.correo, 160).toLowerCase();
  const telefono = limpio(payload.telefono, 40);
  const modalidad = limpio(payload.modalidad, 40) || "Por definir";
  const franjas = limpio(payload.franjas, 800);
  const nota = limpio(payload.nota, 800);
  const origen = limpio(payload.origen, 40) || "agenda";
  const consentimiento = Boolean(payload.consentimiento);

  if (!nombre || !correo || !franjas) {
    return json(400, {
      error: "Faltan nombre, correo o franjas preferidas.",
    });
  }
  if (!emailOk(correo)) {
    return json(400, { error: "Correo no válido." });
  }
  if (!consentimiento) {
    return json(400, { error: "Se requiere consentimiento." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) {
    return json(503, {
      error: "Backend incompleto: falta SUPABASE_SERVICE_ROLE_KEY.",
      fallback: true,
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Anti-spam simple: mismo correo, menos de 10 minutos
  const desde = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("pedidos_hora")
    .select("id", { count: "exact", head: true })
    .eq("correo", correo)
    .gte("created_at", desde);

  if ((count || 0) >= 3) {
    return json(429, {
      error: "Ya recibimos pedidos recientes. Esperá unos minutos o llamá al secretario.",
    });
  }

  const { data: pedido, error: insertErr } = await admin
    .from("pedidos_hora")
    .insert({
      tipo,
      nombre,
      correo,
      telefono: telefono || null,
      modalidad,
      franjas,
      nota: nota || null,
      origen,
    })
    .select("id, created_at")
    .single();

  if (insertErr || !pedido) {
    console.error("insert pedidos_hora", insertErr);
    return json(500, {
      error: "No se pudo guardar el pedido.",
      fallback: true,
    });
  }

  const tipoTxt =
    tipo === "orientacion" ? "Orientación (sin costo)" : "Sesión";
  const resumen =
    `PSICONEXSOC — pedido de hora\n` +
    `Tipo: ${tipoTxt}\n` +
    `Nombre: ${nombre}\n` +
    `Correo: ${correo}\n` +
    `Tel: ${telefono || "—"}\n` +
    `Modalidad: ${modalidad}\n` +
    `Franjas:\n${franjas}\n` +
    (nota ? `Nota: ${nota}\n` : "") +
    `Id: ${pedido.id}\n` +
    `(El cobro se acuerda en persona; la web no cobra.)`;

  let notificadoTel = false;
  let notificadoEmail = false;
  const errores: string[] = [];

  // --- Teléfono / WhatsApp al secretario ---
  if (twilioSid && twilioToken && (twilioWa || twilioFrom)) {
    try {
      const to = telNorm(secretarioTel);
      const from = twilioWa || twilioFrom;
      const dest = twilioWa
        ? to.startsWith("whatsapp:")
          ? to
          : `whatsapp:${to}`
        : to;
      const auth = btoa(`${twilioSid}:${twilioToken}`);
      const body = new URLSearchParams({
        To: dest,
        From: from,
        Body: resumen.slice(0, 1500),
      });
      const twRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        },
      );
      if (!twRes.ok) {
        const t = await twRes.text();
        errores.push("tel:" + t.slice(0, 200));
      } else {
        notificadoTel = true;
      }
    } catch (e) {
      errores.push("tel:" + String(e));
    }
  } else {
    errores.push("tel:Twilio no configurado");
  }

  // --- Correo al secretario (+ acuse opcional) ---
  if (resendKey && secretarioEmail) {
    try {
      const html =
        `<p><strong>Pedido de hora — PSICONEXSOC</strong></p>` +
        `<p>Tipo: ${tipoTxt}<br>` +
        `Nombre: ${nombre}<br>` +
        `Correo: ${correo}<br>` +
        `Teléfono: ${telefono || "—"}<br>` +
        `Modalidad: ${modalidad}</p>` +
        `<p><strong>Franjas preferidas</strong><br>${franjas.replace(
          /\n/g,
          "<br>",
        )}</p>` +
        (nota ? `<p>Nota: ${nota}</p>` : "") +
        `<p><em>La web no cobra. El honorario se acuerda en persona.</em></p>` +
        `<p>Id: ${pedido.id}</p>`;

      const mailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [secretarioEmail],
          reply_to: correo,
          subject: `[Pedido] ${tipoTxt} — ${nombre}`,
          text: resumen,
          html,
        }),
      });
      if (!mailRes.ok) {
        errores.push("email:" + (await mailRes.text()).slice(0, 200));
      } else {
        notificadoEmail = true;
      }

      // Acuse breve a quien pide (sin datos internos de secrets)
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [correo],
          subject: "Recibimos tu pedido de hora — PSICONEXSOC",
          text:
            `Hola ${nombre},\n\n` +
            `Recibimos tu pedido (${tipoTxt}). El secretario te contactará para confirmar.\n` +
            `Franjas indicadas:\n${franjas}\n\n` +
            `Si preferís, también podés llamar al +56 9 8121 6395.\n` +
            `Este sitio no cobra: el honorario se acuerda en persona.\n`,
        }),
      });
    } catch (e) {
      errores.push("email:" + String(e));
    }
  } else {
    errores.push("email:Resend o SECRETARIO_EMAIL no configurado");
  }

  await admin
    .from("pedidos_hora")
    .update({
      notificado_tel: notificadoTel,
      notificado_email: notificadoEmail,
      error_notif: errores.length ? errores.join(" | ").slice(0, 500) : null,
    })
    .eq("id", pedido.id);

  const ok = notificadoTel || notificadoEmail;
  return json(ok ? 200 : 503, {
    ok,
    id: pedido.id,
    notificado_tel: notificadoTel,
    notificado_email: notificadoEmail,
    message: ok
      ? "Pedido enviado al secretario."
      : "Pedido guardado, pero la notificación aún no está configurada. Llamá al +56 9 8121 6395.",
    fallback: !ok,
  });
});
