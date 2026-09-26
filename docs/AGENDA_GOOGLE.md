# Calendario del sitio pintado por API de Google

## Idea
Google es la **fuente de verdad** (ocupación). El sitio **pinta** esa ocupación con el diseño PSICONEXSOC. La reserva se confirma en Appointment Schedules (`calendarioGoogle`), porque Google no deja embeber esa página.

## Flujo
1. `agenda.html` pide slots a `agenda-disponibilidad`.
2. La función lee FreeBusy (service account) o eventos (API key + calendario público).
3. Devuelve `{ slots: [{ day, hour, start, end, libre }] }`.
4. El JS pinta celdas `Libre` / ocupadas con CSS propio.
5. “Continuar en Google Calendar” abre el schedule oficial.

## Activar
```bash
supabase functions deploy agenda-disponibilidad --no-verify-jwt

# Opción A
supabase secrets set \
  GOOGLE_CALENDAR_ID="correo-o-id-del-calendario" \
  GOOGLE_SERVICE_ACCOUNT_EMAIL="...@....iam.gserviceaccount.com" \
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Opción B (calendario público)
supabase secrets set \
  GOOGLE_CALENDAR_ID="...@group.calendar.google.com" \
  GOOGLE_API_KEY="AIza..."
```

Compartí el calendario con el service account (ver ocupación).  
En `js/site.js`: `supabaseUrl` + `supabaseAnonKey`.

Sin eso, la grilla muestra celdas neutras (·) y el enlace a Google sigue disponible.
