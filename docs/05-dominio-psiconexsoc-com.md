# Cambio a psiconexsoc.com

El dominio **no está registrado**. `dig` responde NXDOMAIN. No se añade `CNAME` ni se reescriben los canónicos hasta que el nombre exista, responda y tenga correo. Un archivo `CNAME` ahora rompe GitHub Pages.

## Paso 0 — inscribir y montar correo

1. Registrar `psiconexsoc.com` (y, si se quiere, el `www`).
2. Crear la casilla que el sitio va a publicar. Hasta que reciba, el canal visible sigue siendo el teléfono.
3. Comprobar que un mensaje de prueba llega.

## Registros DNS, cuando el dominio sea nuestro

Cuatro `A` en el apex, hacia las IP de GitHub Pages:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `ljofreflor.github.io` |

MX y registros de autenticación de correo: los que entregue el proveedor de la casilla. No se inventan aquí.

Cuando `dig psiconexsoc.com A` ya no sea NXDOMAIN y `https://psiconexsoc.com` responda, recién entonces el commit de corte.

## Commit de corte (un solo cambio, no antes)

- Crear `CNAME` en la raíz con una línea: `psiconexsoc.com`
- En `js/site.js`: `origin` → `https://psiconexsoc.com`, `base` → `/`
- Sustituir `https://ljofreflor.github.io/psiconexsoc` por `https://psiconexsoc.com` en canónicos, Open Graph, `sitemap.xml`, `robots.txt` y JSON-LD
- En GitHub Pages, dejar el dominio personalizado y esperar el certificado

Hasta ese commit, la URL pública sigue siendo `https://ljofreflor.github.io/psiconexsoc/`.
