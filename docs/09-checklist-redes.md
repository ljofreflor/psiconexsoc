# Checklist: Linktree y redes

Trabajo del equipo (fuera del repo). El sitio ya enlaza el hub y Linktree en el pie.

## Linktree (`https://linktr.ee/psiconexsoc`)

1. **Primer enlace:** sitio Pages — `https://ljofreflor.github.io/psiconexsoc/`
2. **Segundo enlace (opcional):** agenda — `https://ljofreflor.github.io/psiconexsoc/agenda.html?desde=meta`
3. **Quitar** el dominio caído (`www.psiconexsoc.com` u otro que no responda).
4. No dejar solo el Calendar de Google como único destino.

## `sameAs` (JSON-LD en `index.html`)

Hoy figura Linktree. Cuando el equipo confirme los handles exactos, agregar a `sameAs`:

- Instagram
- TikTok
- Facebook

Sin handles inventados.

## Correo de contacto

Cuando exista una casilla que reciba, ponerla en `js/site.js` como `correoContacto` (no es secreto). El formulario usará `mailto:` de respaldo si Supabase no está cableado.
