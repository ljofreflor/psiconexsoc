/**
 * agenda-disponibilidad
 *
 * Lee FreeBusy (o eventos) de Google Calendar y devuelve slots listos
 * para pintar en el diseño del sitio. La confirmación de reserva sigue
 * en Appointment Schedules (calendarioGoogle).
 *
 * Deploy: supabase functions deploy agenda-disponibilidad --no-verify-jwt
 *
 * Secrets (opción A — service account, recomendada):
 *   GOOGLE_CALENDAR_ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *
 * Secrets (opción B — API key + calendario público):
 *   GOOGLE_CALENDAR_ID
 *   GOOGLE_API_KEY
 */

import { JWT } from "npm:google-auth-library@9";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_HOURS = ["09:00", "10:10", "11:20", "15:00", "16:10", "17:20"];
const SLOT_MINUTES = 50;
const TZ = "America/Santiago";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function parseHour(h: string) {
  const [hh, mm] = h.split(":").map(Number);
  return { h: hh, m: mm || 0 };
}

/** Construye Date en zona America/Santiago a partir de YYYY-MM-DD + HH:mm */
function slotStart(dayIso: string, hourStr: string) {
  const { h, m } = parseHour(hourStr);
  // dayIso = 2026-09-28
  return new Date(`${dayIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-03:00`);
}

function overlaps(
  start: Date,
  end: Date,
  busy: { start: Date; end: Date }[],
) {
  for (const b of busy) {
    if (start < b.end && end > b.start) return true;
  }
  return false;
}

function weekdays(timeMin: Date, timeMax: Date) {
  const days: string[] = [];
  const d = new Date(timeMin);
  d.setHours(12, 0, 0, 0);
  while (d < timeMax) {
    const wd = d.getDay();
    if (wd >= 1 && wd <= 5) {
      days.push(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

async function accessTokenServiceAccount() {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL") || "";
  const pem = (Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY") || "").replace(
    /\\n/g,
    "\n",
  );
  if (!email || !pem) return null;
  const client = new JWT({
    email,
    key: pem,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  const { token } = await client.getAccessToken();
  return token || null;
}

async function fetchBusy(
  calendarId: string,
  timeMin: string,
  timeMax: string,
): Promise<{ busy: { start: string; end: string }[]; mode: string }> {
  const saToken = await accessTokenServiceAccount();
  const apiKey = Deno.env.get("GOOGLE_API_KEY") || "";

  if (saToken) {
    const fb = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + saToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone: TZ,
        items: [{ id: calendarId }],
      }),
    });
    if (!fb.ok) {
      throw new Error("FreeBusy: " + (await fb.text()).slice(0, 200));
    }
    const data = await fb.json();
    const keys = Object.keys(data.calendars || {});
    const cal = data.calendars?.[calendarId] || data.calendars?.[keys[0]];
    return { busy: cal?.busy || [], mode: "freebusy" };
  }

  if (apiKey) {
    // Calendario público: eventos → busy
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    url.searchParams.set("key", apiKey);
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("timeZone", TZ);
    const ev = await fetch(url);
    if (!ev.ok) {
      throw new Error("Events: " + (await ev.text()).slice(0, 200));
    }
    const data = await ev.json();
    const busy = (data.items || [])
      .filter((it: { status?: string }) => it.status !== "cancelled")
      .map((it: { start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }) => ({
        start: it.start?.dateTime || (it.start?.date ? it.start.date + "T00:00:00-03:00" : ""),
        end: it.end?.dateTime || (it.end?.date ? it.end.date + "T23:59:59-03:00" : ""),
      }))
      .filter((b: { start: string; end: string }) => b.start && b.end);
    return { busy, mode: "events-apikey" };
  }

  return { busy: [], mode: "unconfigured" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID") || "primary";
  let hours = DEFAULT_HOURS;
  let timeMin = new Date().toISOString();
  let timeMax = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  try {
    const body = await req.json();
    if (body.timeMin) timeMin = String(body.timeMin);
    if (body.timeMax) timeMax = String(body.timeMax);
    if (Array.isArray(body.hours) && body.hours.length) {
      hours = body.hours.map(String);
    }
  } catch {
    /* defaults */
  }

  try {
    const { busy, mode } = await fetchBusy(calendarId, timeMin, timeMax);

    if (mode === "unconfigured") {
      return json(503, {
        configured: false,
        error: "Falta service account o GOOGLE_API_KEY.",
        busy: [],
        slots: [],
      });
    }

    const busyDates = busy.map((b) => ({
      start: new Date(b.start),
      end: new Date(b.end),
    }));

    const days = weekdays(new Date(timeMin), new Date(timeMax));
    const now = Date.now();
    const slots: {
      day: string;
      hour: string;
      start: string;
      end: string;
      libre: boolean;
    }[] = [];

    for (const day of days) {
      for (const hour of hours) {
        const start = slotStart(day, hour);
        const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
        const past = start.getTime() < now - 5 * 60 * 1000;
        const taken = overlaps(start, end, busyDates);
        slots.push({
          day,
          hour,
          start: start.toISOString(),
          end: end.toISOString(),
          libre: !past && !taken,
        });
      }
    }

    return json(200, {
      configured: true,
      mode,
      calendarId,
      timeMin,
      timeMax,
      timeZone: TZ,
      hours,
      busy,
      slots,
    });
  } catch (e) {
    return json(500, {
      configured: true,
      error: String(e).slice(0, 400),
      busy: [],
      slots: [],
    });
  }
});
