# Levantamiento — Agenda, pago en el momento y saldo del paciente

Evaluación del encargo: «incorporar un plugin en la página de calendario con reservas, ese servicio, con pago en el momento y posibilidades de registrar el saldo de deuda». Es investigación y recomendación. No implementa nada.

Todo precio, cobertura y norma citada aquí se verificó por búsqueda web el **5 de septiembre de 2026** y se enlaza a su fuente. Donde una cifra depende de cotización, se dice que depende de cotización. Donde un dato no se pudo verificar, se marca como pregunta al proveedor, no como hecho.

Este documento no toca `index.html`, `css/main.css` ni `js/grafo.js`, intervenidos en paralelo, ni `clinica.html` ni el formulario, que son del [levantamiento de captación](03-captacion-de-consultas.md). Lo que corresponde a esos archivos queda como encargo. Se apoya en los hallazgos de ese documento y no los repite.

---

## 1. Resumen

1. **No hay que construir una agenda: ya existe una y funciona.** El Linktree del proyecto lleva a una agenda de citas de Google Calendar viva, autogestionada, gratuita, que el sitio nunca menciona ([levantamiento de captación, §4](03-captacion-de-consultas.md)). La pregunta no es qué sistema contratar, sino si conviene reemplazarla.
2. **Recomendación: no reemplazarla todavía.** Tres etapas. **Etapa cero:** publicar en el sitio la agenda que ya existe, con una página propia. Costo: cero. **Etapa uno:** cobrar con un enlace de pago chileno emitido aparte, sin plataforma nueva. Costo fijo: cero; entre 1,2 % y 3,8 % por transacción según medio. **Etapa dos:** saldo del paciente, en planilla, y sistema completo solo si la planilla se rompe.
3. **El pago al reservar dentro de la agenda de Google es inviable en Chile.** Google solo cobra a través de Stripe, y Chile no es país donde se pueda abrir una cuenta Stripe: aparece únicamente como destino de *cross-border payouts*. Lo mismo derriba a Calendly, Cal.com, Acuity y Setmore, que también dependen de Stripe, PayPal o Square. Esto se detalla y se cita en el §6.
4. **Prerrequisito bloqueante: el dominio no existe.** `psiconexsoc.com` no está registrado. Ningún proveedor de agenda o de cobro se puede operar sin una casilla que reciba confirmaciones, avisos de cobro y recuperación de contraseña. Nada de lo que sigue empieza antes del §3.
5. **«Saldo de deuda» no es una función de agenda.** Es ficha clínica o gestión de práctica: otra categoría de producto, otro precio, y en Chile viene empaquetada con la ficha clínica electrónica, que es el dato más sensible del proyecto. Conviene llegar ahí lo más tarde posible y con la menor cantidad de datos posible.
6. **La orientación inicial no se cobra, y eso no es un obstáculo: es la solución.** Cobrar por adelantado el primer contacto contradice el proyecto y la clínica. El cobro se aplica desde la segunda sesión, cuando ya hay un vínculo y un acuerdo. Eso elimina la necesidad de que el cobro viva dentro del widget de reservas (§5).

---

## 2. El país es una inferencia, no un dato

**La palabra «Chile» no aparece en ninguna página ni en ningún documento del proyecto.** La única evidencia en el repositorio es el prefijo `+56` del teléfono de `contacto.html:82` y `"areaServed":"CL"` dentro del JSON-LD de `index.html:20`, que ningún visitante ve.

Toda la evaluación de proveedores de pago, de boleta y de normativa de este documento **asume Chile y esa asunción está pendiente de confirmación del equipo.** Es la misma pregunta 3 del [levantamiento de captación, §14](03-captacion-de-consultas.md).

Qué cambiaría si el país fuera otro:

- **La recomendación de etapa cero no cambia.** La agenda de Google es global y ajusta huso horario sola.
- **El §6 completo se reescribe.** Webpay, Flow, Khipu, Fintoc y Getnet son chilenos y no sirven fuera de Chile. En cambio, si el país fuera México o España, Stripe sí opera y todo el ecosistema internacional —Cal.com, Calendly, Acuity, y el pago al reservar de Google— pasa de imposible a viable en un plan de pocos dólares. La conclusión de este documento es específicamente chilena.
- **El §8 se reescribe.** Boleta de honorarios electrónica, retención del 15,25 % y SII son chilenos.
- **El §9 cambia de norma pero no de exigencia.** Cualquier jurisdicción comparable trata el dato de salud como categoría especial y exige contrato con el procesador.

Si el equipo atiende en línea a personas de varios países, la obligación aplicable puede ser más de una a la vez. Eso hay que preguntarlo antes de contratar, no después.

---

## 3. Prerrequisito bloqueante: dominio y casilla

El [levantamiento de captación, §2](03-captacion-de-consultas.md) verificó que `psiconexsoc.com` devuelve `NXDOMAIN` y que el `whois` responde «No match for domain». No es que el DNS no apunte todavía: el dominio no está inscrito, y por lo tanto `contacto@psiconexsoc.com` —la única dirección del sitio— no puede recibir correo.

Para este documento eso es determinante, y no por conversión:

- **Toda agenda y toda pasarela se operan desde una casilla.** Confirmación de reserva, recordatorio, aviso de cobro, comprobante, notificación de reembolso, verificación de identidad del comercio y, sobre todo, recuperación de acceso. Una cuenta de cobro cuyo correo de recuperación no existe es una cuenta que se pierde.
- **La casilla es el destinatario de datos de salud.** Cada confirmación de reserva de una hora de psicoterapia nombra a una persona y una prestación. Que ese correo llegue a un dominio que cualquiera puede inscribir no es un riesgo de marketing: es una brecha esperando ocurrir.

**Con qué se puede operar mientras tanto.** La agenda de Google que ya está en uso funciona sobre una cuenta de Google, y esa cuenta ya tiene una casilla que sí recibe correo. Ese es el correo operativo hoy, y es gratis. Es preferible publicar una dirección de Gmail que funcione antes que una dirección institucional que rebota; la dirección institucional se publica el día que exista. La agenda ya opera así, sin que nadie lo haya declarado.

**Costo de salir del bloqueo.** Un `.cl` cuesta **$9.990 al año, exento de IVA**, tarifa oficial de [NIC Chile](https://www.nic.cl/anuncios/20231031-tarifas.html) sea que se inscriba directo o por un agente; los agentes cobran entre $9.990 y $19.900 ([ElevoCloud, julio 2026](https://elevocloud.com/blog/cuanto-cuesta-dominio-cl-chile-precios-2026/); [Host Chile](https://hostchile.cl/registrar-dominio/)). Un `.com` va entre $8.990 y $17.900 al año según registrador. Es la partida más pequeña de todo este documento y desbloquea todo lo demás.

Casilla, dos caminos:

- **Gratis:** correo del registrador o redirección hacia la cuenta de Google que ya se usa. Suficiente para empezar.
- **Google Workspace Business Starter:** entre **$5.800 y $8.500 por usuario al mes, más IVA**, según si se toma la lista de Google para Chile o un revendedor con factura local ([BigBudá, 2026](https://bigbuda.cl/insights/google-workspace-chile); [IDATA](https://www.idatachile.com/google-workspace.html); [ID1](https://www.id1.cl/servicios-google/)). Da correo con dominio propio para los tres. **No incluye pago en las agendas ni recordatorios automáticos** (§5).

---

## 4. Tres necesidades, tres categorías de producto

El encargo nombra una sola cosa y son tres, con precios y riesgos distintos. Confundirlas es el error más caro disponible aquí.

| Necesidad | Categoría | Qué la cubre | Dato que maneja |
| --- | --- | --- | --- |
| Reservar una hora | Agenda / booking | Google Calendar, Cal.com, Calendly, Acuity, Setmore | Nombre, correo, hora, tipo de prestación |
| Cobrar | Pasarela de pago | Webpay, Flow, Khipu, Fintoc, Mercado Pago, Getnet | Monto, medio de pago, identidad del pagador |
| Saldo del paciente | Gestión de práctica / ficha clínica | AgendaPro, Reservo, Medilink | Historial de sesiones y deuda por persona |

Ninguna agenda del mercado lleva cuenta corriente de pacientes. Los widgets de reserva registran pagos de una cita, no un saldo acumulado entre sesiones. El saldo aparece en la tercera categoría, que en Chile se vende junto con la ficha clínica electrónica y cuesta entre tres y siete veces más que una agenda (§7.6).

Y hay una asimetría que conviene ver antes de comprar: **la primera categoría maneja el dato menos sensible y la tercera el más sensible.** Una agenda sabe que Fulana tiene hora el jueves. Una ficha clínica sabe por qué. Cada paso hacia la derecha de esa tabla aumenta la obligación legal del §9, no solo la factura.

---

## 5. La orientación gratuita y el cobro

Los documentos del proyecto ofrecen una orientación inicial sin costo, y `clinica.html:151` lo afirma sin condiciones: «No. La primera orientación clínica es gratuita».

**El cobro por adelantado del primer contacto no se recomienda, y no por razones comerciales.** El propio encargo de la [etapa 1, §1.2](01-arquitectura-y-posicionamiento.md) dice que «la orientación inicial gratuita no es un trámite de derivación». Poner un formulario de tarjeta antes de la primera conversación convierte en transacción lo que el proyecto define como conversación clínica, y lo hace en el momento de mayor ambivalencia de quien consulta.

**Propuesta: el cobro se aplica desde la segunda sesión.** La consecuencia técnica es la que ordena todo este documento: si el primer contacto es gratuito, **no hace falta que el cobro viva dentro del widget de reservas.** Quien reserva por primera vez no paga; quien ya conversó y decidió continuar acuerda honorarios, frecuencia y modalidad con su profesional, y a partir de ahí el pago se puede resolver con un enlace, sin plataforma nueva. Toda la complejidad y todo el gasto del «pago en el momento» integrado se justificaba en el primer contacto, que es justamente el que no se cobra.

**Inasistencias.** Es el argumento legítimo para pedir pago anticipado, y no requiere widget: se enuncia como política («las sesiones se confirman con el pago previo», o «una inasistencia sin aviso de 24 horas se cobra») y se aplica desde la segunda sesión, que es cuando existe un acuerdo que la sostiene. Lo que no corresponde es presentar el prepago como protección del profesional frente a alguien que todavía no sabe si va a iniciar un tratamiento.

**Sobre la palabra «gratuita».** Si el equipo decide alguna vez cobrar la orientación, eso deja de ser una decisión de agenda y pasa a ser un cambio de la oferta pública en cuatro lugares del sitio y en el Linktree. No es un ajuste de configuración. Va en el §11.

---

## 6. Qué permite y qué no la agenda que ya está en uso

### 6.1 Verificado sobre la agenda del proyecto

`calendar.app.google/C9fMj6JkVmG1vV1B7` responde 302 hacia `calendar.google.com/calendar/appointments/schedules/…`, que responde 200. Y una comprobación de cabeceras que cambia el diseño de la solución:

```
x-frame-options: SAMEORIGIN
```

**La página de reservas de Google no se puede incrustar en un iframe.** El «plugin en la página de calendario» que pide el encargo no existe para esta agenda: solo se puede enlazar.

Eso, que parece una limitación, resuelve de entrada el problema de diseño del §10: no hay CSS de terceros que desentone porque no hay CSS de terceros dentro del sitio. Se enlaza a una página de Google, sobria y responsiva, desde una página propia escrita en el sistema visual del proyecto.

### 6.2 Lo que da el plan gratuito

Fuente: [Google Calendar Help, cambios en agendas de citas](https://support.google.com/calendar/answer/190998?hl=en); [comparación de funciones premium](https://support.google.com/calendar/answer/16287038?hl=en); [Workspace, programación de citas](https://workspace.google.com/resources/appointment-scheduling/).

Con cuenta personal de Google, gratis: **una** página de reservas por cuenta; duración de la cita; ventana de disponibilidad; tiempo de amortiguación entre citas; tope de reservas por día; aviso mínimo previo; **preguntas personalizadas en el formulario de reserva**; huso horario detectado automáticamente; correo de confirmación; cancelación y reprogramación por enlace; verificación de conflictos contra el calendario principal.

Lo que **no** da el plan gratuito:

- **Recordatorios automáticos a quien reservó.** Solo confirmación. El recordatorio es la función que más reduce inasistencias y es premium.
- **Más de una página de reservas por cuenta.** Cada profesional necesita su propia cuenta y su propio enlace. No hay disponibilidad compartida ni distribución por turnos entre los tres.
- **Verificación de correo** contra reservas falsas.
- **Chequeo de varios calendarios** para evitar choques con la agenda personal.
- **Cobro al reservar.**

Para tres profesionales con agendas propias, «tres cuentas y tres enlaces» es exactamente lo que el proyecto necesita hoy: cada uno es dueño de su disponibilidad y no hay derivación automática, que es lo que `clinica.html:150` promete explícitamente evitar.

### 6.3 El pago al reservar de Google, y por qué no sirve en Chile

El cobro en agendas de citas requiere una suscripción elegible —**Business Standard, Business Plus, Enterprise Standard y Plus, Education, Nonprofits o Workspace Individual**, según el [artículo de administración de Google](https://knowledge.workspace.google.com/admin/calendar/allow-paid-appointment-schedules-in-calendar)— y **se cobra exclusivamente conectando una cuenta de Stripe** ([Exigir pagos para las citas](https://support.google.com/calendar/answer/13762729)). Business Starter no lo incluye. Google no cobra comisión de plataforma y no interviene en reembolsos: todo ocurre en Stripe.

**Y aquí se cierra el camino.** La documentación oficial de Stripe sobre payouts consigna, en la ficha de Chile:

> Chile is only available for Cross-border payouts accounts.

([docs.stripe.com/payouts](https://docs.stripe.com/payouts)). Es decir: una cuenta bancaria chilena puede *recibir* dinero desde una cuenta Stripe abierta en otro país, pero Chile no es país donde constituir la cuenta de comercio. Varios blogs chilenos afirman que «Stripe opera en Chile desde 2023»; contra la documentación del propio proveedor, esa afirmación no se sostiene, y por eso este documento no la usa.

Consecuencias, en orden:

1. **El pago al reservar en Google Calendar no está disponible para un equipo chileno.** Pagar Workspace Business Standard —entre **$11.500 y $16.800 por usuario al mes más IVA** según fuente ([BigBudá](https://bigbuda.cl/insights/google-workspace-chile), [ID1](https://www.id1.cl/servicios-google/), [IDATA](https://www.idatachile.com/google-workspace.html)); tres usuarios, entre $34.500 y $50.400 más IVA— compraría correo con dominio propio, recordatorios automáticos, verificación de correo y varias páginas de reserva, todo útil, **pero no el cobro**, que es lo que motivó el encargo.
2. **La única vía sería una entidad en un país soportado** (una LLC estadounidense, típicamente). Eso saca los honorarios del circuito de la boleta chilena y le crea al equipo un problema tributario mucho mayor que el que resuelve. Se descarta sin más análisis.
3. **El mismo muro derriba al resto del mercado internacional** (§7).

Un detalle adicional, verificado en el [foro de desarrolladores de Google](https://discuss.google.dev/t/google-calendar-stripe-integration-billing-address-vat-custom-fields-not-passed-to-stripe-checkout/369617): el checkout que Google arma en Stripe no recoge dirección de facturación ni identificador tributario y no admite campos propios, de modo que la emisión del documento tributario queda manual de todos modos. Incluso donde sí funciona, no resuelve la boleta.

---

## 7. Proveedores evaluados y descartados

### 7.1 Calendly — descartado por moneda

Plan Standard **US$10 por usuario al mes** anual, US$12 mensual; Teams US$16/US$20 ([calendly.com/pricing](https://calendly.com/pricing)). El cobro exige Standard o superior.

Es descarte limpio y no depende de Stripe-Chile: **Calendly solo cobra en cinco monedas —AUD, CAD, EUR, GBP y USD—** tanto por Stripe como por PayPal, y su propio soporte declara que no puede agregar otras porque la lista es de la integración, no del procesador ([Calendly + Stripe](https://calendly.com/help/calendly-stripe); [Calendly + PayPal](https://calendly.com/help/calendly-paypal); [respuestas de su comunidad](https://community.calendly.com/how-do-i-40/additional-accepted-currencies-via-paypal-and-stripe-419)). No se puede cobrar en pesos chilenos. Cobrar en dólares una sesión de psicoterapia en Chile es trasladar el riesgo de cambio al paciente.

### 7.2 Cal.com — descartado hoy, la mejor reserva técnica para después

Gratis para un usuario, **con cobros por Stripe y PayPal incluidos en el plan gratuito**; Teams **US$12 por usuario al mes** anual; Organizations US$28, que es el plan donde aparece el cumplimiento HIPAA ([cal.com/pricing](https://cal.com/pricing)). Autoalojable: la licencia es **AGPLv3, con el directorio `packages/features/ee` bajo licencia comercial** ([LICENSE del repositorio](https://github.com/calcom/cal.diy/blob/main/LICENSE)) — no es MIT, como afirman varias comparativas.

Es el único candidato cuyo embed se puede vestir de verdad: `Cal("ui", { cssVarsPerTheme })` permite sobrescribir color de marca, fondo, texto, borde, radio y espaciado por tema claro y oscuro ([documentación de variables CSS del embed](https://cal.com/docs/developing/guides/embeds/customize-embed-css-variables)). Los dos regímenes del sitio se podrían mapear a esas variables. Aun así se descarta hoy, por tres razones:

- **Su tienda de pagos son Stripe, PayPal, Cal Pay, HitPay y BTCPayServer** ([apps de pago](https://cal.com/apps/categories/payment)). Ninguna pasarela chilena. Con Stripe cerrado, el cobro no ocurre.
- **Riesgo específico con el peso chileno.** El CLP es moneda sin decimales en Stripe. Cal.com tuvo un incidente documentado en que cobró **cien veces** el monto en yenes, otra moneda sin decimales ([CAL-3223](https://github.com/calcom/cal.com/issues/13845)). Se corrigió, pero es la clase de error que en salud mental no se puede permitir y obliga a probar con montos reales antes de abrir.
- **Autoalojar cambia de categoría el problema.** Ahorra licencia y cuesta servidor, base de datos, correo saliente, respaldos, TLS y parches, sobre un proyecto que hoy es HTML estático sin build. Y convierte al equipo en custodio directo de datos de reservas de psicoterapia: sube la obligación del §9 en lugar de delegarla.

**Reserva:** si el proyecto crece y aparece una pasarela chilena en su tienda, o si el país no es Chile, Cal.com es la primera opción a reevaluar.

### 7.3 Acuity Scheduling — descartado por pasarela

**US$16 / US$27 / US$49 al mes** anual (US$20 / US$34 / US$61 mensual), con 1, 6 y 36 calendarios ([acuityscheduling.com/pricing](https://acuityscheduling.com/pricing)). Firma de BAA para HIPAA en el plan superior. Cobra con Stripe, Square, PayPal o Venmo, y con nada más: Square no opera en Chile y las otras dos vuelven al muro del §6.3. El plan de 6 calendarios sería el adecuado para tres profesionales; da igual, porque el cobro no ocurre.

### 7.4 Setmore — descartado por pasarela

Plan gratuito de hasta **4 usuarios**, generoso para el tamaño exacto del equipo, con pagos disponibles en el plan gratuito; Pro US$5 por usuario al mes anual ([Setmore, pagos](https://www.setmore.com/features/payments/us)). Pasarelas: Square, Stripe, PayPal, LawPay. Square, además, solo está habilitado para Estados Unidos, Reino Unido, Canadá y Australia ([soporte de Setmore](https://support.setmore.com/en/articles/2438754-square)). Mismo muro.

### 7.5 SimplyBook.me — descartado por cobertura

**€0 / €13,90 / €29,90 / €59,90 al mes**, limitado por reservas mensuales (50, 100, 500, 2.000), número de profesionales y funciones premium; HIPAA es una función premium desde el plan Standard ([simplybook.me/en/pricing](https://simplybook.me/en/pricing)). Tiene la lista de pasarelas más larga del mercado, y su propia página de país para Chile encabeza con «**Currently not supported**» ([pasarelas en Chile](https://simplybook.me/en/booking-system-features/payments/CL)); en la lista global no hay Webpay, Flow, Khipu ni Fintoc. Queda Stripe o PayPal, es decir, el muro del §6.3.

### 7.6 Los verticales chilenos de salud — viables, y prematuros

Son los únicos que resuelven las tres necesidades del §4 a la vez y con pasarela local. Se descartan **por ahora** por costo y por proporción, no por capacidad.

**AgendaPro.** Individual **$15.900 + IVA**, Básico **$34.900 + IVA**, Premium **$54.900 + IVA**, Pro **$249.900 + IVA** ([agendapro.com/cl/planes](https://agendapro.com/cl/planes); precios contrastados en [comparativa de junio de 2026](https://qando.cl/blog/qando-vs-agendapro)). Dos detalles que deciden: la **ficha clínica personalizada aparece recién en Premium** (≈ $65.331 con IVA), y la emisión de **boleta de honorarios cuesta 1 UF al mes más IVA por RUT**. Con la UF del 5 de septiembre de 2026 en **$40.880,36** ([SII](https://www.sii.cl/valores_y_fechas/uf/uf2026.htm)), eso es ≈ $48.647 mensuales por profesional: **≈ $145.900 al mes por los tres, para emitir un documento que el SII emite gratis.**

**Reservo.** Empresa chilena, con agenda, ficha clínica personalizable, control de sesiones, registro de pagos y pago al reservar mediante **Webpay, Mercado Pago y Fintoc**; su material declara **planes desde $30.000 + IVA** y que **todos los planes incluyen la emisión de boleta de honorarios SII** ([Reservo para psicólogos](https://reservo.cl/salud/centro-sicologico/); [nota de su blog](https://reservo.cl/blog/profesionales/salud/5-motivos-para-tener-un-software-para-psicologos/)). No publica tabla de precios: su [página de precios](https://reservo.cl/precios/) es un formulario de cotización, y el costo depende del tamaño del centro. Circula la referencia de un recargo por habilitar Webpay; **hay que pedirlo por escrito**, junto con el precio para tres profesionales.

**Medilink.** Producto equivalente, chileno, con agenda, ficha psicológica, pagos en línea e integración con facturadores. **No publica precios** ([planes](https://www.softwaremedilink.com/planes)); una comparativa de terceros lo sitúa en el rango de US$100–200 al mes, dato de segunda mano que no debe usarse para presupuestar.

Los tres, si se contratan, exigen desactivar módulos que no corresponden en salud mental (§10) y firmar el contrato de encargo del §9.

### 7.7 El cuadro que resume el descarte

| Proveedor | Costo mensual verificado | ¿Cobra en CLP? | Razón del descarte hoy |
| --- | --- | --- | --- |
| Agenda de Google (actual) | $0 | No | Ninguna. Es la recomendación de etapa cero |
| Google Workspace Business Standard | $11.500–$16.800 + IVA por usuario | No | Compra correo y recordatorios, no el cobro |
| Calendly Standard | US$10 por usuario | **No**, solo 5 monedas | Imposible cobrar en pesos |
| Cal.com gratis / Teams | $0 / US$12 por usuario | No | Sin pasarela chilena; riesgo de moneda sin decimales |
| Cal.com autoalojado | Servidor, desde ~US$5 | No | Asume infraestructura y custodia de datos |
| Acuity | US$16–49 | No | Stripe / Square / PayPal |
| Setmore | $0 hasta 4 usuarios | No | Stripe / Square / PayPal |
| SimplyBook.me | €0–59,90 | No | Chile «currently not supported» |
| AgendaPro Premium + boleta ×3 | ≈ $65.331 + ≈ $145.900 | Sí | Desproporcionado para tres profesionales |
| Reservo | Desde ~$35.700 con IVA, a cotizar | Sí | Prematuro; es la reserva de etapa dos |
| Medilink | No publica | Sí | No presupuestable hoy |

---

## 8. Cobrar en Chile sin plataforma nueva

Verificado el 5 de septiembre de 2026. Todas las comisiones son **sobre el monto y llevan IVA aparte**; el IVA de la comisión es crédito fiscal solo para quien tributa en primera categoría, que probablemente no es el caso aquí (§8.2).

| Medio | Comisión | Abono | Fuente |
| --- | --- | --- | --- |
| Webpay débito / prepago | 1,49 % + IVA, mínimo 0,002260 UF | 24 h | [publico.transbank.cl/tarifas](https://publico.transbank.cl/tarifas), vigente desde el 20 de mayo de 2026 |
| Webpay crédito | 2,29 % + IVA, mínimo 0,003515 UF | 48 h | ídem |
| Flow, tarjetas | 2,89 % + IVA (T+3) o 3,19 % + IVA (T+1), sin costo fijo | 1 o 3 días hábiles | [web.flow.cl/es-cl/tarifas](https://web.flow.cl/es-cl/tarifas/) |
| Flow, transferencia vía Khipu o Etpay | **0,99 % + $100 + IVA** (T+3) | 3 días hábiles | ídem y su [guía de transferencias](https://web.flow.cl/Gu%C3%ADa%20de%20transferencias%20bancarias%20con%20Flow.pdf) |
| Khipu directo | ≈ 1 % + IVA, solo transferencia | 1 día hábil | [ficha de Khipu](https://comocobro.cl/medios-de-pago/khipu) |
| Mercado Pago, cobro en línea | 3,19 % + IVA inmediato, 2,89 % + IVA a 10 días | Inmediato o 10 días | [ficha de Mercado Pago](https://comocobro.cl/medios-de-pago/mercadopago) |
| Transferencia bancaria a mano | $0 | Inmediato | — |

Sobre una sesión de **$35.000** eso es: transferencia $0; Khipu ≈ $417; Flow por transferencia ≈ $531; Webpay débito ≈ $621; Webpay crédito ≈ $954; Flow tarjeta ≈ $1.204; Mercado Pago inmediato ≈ $1.329.

**Recomendación de etapa uno: enlace de pago, no plataforma.** Mercado Pago y Flow generan enlaces de cobro de monto fijo sin tienda y sin integración, y Mercado Pago además no exige inicio de actividades en el SII para empezar a recibir ([ficha de Mercado Pago](https://comocobro.cl/medios-de-pago/mercadopago)). El enlace se pone en la descripción de la agenda —que se muestra en la página de reserva—, en la página `/agenda` del sitio y en el correo con que el profesional confirma la continuidad del proceso. Costo fijo mensual: **cero**. Y el orden clínico se mantiene: primero la conversación, después el acuerdo, después el pago.

Si el equipo quiere abaratar de verdad, la vía es la transferencia automatizada: Khipu o Flow por transferencia dejan la comisión efectiva entre 1,2 % y 1,6 % con IVA, contra 3,4 %–3,8 % de una tarjeta con acreditación inmediata. Sobre una sesión chilena típica la diferencia son unos $900, y **la transferencia no genera contracargos ni endeuda al paciente con una tarjeta de crédito** — que en un servicio de salud mental es un argumento y no un detalle.

**Paquetes y cobros recurrentes.** Se pueden hacer: Flow tiene suscripciones y Webpay Oneclick guarda tarjeta. **No se recomiendan.** Un cobro automático mensual por psicoterapia obliga a quien quiere interrumpir un proceso a hacer un trámite administrativo para dejar de pagar, en el momento en que menos ganas tiene de tramitar. Cobrar sesión por sesión, o un paquete pagado por decisión explícita cada vez, es más caro en comisión y correcto.

### 8.2 Boleta y tributación

Verificado el 5 de septiembre de 2026:

- **La boleta de honorarios electrónica es obligación del prestador**, persona natural que presta servicios profesionales sin factura, según el artículo 42 N° 2 de la Ley de Impuesto a la Renta, y **se emite al momento del pago** o hasta 90 días después, plazo que es técnico del portal y no autoriza a atrasar la retención ([SII](https://www.sii.cl/ayudas/nuevos_contribuyentes/boleta-honorarios.html); [guía 2026](https://www.oficinavirtual.cl/blog/2026/4/20/paso-a-paso-emision-boleta-de-honorarios); [Adactiva](https://www.adactiva.cl/post/cu%C3%A1ndo-se-debe-emitir-o-exigir-una-boleta-de-honorarios-gu%C3%ADa-pr%C3%A1ctica-adactiva-2025)).
- **La retención en 2026 es 15,25 % del monto bruto**, y sigue subiendo por la Ley N° 21.133: 16 % en 2027 y 17 % desde 2028 ([guía 2026](https://www.oficinavirtual.cl/blog/2026/4/20/paso-a-paso-emision-boleta-de-honorarios); [BaseAPI](https://baseapi.cl/blog/boletas-honorarios-electronicos-guia-completa-2026)).
- **Si el pagador es una persona natural** —el caso de un paciente— la boleta se emite sin datos del receptor y **la retención la declara y paga el propio profesional como PPM en el Formulario 29**. No la retiene el paciente. Esto importa para el flujo de caja: del pago recibido hay que provisionar el 15,25 %.
- **No hay IVA que agregar.** Las boletas de honorarios de personas naturales quedaron expresamente fuera del IVA a los servicios, y la Ley 21.420 además incorporó una exención para las prestaciones ambulatorias de salud, mencionando a psicólogos y psiquiatras ([SII, diciembre de 2022](https://www.sii.cl/noticias/2022/211222noti01aav.htm)). El IVA sí afecta a la comisión de la pasarela.
- **Cada profesional emite con su propio RUT**, salvo que el equipo constituya una sociedad. Ahí hay una decisión previa a cualquier compra (§11): si se factura a nombre de una sociedad de profesionales inscrita en el SII, la exención se mantiene; si se usa una SpA o Ltda. corriente, los servicios pasan a estar afectos al 19 % ([SII](https://www.sii.cl/noticias/2022/211222noti01aav.htm)) y el precio al paciente sube.

**Conclusión práctica:** emitir la boleta en sii.cl es gratuito y toma un minuto. Pagar $145.900 mensuales para que una plataforma la emita por los tres (§7.6) solo se justifica con un volumen que hoy nadie puede estimar, porque no hay analítica que lo mida ([levantamiento de captación, §10](03-captacion-de-consultas.md)).

---

## 9. Datos personales y confidencialidad

Estado de la norma, verificado el 5 de septiembre de 2026. Cambió hace poco y está a punto de cambiar otra vez.

- **Hoy rige la Ley 19.628.** Su régimen original, con tutela judicial ante juez de letras civil, es el aplicable hasta el 30 de noviembre de 2026.
- **La Ley 21.719**, publicada el **13 de diciembre de 2024**, reescribe la 19.628 y crea la Agencia de Protección de Datos Personales. Su entrada en vigencia está fijada para el **1 de diciembre de 2026**, y la propia ficha de Ley Chile trae la versión marcada «con vigencia diferida» a esa fecha ([texto en Ley Chile](https://www.bcn.cl/leychile/navegar?idNorma=1209272&idVersion=2026-12-01); [Diario Oficial del 13 de diciembre de 2024](https://www.diariooficial.interior.gob.cl/publicaciones/2024/12/13/44023/01/2583630.pdf)).
- **La Ley 21.806**, del **5 de febrero de 2026**, ajustó plazos institucionales —adelantó la designación del Consejo Directivo de la Agencia— **sin postergar la vigencia** ([IAPP](https://iapp.org/news/a/protecci-n-de-datos-personales-puntos-pendientes-antes-de-la-entrada-en-vigor-de-la-reforma-en-chile)).
- **El 1 de septiembre de 2026 el Gobierno ingresó al Senado, con suma urgencia, un proyecto que posterga la vigencia al 1 de diciembre de 2027**, amplía el Consejo Directivo de tres a cinco integrantes y extiende a todas las empresas la posibilidad de que la Agencia sancione con amonestación escrita durante el primer año ([Diario Financiero](https://www.df.cl/economia-y-politica/congreso/gobierno-ingresa-al-congreso-proyecto-que-posterga-por-un-ano-la-entrada-en); [La Tercera](https://www.latercera.com/pulso/noticia/proteccion-de-datos-personales-gobierno-ingresa-proyecto-que-posterga-en-un-ano-entrada-en-vigencia-de-la-ley/); [BioBioChile](https://www.biobiochile.cl/noticias/bbcl-explica/bbcl-explica-notas/2026/09/03/por-que-el-gobierno-quiere-postergar-por-otro-ano-la-ley-de-datos-personales-esto-dice-la-normativa.shtml)). **Está en trámite: no es ley.** A la fecha de este documento la vigencia sigue siendo el 1 de diciembre de 2026.

**Qué hacer con esa incertidumbre: nada distinto.** El proyecto no debe planificar sobre una prórroga que no existe, y tampoco necesita hacerlo: lo que la ley exige aquí —decir quién es el responsable, para qué se tratan los datos, con quién se comparten, cuánto se conservan y cómo se ejercen los derechos— es lo que un sitio clínico debería decir de todas maneras. La única lectura razonable es cumplir como si la fecha fuera diciembre de 2026 y ganar margen si se corre.

### 9.1 Reservar una hora genera dato sensible

- La Ley 20.584 define la ficha clínica y declara que toda la información que surja de ella **es dato sensible** ([artículo 12](https://iura.cl/20584/12)), y obliga a **conservarla al menos quince años** con acceso restringido a la persona, su representante y los profesionales que participan directamente de la atención ([artículo 13](https://iura.cl/20584/13)).
- La Ley 21.719 agrega el **artículo 16 bis**, específico para datos de salud, que los sujeta a las finalidades de las leyes sanitarias y admite su tratamiento con consentimiento expreso, otorgado por declaración escrita, verbal o medio tecnológico equivalente ([artículo primero de la ley](https://a-lex.cl/codigos/ley-21719/primero)).

Una reserva de hora no es una ficha clínica, pero **el hecho de que una persona identificada solicite atención en salud mental es dato de salud.** Y el proyecto ya tiene un caso peor documentado: el formulario actual envía un texto libre sobre el sufrimiento de la persona a un relé gratuito en Estados Unidos ([levantamiento de captación, §8.2](03-captacion-de-consultas.md)). La agenda es preferible al formulario también por esto: pide nombre, correo y hora, y deja el motivo de consulta para la conversación.

**Regla de diseño que se adopta: la agenda no pregunta el motivo.** Ninguna pregunta personalizada del formulario de reserva debe pedir diagnóstico, síntoma ni motivo. El único campo justificable más allá de nombre, correo y teléfono es la modalidad, y aun ese es opcional.

### 9.2 Lo que exige usar un procesador externo

El **artículo 15 bis** de la Ley 21.719 es explícito: el encargado trata los datos solo conforme al encargo y a las instrucciones del responsable, no puede usarlos para otro fin ni cederlos sin autorización expresa, no puede subcontratar sin autorización específica y por escrito, y si delega **sigue siendo solidariamente responsable**. La relación **se rige por un contrato** que debe establecer objeto, duración, finalidad, tipo de datos, categorías de titulares y derechos y obligaciones de las partes; la Agencia deberá publicar modelos tipo ([texto del artículo](https://a-lex.cl/codigos/ley-21719/primero)).

Traducido a este proyecto: **PSICONEXSOC —o la persona o sociedad que el equipo defina— es el responsable. Google, Reservo, Flow o quien sea es el encargado. El responsable no puede contratar y olvidar.** Cláusulas a exigir por escrito antes de firmar, además de las que la ley enumera: medidas de seguridad concretas; plazo de notificación de incidentes al responsable, con margen para que el responsable avise a la Agencia sin dilaciones indebidas; cooperación para atender solicitudes de los titulares; devolución o eliminación al término del contrato; condiciones de subencargo; y **base legal y ubicación de los datos si salen de Chile**, que es el caso de Google y de casi todo proveedor internacional ([análisis de las cláusulas mínimas](https://confidata.cl/blog/responsable-encargado-contratos-ley-21719); [aplicación al sector salud](https://confidata.cl/blog/ley-21719-hospitales-clinicas-ficha-clinica-telemedicina)).

Esto vale con más fuerza para la etapa dos: contratar ficha clínica electrónica sin contrato de encargo firmado no es una omisión administrativa, es tratar el dato más sensible del proyecto sin instrucciones documentadas.

### 9.3 Qué tendría que cambiar en `privacidad.html`

Encargo, no edición: hoy esa página son tres párrafos que no nombran al procesador, no identifican responsable y no ofrecen canal de derechos. Publicar una agenda obliga a agregar, como mínimo:

1. **Quién es el responsable de los datos**, con nombre o razón social y una dirección de contacto que exista. Es el pendiente 9 de la [etapa 1, §9](01-arquitectura-y-posicionamiento.md) y bloquea esta página.
2. **Que la reserva de horas se opera con un proveedor externo, nombrado**, con enlace a su política, y que los datos pueden tratarse fuera de Chile.
3. **Qué datos se piden al reservar y para qué** — nombre, correo, hora—, y **que no se pide motivo de consulta**.
4. **Cuánto se conservan** las reservas y quién las ve.
5. **Que el pago lo procesa un tercero nombrado**, que el sitio y el equipo no ven ni almacenan datos de tarjeta, y qué queda registrado del cobro.
6. **Cómo ejercer acceso, rectificación, supresión, oposición, portabilidad y bloqueo**, con un canal concreto y un plazo.
7. **Qué es y qué no es la agenda respecto de la ficha clínica**: la reserva no es ficha; si en el futuro hay ficha electrónica, se declara aparte, con su custodio y su plazo de quince años.
8. **Mantener el aviso de urgencias**, y agregar que la agenda no es un canal de urgencia y que reservar no garantiza atención inmediata.

---

## 10. Diseño, accesibilidad, móvil y patrones oscuros

**No hay widget que incrustar, y conviene que sea así.** La página de reservas de Google responde con `x-frame-options: SAMEORIGIN` (§6.1): no se puede embeber. La forma correcta es una **página propia, `/agenda`, escrita en el sistema visual del sitio**, que explique en registro accesible qué es la orientación gratuita, cuánto dura, en qué modalidad, quién atiende y qué no es —no es urgencia— y que enlace hacia fuera. Todo el texto sensible queda bajo control del proyecto; el calendario, que es una herramienta, queda en la herramienta.

Si alguna vez se incrusta algo, el orden de preferencia por lo que se puede vestir es: Cal.com, que expone variables CSS por tema y permite mapear los dos regímenes del sitio (§7.2); después los verticales chilenos, que suelen ofrecer color y logo; Calendly y Acuity al final. Ninguno hereda las tipografías autoalojadas ni la escala de espaciado, así que un iframe siempre va a leerse como una isla. Enlazar es más honesto que fingir integración.

**Móvil a 390 px.** El tráfico llega de Instagram, en teléfono, y con frecuencia dentro del navegador integrado de Instagram, donde el JavaScript de terceros puede fallar. Un enlace externo sobrevive a eso; un widget con iframe y scripts, no siempre. Un punto adicional: el enlace debe abrir en la misma pestaña o declarar que abre en otra, y el destino de Google conserva la posibilidad de volver. El área táctil del enlace debe cumplir 44 × 44 px, con el mismo criterio que el [levantamiento de captación, §8.3](03-captacion-de-consultas.md) aplica al formulario.

**Accesibilidad.** La página `/agenda` es HTML propio y se puede hacer bien: encabezados en orden, enlace con texto descriptivo —«Reservar una orientación inicial en la agenda de [profesional]», no «clic aquí»—, y aviso previo de que el destino es un servicio externo. La accesibilidad de la página de Google no está bajo control del proyecto; por eso el correo y el teléfono deben seguir publicados como alternativa para quien no pueda usar la agenda. **Un canal único de autoservicio excluye a alguien.**

**Patrones oscuros a desactivar, por proveedor.** Nada de esto se usa aquí:

- **Contadores de disponibilidad, «últimos cupos», cuentas regresivas y ventanas de salida.** No están en la agenda de Google; sí aparecen en herramientas de booking comercial. Se desactivan.
- **Marketplace y descubrimiento.** El plan Individual de AgendaPro incluye «presencia en Marketplace» ([planes](https://agendapro.com/cl/planes)). Publicar atención psicoanalítica en un catálogo junto a servicios de estética contradice el posicionamiento del proyecto. Se desactiva.
- **Club de puntos, giftcards y fidelización.** Están en Reservo y en AgendaPro. Una giftcard de psicoterapia es un regalo que alguien hace a otro para que se trate. Fuera.
- **Correo masivo y encuestas de satisfacción automáticas** sobre una lista construida con quienes pidieron hora. Se desactivan; el newsletter es otra cosa y va por su propio canal, como ya estableció el [levantamiento de captación, §12](03-captacion-de-consultas.md).
- **Confirmaciones por WhatsApp automatizadas** de los verticales chilenos: solo si alguien se compromete a un horario de respuesta, con la misma regla que el §4 de ese documento.
- **Recordatorios: sí, y sobrios.** Un recordatorio de la hora reservada no es un patrón oscuro, es cuidado. Uno solo, sin insistencia, sin frases de urgencia, con enlace visible para cancelar o reprogramar. Que cancelar sea tan fácil como reservar es una prueba de diseño honesto.
- **Y el aviso de urgencias**, que ya está en el pie de las quince páginas, debe estar también en la página de reserva. Un sistema de horas disponibles puede leerse como «hay atención ahora»; hay que decir explícitamente que no.

---

## 11. Costo por etapa

Sin analítica instalada no hay volumen conocido ([levantamiento de captación, §10](03-captacion-de-consultas.md)), así que ningún plan por tramos de reservas puede dimensionarse hoy. Esa es otra razón para empezar por lo que no cobra por volumen.

**Etapa cero — publicar la agenda que existe.** Dominio `.cl` **$9.990 al año exento de IVA**, o `.com` entre $8.990 y $17.900; casilla provisional en la cuenta de Google, **$0**. Suscripción de agenda: **$0**. Trabajo: una página nueva y enlaces desde el sitio. **Total: menos de $1.000 al mes.**

**Etapa uno — cobrar desde la segunda sesión.** Suscripción: **$0**. Solo comisión, y solo cuando hay cobro. Sobre una sesión de $35.000: **≈ $417 por transferencia con Khipu, ≈ $531 con Flow por transferencia, ≈ $954 con Webpay crédito, ≈ $1.329 con Mercado Pago inmediato.** Boleta: **$0**, emitida en sii.cl, con 15,25 % de retención a provisionar. Opcional, si se quiere recordatorio automático y correo con dominio propio: **Workspace Business Standard, $11.500–$16.800 + IVA por usuario al mes**, tres usuarios, **$34.500–$50.400 + IVA**, que compra la calidad de la agenda pero **no** el cobro.

**Etapa dos — saldo del paciente.** Planilla compartida en la cuenta de Google que ya existe: **$0**. Vertical chileno con ficha clínica y cuenta corriente: **AgendaPro Premium ≈ $65.331 con IVA al mes**, más **≈ $145.900 al mes si se quiere que emita las boletas de los tres**; **Reservo desde ≈ $35.700 con IVA, a cotizar**, con boleta SII incluida según su material, lo que lo deja como la alternativa a pedir primero. **Total etapa dos, si se contrata: entre $36.000 y $211.000 al mes**, contra cero de la planilla.

Ese salto —de cero a entre treinta y seis mil y doscientos mil pesos mensuales— es la decisión más caras de este documento, y hoy no hay ningún dato que la justifique.

---

## 12. El saldo del paciente

**Qué lo cubre de verdad:** la tercera categoría del §4. En Chile, Reservo, AgendaPro Premium o Medilink; fuera de Chile, productos como los de práctica clínica estadounidense, que no cobran en pesos. Todos traen la cuenta corriente del paciente empaquetada con la ficha clínica electrónica.

**La alternativa más simple y más honesta, para tres profesionales:** una planilla compartida, en la cuenta de Google que el equipo ya usa, con una fila por sesión y columnas de fecha, monto acordado, monto pagado, medio y saldo. Se puede tener funcionando esta semana, es auditable, la entiende cualquiera, no depende de ningún proveedor y no crea un tratamiento de datos nuevo con un tercero.

Con dos reglas que no son de contabilidad sino de cuidado:

1. **Identificación mínima.** La planilla del saldo no necesita motivo de consulta, ni diagnóstico, ni notas clínicas: nombre y montos. Un saldo asociado a un nombre en un archivo compartido ya dice que esa persona está en tratamiento; usar iniciales o un código, con la correspondencia guardada aparte por cada profesional, cuesta lo mismo y expone mucho menos.
2. **La deuda no se cobra automáticamente ni se convierte en presión.** Sin recordatorios automáticos de saldo, sin interés, sin suspensión automática de horas. Una deuda pendiente en un tratamiento psicoanalítico es material clínico antes que administrativo, y se conversa en sesión.

**Cuándo migrar a un sistema.** Cuando la planilla se rompa por una razón concreta y verificable: más de tres profesionales, alguien administrativo que necesita ver pagos sin ver clínica, o volumen que haga inviable el registro manual. No antes, y no porque exista un producto que lo hace mejor.

**Advertencia.** Adoptar un vertical con ficha clínica electrónica es una decisión clínica e institucional, no una compra de software: implica trasladar el registro clínico a un tercero, con obligación de conservación de quince años ([Ley 20.584, artículo 13](https://iura.cl/20584/13)), contrato de encargo firmado (§9.2) y un criterio explícito de quién accede a qué. Merece su propia etapa del documento maestro, no un párrafo en esta.

---

## 13. Pasos de implementación

Ordenados. Cada uno depende del anterior.

**Etapa cero**

1. **El equipo inscribe el dominio** y habilita una casilla que reciba correo. Hasta entonces, el correo operativo es el de la cuenta de Google de la agenda, y se publica ese.
2. **El equipo confirma la agenda:** que sigue vigente, qué profesional atiende esos bloques, con qué disponibilidad y en qué huso horario. Si atienden los tres, hacen falta tres cuentas y tres enlaces (§6.2).
3. **El equipo revisa la configuración de la agenda:** duración, aviso mínimo previo, tope de reservas por día, amortiguación entre citas, y **retirar cualquier pregunta del formulario que pida motivo o síntoma** (§9.1). En la descripción de la agenda: que la primera orientación es gratuita, que no es un canal de urgencia y cómo cancelar.
4. **Se crea la página `/agenda`** en el sistema visual del sitio, en registro accesible, con el enlace a la agenda, el teléfono y el correo como alternativas, y el aviso de urgencias. Se enlaza desde `clinica.html#orientacion` y desde `contacto.html`, en coordinación con quien es dueño de esos textos.
5. **Se actualiza `privacidad.html`** con los ocho puntos del §9.3. Requiere el nombre del responsable, que solo tiene el equipo.
6. **El equipo apunta el Linktree al sitio**, o al menos agrega el sitio junto a la agenda, y repara el enlace roto.

**Etapa uno**

7. **El equipo decide quién recibe el dinero** (§11) y abre la cuenta de cobro correspondiente.
8. **Se genera el enlace de pago de monto fijo** y se prueba con un cobro real de monto bajo, verificando comisión efectiva, plazo de abono y comprobante.
9. **Se redacta y publica la política**: cobro desde la segunda sesión, qué pasa con una inasistencia, cómo se pide un reembolso y a quién. Sin esa política escrita no se abre el cobro.
10. **Se define el flujo de la boleta**: quién emite, con qué RUT, en qué momento, y cómo se provisiona el 15,25 %.
11. **Se agrega el pago a `privacidad.html`** y se menciona en `/agenda`.

**Etapa dos**

12. **Planilla de saldos** con las dos reglas del §12.
13. **Solo si la planilla se rompe:** cotizar Reservo y Medilink para tres profesionales, pedir por escrito precio total, si la boleta de honorarios está incluida, qué pasarelas ofrecen y **el contrato de encargo con las cláusulas del §9.2**. Comparar contra AgendaPro Premium más el módulo de boleta.

---

## 14. Lo que solo puede decidir el equipo

1. **¿El proyecto es chileno?** Todo el §6, el §8 y el §9 dependen de eso, y el repositorio no lo dice (§2).
2. **¿Quién es el responsable de los datos y quién recibe el dinero?** Una persona natural, los tres por separado, o una sociedad. Decide quién firma el contrato de encargo, quién emite boleta con qué RUT, si hay o no IVA (§8.2) y qué nombre va en `privacidad.html`. Es el pendiente 9 de la [etapa 1](01-arquitectura-y-posicionamiento.md) y bloquea las tres etapas.
3. **¿Se confirma que la orientación inicial sigue siendo gratuita?** De eso depende que el cobro pueda quedar fuera de la agenda, que es lo que hace viable y barata la recomendación (§5).
4. **Honorarios de la sesión, y si existe valor social o arancel diferenciado.** Sin un monto no hay enlace de pago posible.
5. **Política de cancelación e inasistencia**, redactada en palabras del proyecto y no copiada de un proveedor.
6. **¿Quién atiende los bloques de la agenda actual, y se abren agendas propias para los tres?**
7. **¿Se acepta que las reservas se traten en la infraestructura de Google, fuera de Chile?** Si la respuesta es no, la conversación cambia y hay que evaluar autoalojamiento con todo su costo (§7.2).
8. **¿Se autoriza dejar el motivo de consulta fuera de todo formulario de reserva?** Es la recomendación de este documento y afecta lo que el profesional sabe antes de la primera conversación.
9. **¿Se instala una analítica sin cookies?** No para este sistema, pero sin ella ninguna decisión de etapa dos podrá justificarse con datos.

---

## 15. Adoptado en este documento

- No se reemplaza lo que funciona. La agenda de Google se publica antes de evaluar cualquier reemplazo.
- El cobro no entra en el primer contacto. La orientación inicial no se cobra y por eso el pago vive fuera de la agenda.
- Se prefiere enlazar antes que incrustar: menos CSS ajeno, menos scripts, menos superficie de datos, y en este caso es la única opción técnica posible.
- La agenda no pregunta el motivo de consulta. Ese dato se dice hablando.
- Ningún proveedor se contrata sin contrato de encargo y sin saber dónde quedan los datos.
- Se prefiere la transferencia automatizada a la tarjeta de crédito: es más barata, no genera contracargos y no endeuda a quien consulta.
- Cancelar tiene que ser tan fácil como reservar.
- Un sistema completo de gestión clínica es una etapa propia, con decisión institucional. No se compra para resolver una planilla.
