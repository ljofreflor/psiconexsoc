-- Confirma un pago de Mercado Pago y acredita el libro.
-- Secret: MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const payload = await req.json();
  const paymentId = payload.data && payload.data.id;
  if (!paymentId) {
    return new Response("ok", { status: 200 });
  }
  const token = Deno.env.get("MP_ACCESS_TOKEN") || "";
  const payRes = await fetch("https://api.mercadopago.com/v1/payments/" + paymentId, {
    headers: { Authorization: "Bearer " + token }
  });
  const pay = await payRes.json();
  if (pay.status !== "approved") {
    return new Response("ok", { status: 200 });
  }
  const perfil = pay.metadata && pay.metadata.perfil_id;
  const monto = Math.round(Number(pay.transaction_amount || 0));
  if (!perfil || !monto) {
    return new Response("ok", { status: 200 });
  }
  const exists = await admin.from("pagos").select("id").eq("externo_id", String(paymentId)).maybeSingle();
  if (exists.data) {
    return new Response("ok", { status: 200 });
  }
  await admin.from("pagos").insert({
    perfil_id: perfil,
    pasarela: "mercadopago",
    externo_id: String(paymentId),
    monto: monto,
    estado: "acreditado"
  });
  await admin.from("movimientos").insert({
    perfil_id: perfil,
    tipo: "pago",
    monto: monto,
    nota: "mercadopago " + paymentId
  });
  return new Response("ok", { status: 200 });
});
