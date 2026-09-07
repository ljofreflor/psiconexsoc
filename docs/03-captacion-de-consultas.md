# Levantamiento — Captación de consultas clínicas

Auditoría del sitio con un solo objetivo: que lleguen más consultas. No es una etapa de redacción ni sustituye la [etapa 3](documento-maestro.md), que sigue pendiente; le entrega los hallazgos y las preguntas que esa etapa tendrá que responder.

Todo lo que sigue está verificado contra los archivos del repositorio y contra el sitio publicado, medido en un navegador a 390 × 844 px. Se citan rutas y líneas. Donde un dato no existe se dice que no existe, no se supone.

Este documento no modifica nada. En particular no toca `index.html`, `css/main.css` ni `js/grafo.js`, que están siendo intervenidos en paralelo; lo que corresponde a esos archivos queda descrito como encargo, no como edición.

**Restricción de partida.** Esto es salud mental. Las tácticas de conversión que funcionan en comercio electrónico —urgencia, escasez, testimonios, prueba social— o son improcedentes o son contrarias a la ética profesional. El §11 las enumera y explica por qué se descartan. No están omitidas por olvido.

---

## 1. Resumen: los tres hallazgos que más pesan

1. **El correo al que apunta todo el sitio no existe.** `psiconexsoc.com` no está registrado. Toda solicitud enviada por el formulario o por `mailto:` no llega a ninguna parte.
2. **El sitio está fuera del embudo de Instagram.** El Linktree del proyecto tiene dos enlaces y ninguno lleva al sitio. Uno lleva a una agenda de Google que funciona y que el sitio nunca menciona; el otro lleva al dominio que no existe.
3. **No hay medición de ninguna clase.** Ni una línea de analítica en las quince páginas. Nadie puede saber hoy cuántas personas llegan a `contacto.html` y no envían nada, que es exactamente la cifra de la que trata este documento.

---

## 2. Hallazgo crítico: el dominio no está registrado

Verificación:

```
dig @8.8.8.8 psiconexsoc.com A   →  NXDOMAIN
whois psiconexsoc.com            →  No match for domain "PSICONEXSOC.COM"
```

No es que el DNS no apunte todavía a GitHub Pages. El dominio no está inscrito. De ahí se sigue todo lo demás:

- **`contacto@psiconexsoc.com` no puede recibir correo.** Sin dominio no hay registro MX. La dirección aparece en el pie de las quince páginas, en [clinica.html:120](../clinica.html), en [contacto.html:82](../contacto.html), en [privacidad.html:81](../privacidad.html), en la meta descripción de `contacto.html:7` y dentro del JSON-LD de `index.html:20`.
- **El formulario no puede haber funcionado nunca.** [js/nav.js:66](../js/nav.js) hace `POST` a `https://formsubmit.co/ajax/contacto@psiconexsoc.com`. FormSubmit activa un destino enviando un enlace de confirmación a esa dirección. Si la dirección no puede recibir correo, la activación no pudo ocurrir; el envío falla y el código cae en `mailtoFallback` ([js/nav.js:94-98](../js/nav.js)), que abre el cliente de correo apuntando al mismo dominio inexistente. Rebota.
- **El enlace del Linktree a `www.psiconexsoc.com` está roto hoy**, en la biografía pública de Instagram.
- **Riesgo de datos, no solo de conversión.** Un dominio libre lo puede registrar cualquiera. Quien lo haga recibe el correo dirigido a `contacto@psiconexsoc.com`: solicitudes de consulta psicológica con nombre y motivo. Registrar el dominio es, antes que una medida de marketing, una medida de protección de datos.

El plan editorial paralelo contempla el cambio a `psiconexsoc.com` dando por hecho que basta apuntar el DNS. El paso cero —inscribir el dominio y montar el correo— no está dado.

**Mientras tanto**, publicar una dirección que rebota es peor que no publicar ninguna. Hasta que el correo exista, el canal visible tiene que ser el teléfono y la agenda del §3.

---

## 3. El embudo real, desde Instagram

### 3.1 Lo que ocurre hoy

La única presencia pública documentada es [linktr.ee/psiconexsoc](https://linktr.ee/psiconexsoc) ([etapa 1, §8](01-arquitectura-y-posicionamiento.md)). Ese Linktree tiene exactamente dos enlaces propios:

| Etiqueta en el Linktree | Destino | Estado |
| --- | --- | --- |
| Agenda una Sesión de Orientación | `calendar.app.google/C9fMj6JkVmG1vV1B7` → agenda de citas de Google | Vivo, responde 200 |
| Newsletter | `https://www.psiconexsoc.com/` | Roto: dominio inexistente |

**Ninguno de los dos apunta al sitio.** Quien llega desde Instagram o agenda directamente en Google Calendar, o cae en un enlace muerto. El sitio no participa del embudo social.

Y a la inversa: la agenda de Google no aparece en ninguna parte del sitio. Búsqueda en las quince páginas y en los cuatro archivos JavaScript: cero coincidencias con `calendar`, `agenda` o `wa.me`.

El resultado es que hay dos embudos que no se conocen, y el bueno es el que no pasa por el sitio:

- **Vía Linktree:** un toque, elegir un bloque horario, listo.
- **Vía sitio:** portada → botón → `contacto.html` → cinco campos, uno de ellos un texto libre obligatorio sobre el propio sufrimiento → envío a un correo que no existe → espera de duración no declarada.

### 3.2 Los tres CTA clínicos

[La etapa 2](02-pagina-de-inicio.md) define tres llamados clínicos —encabezado (§5.1), bloque de clínica (§5.5) y cierre (§5.10)— y pide en sus notas de implementación que los tres apunten al mismo formulario. En la portada publicada hay **dos**, no tres: `index.html:80` y `index.html:181`. El bloque 5.5, que era el único texto en registro accesible de la portada, no está.

Los dos existentes van a `contacto.html`. **Ninguno va a `clinica.html#orientacion`**, que es la página donde se explica qué es la orientación gratuita. Quien necesita entender antes de escribir no tiene ruta hacia esa explicación salvo el menú.

### 3.3 Las páginas que atraerán tráfico no tienen salida clínica

`areas/psicosis.html` es la página con vocación de posicionamiento del sitio: alguien que busca «melancolía», «psicosis ordinaria» o «fenómenos elementales» puede llegar ahí. Su cuerpo son nueve tarjetas y un párrafo introductorio, y **no contiene ningún llamado a consultar**: solo el menú y el pie. Lo mismo en `biblioteca.html`, `sociedad.html`, `areas-de-estudio.html`, `psiconexsoc.html` y `formacion.html`. Los únicos `.btn` clínicos del sitio están en `index.html`, `clinica.html:122` y `equipo.html:101`.

Quien se reconoce leyendo la descripción de la melancolía es exactamente la persona que este sitio quiere escuchar, y es la que hoy se queda sin siguiente paso.

---

## 4. El canal que ya funciona y el sitio esconde

**La agenda de Google existe y responde.** `calendar.app.google/C9fMj6JkVmG1vV1B7` redirige (302) a una agenda de citas de Google Calendar que devuelve 200. Es autoservicio: la persona elige el bloque y termina. No depende del correo roto ni de que alguien revise una bandeja.

Publicarla en el sitio es la intervención de mejor relación impacto/esfuerzo de todo este documento, y no requiere ninguna decisión nueva del equipo: la agenda ya está publicada por ellos, en su propio Linktree. Solo hay que confirmar que sigue vigente y qué profesional atiende esos bloques.

**El teléfono.** `+56 9 8121 6395` aparece una sola vez en el cuerpo del sitio, en [contacto.html:82](../contacto.html), dentro de un `.note` gris de 14,72 px, en tercer lugar de una enumeración separada por `·`, después del correo que no funciona. Es el único canal con posibilidad de responder hoy y es tipográficamente lo menos visible de la página.

**WhatsApp.** En Chile es el canal por defecto para agendar salud, y el prefijo `+56` sugiere un móvil. La forma sobria de incorporarlo:

- Un enlace `https://wa.me/56981216395?text=…` con texto previo neutro («Hola, quisiera solicitar una orientación inicial»), presentado como un canal más junto al correo y la agenda. No una burbuja flotante.
- Sin insignia de «mensaje no leído», sin contador, sin «responde en minutos». Esa insignia es una señal fabricada.
- Con una franja horaria declarada y una línea explícita: WhatsApp no es un canal clínico y no atiende urgencias, remitiendo al aviso que ya está en el pie.
- **Si nadie puede comprometerse a una franja horaria, no se publica.** Un WhatsApp sin responder es peor que ningún WhatsApp: quien escribe pidiendo ayuda y no recibe respuesta no vuelve.

---

## 5. `clinica.html`: el registro y el orden

### 5.1 El registro cumple a medias

[La etapa 1, §3](01-arquitectura-y-posicionamiento.md) exige aquí un registro distinto del de las áreas de estudio: «directo, acogedor, sin tecnicismos innecesarios». La página lo sostiene en la apertura y en la orientación, y lo rompe en dos lugares:

- `clinica.html:92` lista «Vínculo transferencial» entre los elementos del trabajo. Es vocabulario del registro académico, en la página que el propio documento define como la más clara del sitio.
- La lista de motivos (`clinica.html:95-109`) se publica como trece viñetas sin marco. El encargo de la [etapa 1, §6.2](01-arquitectura-y-posicionamiento.md) dice literalmente «Motivos de consulta — **no un catálogo diagnóstico**», y la advertencia se perdió al implementar: quedó el catálogo, sin la frase que lo desactiva. Leído desde el sufrimiento, «Crisis subjetivas» y «Experiencias psicóticas o de desorganización» funcionan como un menú de etiquetas posibles, que es justo el reduccionismo que el proyecto rechaza.

Ambos se arreglan con una frase y un cambio de palabra. Es trabajo de redacción, no de estructura.

### 5.2 La orientación gratuita llega demasiado tarde

Medido a 390 px sobre la página publicada:

| Elemento | Posición | En pantallas |
| --- | --- | --- |
| Alto total de la página | 5176 px | 6,13 |
| Título «Orientación inicial gratuita» | 2450 px | **2,90** |
| Único botón de la página | 2919 px | **3,46** |
| Preguntas frecuentes | 3788 px | 4,49 |

El hecho más persuasivo del proyecto —la primera conversación no se cobra— exige casi tres pantallas de scroll en un teléfono, después de trece viñetas de sintomatología. El único botón de toda la página aparece a tres pantallas y media. El encabezado (`clinica.html:76-78`) no menciona la gratuidad, ni la modalidad, ni para quién es.

Las nueve preguntas frecuentes (`clinica.html:147-155`) están bien escritas y responden lo que la gente pregunta de verdad, pero viven a 4,5 pantallas y difieren a la orientación las dos respuestas que deciden una consulta: cuánto cuesta después y cuánto dura el proceso.

---

## 6. La información práctica que falta

### 6.1 Lo que el sitio sí responde

Modalidad en línea o presencial (`clinica.html:119`, `contacto.html:82`), atención a adultos (`clinica.html:133`), duración de la sesión —50 minutos— y de la orientación —30 a 50— (`clinica.html:119`, `clinica.html:134`), qué ocurre en la primera conversación (`clinica.html:118`), coordinación con psiquiatría (`clinica.html:153`) y confidencialidad del proceso (`clinica.html:155`).

### 6.2 Lo que falta, y qué consulta cuesta cada ausencia

| Falta | Verificación | Por qué cuesta consultas | Quién lo resuelve |
| --- | --- | --- | --- |
| **País y ciudad** | La palabra «Chile» no aparece en ninguna página ni en ningún documento. La única evidencia de país en el repositorio es el prefijo `+56` de `contacto.html:82` y `"areaServed":"CL"` dentro del JSON-LD, que ningún humano ve. | Quien busca atención busca atención cerca, o al menos en su huso horario y su sistema de salud. Sin país declarado, la mitad de los visitantes no sabe si esto les sirve. | Equipo: confirmar país y ciudad. |
| **Honorarios** | Ningún número en todo el sitio. Solo «los honorarios y la política de cancelación se informan en la orientación» (`clinica.html:137`). | Es la primera pregunta y la razón más frecuente para no escribir. Un rango publicado convierte más que un rango oculto, incluso si el rango es alto. | Equipo: rango o valor. |
| **Valor social o arancel diferenciado** | Cero coincidencias en el sitio. | El proyecto sostiene una línea explícita sobre desigualdad y salud mental comunitaria (`sociedad.html`). El silencio sobre la accesibilidad de sus propios honorarios es especialmente visible ahí. | Equipo: decisión. |
| **Horarios y huso horario** | No existen. | Decisivo en atención en línea. Sin huso horario, quien está en otro país no puede evaluar. | Equipo. |
| **Tiempo de respuesta** | No solo falta: se declara faltante. `contacto.html:83` dice «El tiempo de respuesta se informará aquí cuando esté definido», inmediatamente encima del formulario. | Pedir ayuda sin saber si habrá respuesta ni cuándo es el punto exacto donde la gente abandona. | Equipo: comprometer una franja (48 horas hábiles, por ejemplo). |
| **Idiomas** | Nada. Solo `lang="es"`. | Barato de declarar, relevante para atención en línea. | Equipo. |
| **Dirección presencial** | No existe, y sin embargo se ofrece atención presencial. | «Presencial y/o en línea» sin dirección se lee como indefinición. Además bloquea toda la búsqueda local del §8. | Equipo: dirección, o retirar «presencial». |
| **Fonasa / Isapre / boleta** | Cero coincidencias. | En Chile es pregunta estándar. Incluso la respuesta negativa —«no hay convenio, se emite boleta»— evita la consulta que no llega. | Equipo. |
| **Credenciales del equipo** | Ninguna. Ver §7. | Ver §7. | Equipo. |
| **Política de cancelación** | Diferida a la orientación (`clinica.html:137`). | Menor, pero es de las cosas que se preguntan antes de comprometerse. | Equipo. |

Todo lo de esta tabla salvo la última columna es implementable en minutos. Ninguno de estos datos puede inventarse.

---

## 7. Señales de confianza

### 7.1 `equipo.html` no permite elegir a nadie

Tres fichas (`equipo.html:83-97`), cada una con nombre, orientación teórica y un párrafo. La página **no contiene una sola etiqueta `<img>`**: ninguna cara. Tampoco título profesional, universidad, año de titulación ni número de registro.

Y `equipo.html:99` publica la confesión: «Estas descripciones son provisionales y se precisarán con la información formativa de cada integrante». Quien está eligiendo a quién le va a contar su vida lee que el propio sitio no sabe todavía quiénes son.

Las tres fichas tienen `id` (`valderrama`, `molina`, `artigas`), pero no existen páginas por integrante y nada enlaza a esos anclajes.

### 7.2 Lo que el contexto chileno exige

Sujeto a que el equipo confirme que el proyecto es chileno —el repositorio no lo dice en ninguna parte, solo lo sugiere el prefijo telefónico—, lo que un visitante chileno busca antes de escribir es: el título profesional, la universidad, y el número del Registro Nacional de Prestadores Individuales de Salud de la Superintendencia de Salud, que es públicamente verificable.

Publicar ese número no es una táctica de marketing: es una afirmación comprobable por cualquiera, lo contrario de un patrón oscuro. Es la señal de confianza más fuerte disponible y no depende de ninguna decisión de diseño, solo del dato.

### 7.3 Fotografías

[La etapa 2](02-pagina-de-inicio.md) prohíbe el stock de «consulta empática» y la iconografía médica genérica. No prohíbe los retratos reales del equipo, y son cosas distintas. Un retrato sobrio de una persona real es la señal de confianza más eficaz que puede tener un sitio de psicoterapia, y es compatible con el registro del proyecto: fondo neutro, sin bata, sin sonrisa de catálogo. Requiere las fotografías y el consentimiento de los tres.

### 7.4 Responsable identificable

`contacto.html` no nombra a ningún responsable, y `privacidad.html` tampoco: ni razón social, ni responsable de datos, ni canal para ejercer derechos. Es el pendiente 9 de la [etapa 1, §9](01-arquitectura-y-posicionamiento.md) y hoy es también un problema de conversión: un sitio de salud sin nadie que responda por él es un sitio al que no se le confía un motivo de consulta.

---

## 8. El formulario de contacto

Fuente: `contacto.html:84-98` y [js/nav.js:28-100](../js/nav.js).

### 8.1 No funciona sin JavaScript

Medido en el navegador: el elemento `form` tiene `action = null` y `method = null`. Sin JavaScript, pulsar «Enviar solicitud» hace un `GET` a la misma página, borra los campos y no muestra ningún error. La persona cree que envió algo. Dentro del navegador integrado de Instagram, donde el JavaScript de terceros puede fallar o bloquearse, esto es un fallo silencioso en el peor momento posible.

### 8.2 El motivo de consulta viaja a un tercero gratuito

`js/nav.js:66` envía el formulario a `formsubmit.co`, un relé estadounidense gratuito. La carga incluye `motivo`: texto libre sobre el sufrimiento psíquico de una persona identificada por nombre y correo. Eso es dato de salud.

`privacidad.html:81` dice únicamente que «el procesador de envío no deja una ficha en nuestros servidores». Es cierto y es insuficiente: no nombra al procesador, no dice que los datos salen del país, no dice cuánto tiempo se conservan, no identifica a un responsable ni ofrece un canal para ejercer derechos. Con la Ley 21.719 tratando los datos de salud como sensibles, este es el punto más débil del sitio entero.

GitHub Pages no permite alojar el procesamiento en el propio servidor. Las dos salidas honestas son: contratar un procesador nombrado con acuerdo de tratamiento, o **sustituir el texto libre por la agenda del §4**, que evita que el motivo de consulta transite por ninguna parte. La segunda es más barata y clínicamente mejor: la persona cuenta su motivo hablando, que es de lo que trata todo esto.

### 8.3 Fricción, campo por campo

Cinco campos no son muchos. La fricción no está en el número:

- **`motivo` es `required`.** Se le pide a alguien en malestar que resuma su sufrimiento en una caja de texto, obligatoriamente, antes de que la página le haya dicho nada tranquilizador y sin indicarle quién lo va a leer. Hacerlo opcional, o reetiquetarlo («Si quieres, cuéntanos en una línea de qué se trata; puedes dejarlo en blanco»), no cuesta nada y retira la barrera más alta.
- **La casilla de consentimiento mide 13 × 13 px** (medido). Está por debajo del mínimo de 24 × 24 de WCAG 2.2 y muy lejos de los 44 × 44 cómodos, y es obligatoria: un toque fallado es una solicitud no enviada.
- **Los campos usan 12,8 px** (medido). Safari en iOS hace zoom automático sobre cualquier campo con menos de 16 px: la página salta en cada toque. Es CSS, y `css/main.css` está intervenido en paralelo; queda como encargo, no como edición.

### 8.4 Lo que el formulario no dice

- **No promete confidencialidad.** La casilla dice para qué se usan los datos; la página nunca dice que la conversación es confidencial. Lo dice la FAQ, en otra página. Una frase aquí pesaría más que toda la casilla.
- **No dice cuándo responden.** `contacto.html:83` confiesa que no está definido, y el mensaje de éxito (`js/nav.js:90-91`) dice «Te responderemos por correo» sin plazo.
- **La confirmación es inaudible e invisible.** El párrafo de estado no tiene `role="status"` ni `aria-live` (medido: ambos `null`): quien usa lector de pantalla no recibe confirmación alguna. Y en un teléfono, tras `form.reset()`, lo que queda a la vista es un formulario vacío: se lee como si no hubiera pasado nada.

### 8.5 Qué ocurre cuando falla

`mailtoFallback` (`js/nav.js:34-50`) manda a la persona a su cliente de correo apuntando a un dominio inexistente. En móvil, y sobre todo dentro del navegador de Instagram, `mailto:` con frecuencia no hace absolutamente nada: el respaldo falla en silencio y el texto escrito queda varado en un formulario que la persona está a punto de abandonar. No hay un tercer respaldo —teléfono, WhatsApp, copiar al portapapeles— y debería haberlo, porque es el momento en que ya se decidió a pedir ayuda.

Aparte: `_captcha: "false"` (`js/nav.js:79`) sin campo trampa. Cuando el correo exista, las solicitudes reales van a competir con spam en la misma bandeja.

---

## 9. Búsqueda local y datos estructurados

El JSON-LD existe en un solo lugar, `index.html:19-21`, con `ProfessionalService` + `EducationalOrganization`.

Falta, para que el sitio pueda aparecer ante «psicoanalista en [ciudad]»:

- **`address`** (`PostalAddress` con `addressLocality`, `addressRegion`, `addressCountry`). Es el campo que hace posible la búsqueda local, y no puede completarse sin el §6.2.
- **`sameAs`** con Instagram, TikTok, Facebook y Linktree. Es lo que permite a un buscador unir el sitio con las cuentas que ya tienen público. Los perfiles existen; los identificadores exactos los tiene el equipo.
- `openingHoursSpecification`, `priceRange`, `availableLanguage`, `geo`, `logo`, `@id` estable.
- **`Person`** para los tres integrantes en `equipo.html`, con `jobTitle` y `alumniOf` cuando existan los datos.
- **`FAQPage`** en `clinica.html`. Las nueve preguntas ya están escritas y marcadas con `<details>`: es elegibilidad para resultados enriquecidos que hoy se está dejando sin usar, y no requiere ningún dato nuevo.
- **`ContactPoint`** en `contacto.html`.

Dos defectos concretos además:

- El campo `email` del JSON-LD apunta a un dominio inexistente. Un dato estructurado que declara una dirección inalcanzable.
- Los canónicos apuntan a `ljofreflor.github.io/psiconexsoc/`. Para un servicio clínico, una URL de repositorio personal es en sí misma un costo de credibilidad, y el dominio propio ni siquiera está inscrito.

Y dos detalles menores: `robots.txt` excluye `/biblioteca/texto.html` y `/formacion/actividad.html` pero no `/biblioteca/cita.html`, que también es plantilla con `noindex`; y no existe `404.html`, de modo que una URL mal tecleada o mal compartida termina en la página genérica de GitHub, sin ninguna vuelta al contacto.

**Advertencia honesta.** Nada de esto posiciona un sitio que tiene una página por tema y ninguna publicación. Los datos estructurados amplifican contenido, no lo sustituyen. El plan editorial paralelo —psicosis como página larga, los primeros ensayos, la biblioteca real— es el prerrequisito de este apartado, no su complemento.

---

## 10. Medición

**No hay ninguna.** Búsqueda de `gtag`, `googletagmanager`, `plausible`, `umami`, `matomo`, `fathom`, `goatcounter`, `clarity` y `hotjar` en las quince páginas y los cuatro archivos JavaScript: cero coincidencias.

Es un hallazgo por sí mismo. La única señal que el equipo tiene hoy es el contador de clics de Linktree, y mide precisamente el embudo que no pasa por el sitio. Nadie puede responder cuántas personas llegaron a `contacto.html` y no enviaron nada, ni si la orientación gratuita se ve antes de que la gente abandone `clinica.html`. Todo este documento es una lista de hipótesis hasta que algo cuente.

**Compatibilidad con `privacidad.html`.** Ese archivo hoy no menciona la analítica en absoluto, así que instalar cualquier cosa obliga a modificarlo. Es una restricción real:

- Un contador sin cookies y sin datos personales —Plausible, o GoatCounter autoalojado— se declara en dos frases y no necesita banner de consentimiento.
- Google Analytics exigiría banner, declaración de transferencia y un tercero publicitario, y quedaría mal junto a una página que promete no guardar nada. Se descarta.
- El píxel de Meta se descarta de plano; está en el §11.

**Primer paso sin terceros.** Antes de instalar nada: hoy los cuatro llamados clínicos aterrizan todos en `contacto.html` sin ninguna forma de distinguirlos. Diferenciarlos con anclas o parámetros —portada superior, portada cierre, clínica, equipo— permite que cualquier contador futuro responda retroactivamente cuál funciona. Eso es implementable sin depender de nadie, salvo los dos que están dentro de `index.html`.

---

## 11. Móvil, medido a 390 px

| Página | Alto | Pantallas |
| --- | --- | --- |
| Portada | 3562 px | 4,22 |
| `clinica.html` | 5176 px | 6,13 |
| `contacto.html` | 1966 px | 2,33 |

Hallazgos:

- **La portada publicada tiene 875 caracteres de texto en total.** No dice en qué país está, no dice «en línea» —verificado: ninguna coincidencia—, no dice para quién es.
- **La primera pantalla del móvil contiene una promesa incumplida.** Bajo el CTA principal aparece el botón de la consigna con la etiqueta «La voz de la consigna aún no está» (`js/consigna.js:19`): un control que anuncia su propia ausencia, en los píxeles más valiosos del sitio. La corrección está en `js/consigna.js`, fuera de los archivos intervenidos: ocultar el control cuando el audio no existe en lugar de declararlo.
- **`.nav-toggle` mide 29 × 38 px**, por debajo de los 44 × 44 recomendados, y es la única entrada a la navegación completa en teléfono.
- `contacto.html` está bien proporcionada en móvil; sus problemas son los del §8.3, no los del largo.
- `clinica.html` es el caso grave, y está detallado en el §5.2.

---

## 12. Descartado por razones éticas

Se evaluaron y se descartan. La lista importa tanto como las recomendaciones, porque son las tácticas que un asesor de conversión propondría primero.

- **Testimonios, reseñas y calificaciones de pacientes.** Improcedente en clínica: ningún paciente puede dar un consentimiento libre de transferencia a la solicitud publicitaria de su terapeuta, y publicarlo vulnera la confidencialidad aunque consienta. Incluye no usar `AggregateRating` en los datos estructurados, que es el cambio que más mejoraría el clic desde el buscador.
- **Urgencia y escasez.** «Quedan 2 cupos», contadores, cuentas regresivas, ventanas de salida. Fabricar urgencia sobre alguien que está en crisis es coerción, no persuasión.
- **Burbuja de chat con insignia de mensaje no leído.** La insignia es una señal falsa, y un chat que parece atendido y no lo está es peor que no tenerlo en un sitio de salud mental.
- **Prometer resultados.** «Supera tu ansiedad», «recupera tu bienestar en X sesiones». Contradice el «no hacer» de la [etapa 1, §9](01-arquitectura-y-posicionamiento.md) y es profesionalmente indefendible.
- **Test de autodiagnóstico como gancho.** Convierte muchísimo y es exactamente el reduccionismo diagnóstico que el proyecto rechaza.
- **Píxel de Meta y retargeting.** Construir una audiencia publicitaria con quienes visitaron la página de psicosis es elaborar un perfil de inferencia de salud. Fuera de discusión.
- **Captar correos para newsletter desde el llamado clínico.** Mezclar una solicitud de consulta con una lista de difusión hace que alguien en malestar entregue su dirección para un fin que no eligió. Si hay newsletter —el Linktree anuncia una—, va como acción separada y etiquetada.
- **Imágenes de stock de «consulta empática» e iconografía médica.** Ya prohibidas en la [etapa 2](02-pagina-de-inicio.md). Los retratos reales del equipo son otra cosa y sí se recomiendan (§7.3).

---

## 13. Orden de trabajo

Ordenado por impacto esperado sobre las consultas recibidas.

| # | Acción | Impacto | Esfuerzo | Quién |
| --- | --- | --- | --- | --- |
| 1 | Registrar `psiconexsoc.com` y habilitar el correo | Máximo | Bajo | **Equipo** |
| 2 | Publicar la agenda de Google como llamado principal, junto al teléfono | Máximo | Bajo | Yo, tras confirmación |
| 3 | Apuntar el Linktree al sitio y reparar el enlace roto | Alto | Bajo | **Equipo** |
| 4 | Subir la orientación gratuita al encabezado de `clinica.html` y añadir un botón arriba | Alto | Bajo | Yo |
| 5 | Declarar país, ciudad, horarios, huso horario y tiempo de respuesta | Alto | Bajo | **Equipo** aporta, yo publico |
| 6 | Publicar honorarios o rango, y la política de valor social si existe | Alto | Bajo | **Equipo** decide |
| 7 | Fotografías, títulos, universidad y número de registro del equipo | Alto | Medio | **Equipo** aporta |
| 8 | Que el formulario funcione sin JavaScript y con un respaldo real al fallar | Alto | Medio | Yo |
| 9 | Llamado clínico al pie de `psicosis`, `biblioteca`, `sociedad` y `áreas` | Medio-alto | Bajo | Yo |
| 10 | Enlace de WhatsApp con franja horaria declarada | Medio-alto | Bajo | **Equipo** confirma, yo publico |
| 11 | Prometer confidencialidad y plazo de respuesta en el formulario; `motivo` opcional | Medio | Bajo | Yo, con el plazo del equipo |
| 12 | Instalar analítica sin cookies y actualizar `privacidad.html` | Medio | Bajo | **Equipo** aprueba, yo instalo |
| 13 | Reescribir `privacidad.html` nombrando procesador, responsable y derechos | Medio | Bajo | **Equipo** aporta razón social |
| 14 | `FAQPage`, `Person`, `ContactPoint`, `address` y `sameAs` en los datos estructurados | Medio | Bajo | Yo, con los datos del §6.2 |
| 15 | Quitar «vínculo transferencial» y enmarcar la lista de motivos | Medio | Bajo | Yo |
| 16 | Ocultar el botón de la consigna cuando el audio no existe | Medio | Muy bajo | Yo |
| 17 | Anclas o parámetros distintos por CTA para poder medirlos | Bajo-medio | Muy bajo | Yo, salvo los de `index.html` |
| 18 | Campos del formulario a 16 px y casilla a 24 px mínimo | Bajo-medio | Muy bajo | Encargo a `css/main.css` |
| 19 | `404.html` con salida hacia clínica y contacto | Bajo | Muy bajo | Yo |
| 20 | Excluir `/biblioteca/cita.html` en `robots.txt` | Bajo | Muy bajo | Yo |

---

## 14. Lo que necesito del equipo

Ninguno de estos datos puede inventarse ni deducirse del repositorio. Están ordenados por urgencia.

1. **¿Está registrado `psiconexsoc.com` a nombre de alguien?** Si no, quién lo inscribe y con qué correo se va a operar mientras tanto. Bloquea todo lo demás.
2. **¿Sigue vigente la agenda de Google del Linktree?** ¿Qué profesional atiende esos bloques y con qué disponibilidad?
3. **¿Se confirma que el proyecto es chileno?** El repositorio no lo dice en ninguna parte. Ciudad, y si hay atención presencial, dirección.
4. **Honorarios.** Valor o rango de la sesión. ¿Existe valor social o arancel diferenciado? ¿Se emite boleta? ¿Hay convenio con Fonasa o Isapre?
5. **Tiempo de respuesta comprometido.** Un número, aunque sea conservador. «Respondemos dentro de 48 horas hábiles» vale más que la frase actual.
6. **Horarios de atención y huso horario.** E idiomas de atención.
7. **Del equipo, para cada uno:** fotografía y consentimiento para publicarla, título profesional, universidad, año, y número del Registro Nacional de Prestadores si corresponde.
8. **¿El `+56 9 8121 6395` tiene WhatsApp?** ¿Quién lo revisa y en qué horario? Si no hay compromiso horario, no se publica.
9. **Razón social o persona responsable de los datos**, y un canal para ejercer derechos. Es el pendiente 9 de la etapa 1 y bloquea `privacidad.html`.
10. **Identificadores exactos** de Instagram, TikTok y Facebook para `sameAs`.
11. **Autorización para instalar un contador sin cookies** y para actualizar `privacidad.html` en consecuencia.

---

## 15. Adoptado en este documento

- El objetivo es la consulta recibida, no la visita. Las métricas de vanidad no ordenan esta lista.
- Ninguna táctica que fabrique urgencia, escasez o prueba social entra al sitio, aunque convierta.
- Un canal que no se puede responder no se publica.
- Un dato que no existe no se inventa: se pide o se omite.
- La agenda autogestionada es preferible al formulario de texto libre, por conversión y por protección de datos a la vez.
