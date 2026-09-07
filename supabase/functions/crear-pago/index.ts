-- Mercado Pago / Flow: el secreto no vive en el frontend.
-- Desplegar con `supabase functions deploy crear-pago` cuando exista la cuenta de cobro.
-- Secrets: MP_ACCESS_TOKEN o FLOW_API_KEY, HONORARIO_CLP, SITE_URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const token = Deno.env.get("MP_ACCESS_TOKEN") || "";
  const site = Deno.env.get("SITE_URL") || "https://ljofreflor.github.io/psiconexsoc";
  const honorario = Number(Deno.env.get("HONORARIO_CLP") || "0");

  if (!token || !honorario) {
    return new Response(
      JSON.stringify({
        error: "El checkout se habilita cuando existan la cuenta de cobro y el honorario."
      }),
      { status: 503, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const auth = req.headers.get("Authorization") || "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: auth } } }
  );
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Entrar primero" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  const preference = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: [
        {
          title: "Sesión PSICONEXSOC",
          quantity: 1,
          currency_id: "CLP",
          unit_price: honorario
        }
      ],
      payer: { email: userData.user.email },
      back_urls: {
        success: site + "/panel.html",
        failure: site + "/panel.html",
        pending: site + "/panel.html"
      },
      auto_return: "approved",
      metadata: { perfil_id: userData.user.id }
    })
  });

  const body = await preference.json();
  return new Response(JSON.stringify({ init_point: body.init_point, id: body.id }), {
    headers: { ...cors, "Content-Type": "application/json" }
  });
});
