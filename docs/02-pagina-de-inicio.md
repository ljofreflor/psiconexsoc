# Etapa 2 — Página de inicio

Textos listos para implementar. Lo que aparece entre corchetes es un hueco institucional, no una invitación a improvisar. La jerarquía de bloques está fijada en la [etapa 1, §5](01-arquitectura-y-posicionamiento.md).

Registro: el inicio habla a los cuatro públicos a la vez. Por eso el tono es firme y claro. La densidad teórica se reserva para las páginas de estudio y para la biblioteca.

---

## 5.1 Encabezado principal

**Marca**
PSICONEXSOC

**Descriptor**
Clínica, investigación y divulgación psicoanalítica

**Consigna**
La palabra tiene efectos.

**Texto**
En PSICONEXSOC desarrollamos una práctica clínica y académica orientada por el psicoanálisis. Investigamos las formas contemporáneas del sufrimiento psíquico, con especial atención a las psicosis, las estructuras límite, las toxicomanías, los trastornos del ánimo y las distintas relaciones entre lenguaje, cuerpo, deseo y cultura.

**Botones**

| Orden | Etiqueta | Destino |
| --- | --- | --- |
| 1 | Solicitar orientación clínica gratuita | `/contacto` o `/clinica#orientacion` |
| 2 | Explorar la biblioteca | `/biblioteca` |
| 3 | Conocer al equipo | `/equipo` |

El botón 1 es el único de énfasis. Los otros dos son secundarios.

**Implementación.** Título de página y `og:title`: `PSICONEXSOC — Clínica, investigación y divulgación psicoanalítica`. Meta descripción: el párrafo del encabezado, sin la consigna.

---

## 5.2 Vinculación con Lalangue

Aparece inmediatamente después del encabezado. No va al pie ni se diluye en un listado de «aliados».

**Sobrelinea** (opcional)
Facultad Internacional de Psicología y Psicoanálisis Lalangue

**Título**
Vinculación académica internacional

**Texto** — fórmula provisional, sujeta a autorización
PSICONEXSOC mantiene una colaboración cercana y activa con la Facultad Internacional de Psicología y Psicoanálisis Lalangue, participando en instancias de formación, docencia, investigación y circulación internacional del pensamiento psicoanalítico.

**Botón**
Conocer nuestra colaboración con Lalangue → `/vinculacion`

**Logotipo.** Solo si existe autorización institucional. Si no, el nombre de la Facultad, escrito completo, basta.

**Hasta que se autorice la fórmula.** No usar «aval», «afiliación», «sede», «representación» ni «proyecto asociado». Si la autorización llega con otra denominación, se sustituye «colaboración» en este párrafo y en `/vinculacion`; no se reescribe el resto de la home.

---

## 5.3 Presentación del proyecto

**Título**
Psicoanálisis, clínica e investigación

**Texto**
PSICONEXSOC es un espacio dedicado al estudio, la transmisión y la práctica del psicoanálisis. Nuestro trabajo reúne la tradición freudiana, lacaniana y kleiniana con aportes psicodinámicos, relacionales y contemporáneos. Nos interesa sostener una lectura rigurosa del sufrimiento subjetivo sin reducirlo a una clasificación diagnóstica ni separarlo de su historia, sus vínculos y las condiciones culturales en las que se produce.

**Tres accesos**

| Título | Bajada | Destino |
| --- | --- | --- |
| Clínica psicoanalítica | Un espacio de escucha para quienes buscan poner en palabras aquello que se repite o resulta difícil de habitar. | `/clinica` |
| Investigación y divulgación | Textos, áreas de estudio y una biblioteca pensada para leer el psicoanálisis con rigor y sin simplificación vacía. | `/biblioteca` |
| Crítica cultural y trabajo social | Una lectura del malestar que no aísla al sujeto de las instituciones, el trabajo, la época y sus discursos. | `/sociedad` |

Las bajadas de las tarjetas no se usan en otro bloque.

---

## 5.4 Campo prioritario: las psicosis

Este bloque distingue al sitio de una página generalista de psicología. No ocupa más espacio que la clínica; ocupa un lugar más alto en la argumentación académica.

**Título**
Un campo prioritario de investigación: las psicosis

**Texto**
Una parte central de nuestro trabajo está dedicada al estudio de las psicosis y de sus múltiples formas clínicas: paranoia, esquizofrenia, melancolía, trastornos maníaco-depresivos, fenómenos elementales, desencadenamientos, psicosis ordinarias y modalidades contemporáneas de estabilización. Abordamos estos fenómenos desde la psicopatología clásica, Freud, Lacan y autores posteriores, articulando estructura, lenguaje, cuerpo, goce, delirio y lazo social.

**Botón**
Explorar el área de psicosis → `/areas-de-estudio/psicosis`

**Tarjetas** (enlace a subpáginas o anclas del área)

- Paranoia
- Esquizofrenia
- Melancolía
- Manía y bipolaridad
- Psicosis ordinarias
- Fenómenos elementales
- Delirio y suplencia
- Toxicomanías y psicosis
- Clínica diferencial

Si al lanzamiento no existen aún esas páginas, las tarjetas apuntan al índice del área. No se publican fichas vacías.

---

## 5.5 Clínica

Cambio de registro. Aquí se habla a quien consulta.

**Título**
Atención clínica psicoanalítica

**Texto**
Ofrecemos atención psicológica para personas adultas que atraviesan momentos de angustia, depresión, conflictos vinculares, dificultades relacionadas con su identidad, experiencias de vacío, crisis, consumo problemático de sustancias u otras formas de sufrimiento. Nuestro trabajo parte de la escucha de la palabra y de la historia singular de cada persona. No buscamos aplicar respuestas generales, sino comprender cómo se ha construido su malestar y qué función cumple dentro de su vida.

La primera orientación clínica es gratuita. Esta instancia permite conversar sobre el motivo de consulta, aclarar dudas y evaluar junto con la persona cuál de nuestros profesionales puede acompañar mejor su proceso.

**Botones**

| Etiqueta | Destino |
| --- | --- |
| Solicitar orientación gratuita | `/contacto` o `/clinica#orientacion` |
| Cómo trabajamos | `/clinica#como-trabajamos` |
| Conocer a los psicoanalistas | `/equipo` |

**No decir en este bloque.** Duración de la sesión, honorarios, dirección, ni el detalle de la orientación. Eso pertenece a `/clinica`.

**Línea de urgencia** (cuerpo menor, bajo los botones)
Este espacio no reemplaza la atención de urgencia. Ante riesgo vital o una crisis que no puede esperar, corresponde acudir a un servicio de urgencias. [Completar con el protocolo público cuando esté definido.]

---

## 5.6 Equipo

**Título**
El equipo

**Texto de marco**
PSICONEXSOC reúne orientaciones distintas del psicoanálisis contemporáneo. Esa diferencia no fragmenta el trabajo: amplía el modo de leer cada consulta y sostiene un diálogo entre tradiciones que no se reducen a una sola escuela.

**Fichas** — provisionales hasta recibir la información formativa. Ver [etapa 1, §6.8](01-arquitectura-y-posicionamiento.md).

### José Joaquín Valderrama

**Línea de orientación**
Psicoanálisis de orientación lacaniana

**Texto**
Su trabajo se orienta a la escucha del significante, la estructura clínica y las relaciones entre palabra, síntoma, deseo y goce. Desarrolla un interés particular por las psicosis, las estructuras límite, los trastornos del ánimo, las toxicomanías y la psicopatología psicoanalítica.

### Vicente Molina Toro

**Línea de orientación**
Psicoanálisis de orientación psicodinámica

**Texto**
Su práctica integra la escucha psicoanalítica con desarrollos contemporáneos sobre afectividad, relaciones objetales, organización de la personalidad y funcionamiento emocional. Su abordaje considera la historia vincular y los modos mediante los cuales cada persona regula y comprende su experiencia interna.

### Agustín Artigas Osorio

**Línea de orientación**
Psicoanálisis relacional

**Texto**
Su orientación enfatiza la dimensión intersubjetiva de la experiencia, la construcción del vínculo terapéutico y el modo en que las relaciones tempranas y actuales participan en la configuración del sufrimiento y de las posibilidades de transformación.

Cada ficha enlaza a `/equipo/[slug]`. Un botón al pie del bloque: Ver el equipo → `/equipo`.

Orden de aparición: el de este documento, salvo otra indicación del proyecto.

---

## 5.7 Publicaciones recientes

**Título**
Publicaciones recientes

**Bajada de sección**
Ensayos, artículos y conversaciones de la Biblioteca PSICONEXSOC.

**Rejilla.** Entre tres y seis piezas. Campos por tarjeta: categoría; título; bajada (una o dos líneas); autor; fecha; tiempo estimado de lectura; imagen de portada sobria; botón «Leer artículo».

**Vacío.** Si hay menos de tres publicaciones reales, el bloque no se inventa. Puede mostrarse una sola pieza o retirarse hasta que el archivo lo sostenga.

Categorías y plantilla: [etapa 1, §6.4](01-arquitectura-y-posicionamiento.md).

---

## 5.8 Formación y actividades

**Título**
Formación y actividades

**Texto**
Cursos, grupos de estudio, seminarios y conversaciones —algunas de ellas junto a Lalangue y otras instituciones— forman parte del modo en que PSICONEXSOC transmite el psicoanálisis. Aquí se anuncian las inscripciones abiertas y se conserva un archivo de lo ya realizado.

**Contenido.** Hasta tres actividades vigentes. Si no hay ninguna abierta, mostrar el archivo reciente o un enlace único: Ver formación y actividades → `/formacion`.

No listar tipos de actividad («cursos, seminarios, entrevistas…») como si fueran una oferta concreta.

---

## 5.9 Trabajo social y crítica cultural

**Título**
El malestar también es de época

**Texto**
El sufrimiento psíquico no puede pensarse separado de las condiciones históricas, materiales e institucionales en las que viven los sujetos. PSICONEXSOC desarrolla una línea de reflexión sobre salud mental, desigualdad, educación, psiquiatría, infancia, trabajo, poder y cultura contemporánea, articulando el psicoanálisis con el materialismo histórico, la teoría crítica y autores como Marx, Foucault, Adorno, Deleuze, Guattari y Žižek.

**Botón**
Conocer esta línea de trabajo → `/sociedad`

El título de sección no reproduce el de `/sociedad`. El párrafo sí puede reutilizarse allí como apertura, o acortarse: no se escriben dos versiones rivales.

---

## 5.10 Cierre y contacto

**Consigna**
Cada consulta tiene una historia singular.

**Botón**
Solicitar una orientación inicial gratuita → `/contacto`

**Datos resumidos**

- Modalidad presencial y/o en línea
- Atención para adultos
- Formulario de contacto
- Correo institucional: [completar]
- Instagram: [completar; hoy existe presencia pública en [linktr.ee/psiconexsoc](https://linktr.ee/psiconexsoc)]
- Tiempo estimado de respuesta: [completar]

Hasta tener correo y plazo, el cierre muestra modalidad, atención a adultos y el botón del formulario. No se publican campos vacíos.

---

## Pie de página (todas las páginas)

No forma parte del scroll argumental del inicio, pero se define aquí para no improvisarlo después.

**Columna 1.** PSICONEXSOC · Clínica, investigación y divulgación psicoanalítica · La palabra tiene efectos.

**Columna 2.** Clínica · Equipo · Biblioteca · Formación · Contacto

**Columna 3.** PSICONEXSOC · Áreas de estudio · Vinculación · Privacidad

**Columna 4.** Correo · Instagram · Aviso: este sitio no sustituye servicios de urgencia.

---

## Notas de implementación

1. El inicio no debe crecer por debajo del cierre. Cualquier bloque nuevo se discute antes de diseñarse.
2. Los tres CTA clínicos del documento (encabezado, clínica, cierre) pueden apuntar al mismo formulario. No crear tres flujos distintos.
3. Imágenes: portadas sobrias, sin stock de «consulta empática» ni iconografía médica genérica.
4. En móvil, el orden de bloques se mantiene. Las nueve tarjetas de psicosis pueden pasar a un carril horizontal o a un listado compacto; no se eliminan.
5. Textos de interfaz (botones, aria-labels, estados de formulario) se detallan en la etapa 5. Las etiquetas de botón de este archivo ya son las definitivas.
