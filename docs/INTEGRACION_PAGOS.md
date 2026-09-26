# Integración de Pagos - Sistema de Depósitos

Este documento describe cómo integrar Transbank WebPay Plus (recomendado para Chile) o Stripe para el sistema de depósitos.

## Opción 1: Transbank WebPay Plus (Recomendado para Chile)

### Ventajas
- Mayor aceptación en Chile
- Soporta todas las tarjetas chilenas
- Costos competitivos (2.95% + IVA)
- KYC más simple para empresas chilenas

### Requisitos Previos
1. Cuenta Transbank (solicitar en https://www.transbankdevelopers.cl/)
2. Credenciales de producción (Commerce Code y API Key)
3. Certificados SSL configurados

### Instalación

```bash
npm install transbank-sdk
```

### Configuración en Supabase Edge Function

Crear archivo: `supabase/functions/create-payment-intent/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WebpayPlus } from 'https://esm.sh/transbank-sdk@3.0.0'

const TRANSBANK_COMMERCE_CODE = Deno.env.get('TRANSBANK_COMMERCE_CODE')
const TRANSBANK_API_KEY = Deno.env.get('TRANSBANK_API_KEY')
const TRANSBANK_ENVIRONMENT = Deno.env.get('TRANSBANK_ENVIRONMENT') || 'integration'

serve(async (req) => {
  try {
    const { reserva_id, monto } = await req.json()
    
    // Inicializar Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Verificar que la reserva existe y pertenece al usuario
    const { data: reserva, error: reservaError } = await supabaseClient
      .from('reservas')
      .select('id, perfil_id, deposito_monto')
      .eq('id', reserva_id)
      .single()
    
    if (reservaError || !reserva) {
      return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Configurar Transbank
    const tx = new WebpayPlus.Transaction({
      commerceCode: TRANSBANK_COMMERCE_CODE,
      apiKey: TRANSBANK_API_KEY,
      environment: TRANSBANK_ENVIRONMENT
    })
    
    // Crear transacción
    const buyOrder = `DEP-${reserva_id.slice(0, 8)}-${Date.now()}`
    const sessionId = `SESSION-${reserva.perfil_id.slice(0, 8)}`
    const returnUrl = `${Deno.env.get('PUBLIC_SITE_URL')}/cuenta/confirmacion-pago`
    
    const response = await tx.create(
      buyOrder,
      sessionId,
      monto,
      returnUrl
    )
    
    // Guardar token y estado en la base de datos
    await supabaseClient
      .from('depositos')
      .insert({
        reserva_id: reserva_id,
        perfil_id: reserva.perfil_id,
        monto: monto,
        estado: 'pendiente',
        payment_intent_id: response.token,
        pasarela: 'transbank',
        metadata: {
          buy_order: buyOrder,
          session_id: sessionId
        }
      })
    
    return new Response(JSON.stringify({
      url: response.url,
      token: response.token
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

### Webhook para confirmar pago

Crear archivo: `supabase/functions/transbank-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WebpayPlus } from 'https://esm.sh/transbank-sdk@3.0.0'

serve(async (req) => {
  try {
    const { token_ws } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role para bypass RLS
    )
    
    const tx = new WebpayPlus.Transaction({
      commerceCode: Deno.env.get('TRANSBANK_COMMERCE_CODE'),
      apiKey: Deno.env.get('TRANSBANK_API_KEY'),
      environment: Deno.env.get('TRANSBANK_ENVIRONMENT')
    })
    
    // Confirmar transacción con Transbank
    const confirmation = await tx.commit(token_ws)
    
    if (confirmation.status === 'AUTHORIZED') {
      // Actualizar estado del depósito
      const { data: deposito } = await supabaseClient
        .from('depositos')
        .update({
          estado: 'pagado',
          fecha_pago: new Date().toISOString(),
          metadata: {
            ...confirmation
          }
        })
        .eq('payment_intent_id', token_ws)
        .select()
        .single()
      
      // Actualizar reserva
      await supabaseClient
        .from('reservas')
        .update({
          deposito_estado: 'pagado'
        })
        .eq('id', deposito.reserva_id)
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      // Marcar como fallido
      await supabaseClient
        .from('depositos')
        .update({ estado: 'fallido' })
        .eq('payment_intent_id', token_ws)
      
      return new Response(JSON.stringify({ success: false, reason: confirmation.status }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

### Variables de entorno necesarias

En Supabase Dashboard → Settings → Edge Functions → Secrets:

```
TRANSBANK_COMMERCE_CODE=597055555532
TRANSBANK_API_KEY=579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C
TRANSBANK_ENVIRONMENT=integration  # production para producción
PUBLIC_SITE_URL=https://ljofreflor.github.io/psiconexsoc
```

### Deploy

```bash
cd /tmp/psiconexsoc
supabase functions deploy create-payment-intent
supabase functions deploy transbank-webhook
```

---

## Opción 2: Stripe (Alternativa Internacional)

### Ventajas
- Mejor documentación
- Soporte multi-moneda
- Experiencia de checkout optimizada
- Webhooks más robustos

### Instalación

```bash
npm install stripe
```

### Configuración en Supabase Edge Function

Crear archivo: `supabase/functions/create-stripe-payment/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

serve(async (req) => {
  try {
    const { reserva_id, monto } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    const { data: reserva } = await supabaseClient
      .from('reservas')
      .select('id, perfil_id, deposito_monto')
      .eq('id', reserva_id)
      .single()
    
    if (!reserva) {
      return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), {
        status: 404
      })
    }
    
    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: monto, // Stripe espera monto en centavos
      currency: 'clp',
      metadata: {
        reserva_id: reserva_id,
        perfil_id: reserva.perfil_id
      },
      automatic_payment_methods: {
        enabled: true
      }
    })
    
    // Guardar en base de datos
    await supabaseClient
      .from('depositos')
      .insert({
        reserva_id: reserva_id,
        perfil_id: reserva.perfil_id,
        monto: monto,
        estado: 'pendiente',
        payment_intent_id: paymentIntent.id,
        pasarela: 'stripe'
      })
    
    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
})
```

### Webhook Stripe

Crear archivo: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      await supabaseClient
        .from('depositos')
        .update({
          estado: 'pagado',
          fecha_pago: new Date().toISOString()
        })
        .eq('payment_intent_id', paymentIntent.id)
      
      const { data: deposito } = await supabaseClient
        .from('depositos')
        .select('reserva_id')
        .eq('payment_intent_id', paymentIntent.id)
        .single()
      
      if (deposito) {
        await supabaseClient
          .from('reservas')
          .update({ deposito_estado: 'pagado' })
          .eq('id', deposito.reserva_id)
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400
    })
  }
})
```

### Variables de entorno Stripe

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Integración Frontend

Crear archivo: `js/pagos.js`

```javascript
// Función para iniciar pago de depósito
async function iniciarPagoDeposito(reservaId, monto) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Usuario no autenticado')
    }
    
    // Llamar a edge function para crear payment intent
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { reserva_id: reservaId, monto: monto }
    })
    
    if (error) throw error
    
    // Redirigir a Transbank
    window.location.href = data.url + '?token_ws=' + data.token
  } catch (error) {
    console.error('Error al iniciar pago:', error)
    alert('Error al procesar el pago. Por favor intenta nuevamente.')
  }
}

// Función para confirmar pago después de retorno de Transbank
async function confirmarPagoTransbank() {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token_ws')
  
  if (!token) return
  
  try {
    const { error } = await supabase.functions.invoke('transbank-webhook', {
      body: { token_ws: token }
    })
    
    if (error) throw error
    
    // Mostrar confirmación al usuario
    document.getElementById('confirmacion-pago').innerHTML = `
      <h2>¡Pago confirmado!</h2>
      <p>Tu depósito ha sido procesado exitosamente.</p>
      <p>Se convertirá en crédito después de tu sesión.</p>
      <a href="/cuenta/reservas" class="btn btn-primary">Ver mis reservas</a>
    `
  } catch (error) {
    console.error('Error al confirmar pago:', error)
    document.getElementById('confirmacion-pago').innerHTML = `
      <h2>Error en el pago</h2>
      <p>Hubo un problema al procesar tu pago. Por favor contacta soporte.</p>
    `
  }
}

// Auto-ejecutar si estamos en página de confirmación
if (window.location.pathname.includes('/confirmacion-pago')) {
  confirmarPagoTransbank()
}
```

---

## Testing

### Modo Integración Transbank

Tarjetas de prueba:
- **Aprobada**: 4051885600446623, CVV: 123, Fecha: cualquier futura
- **Rechazada**: 4511160000000001

### Modo Test Stripe

Tarjetas de prueba:
- **Aprobada**: 4242 4242 4242 4242
- **Rechazada**: 4000 0000 0000 0002

---

## Próximos Pasos

1. ✅ Ejecutar migration SQL en Supabase
2. ⬜ Elegir pasarela (Transbank recomendado para Chile)
3. ⬜ Crear cuenta y obtener credenciales
4. ⬜ Configurar variables de entorno en Supabase
5. ⬜ Deploy Edge Functions
6. ⬜ Integrar frontend con `js/pagos.js`
7. ⬜ Testear flujo completo en modo integración
8. ⬜ Pasar a producción

---

## Costos Estimados

### Transbank
- Comisión: 2.95% + IVA por transacción
- Mantención: Gratis para volúmenes bajos

### Stripe
- Comisión: 3.6% + $200 CLP por transacción
- Sin mantención

Para 20 sesiones/mes con depósito promedio de $15.000:
- **Transbank**: ~$10.000 CLP/mes
- **Stripe**: ~$14.000 CLP/mes

**Recomendación**: Transbank para mercado chileno.
