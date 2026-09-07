# Indexar ensayos, después de la firma

Los tres textos de `biblioteca/` nacen con `noindex` y están en `robots.txt`. No se tocan hasta que el equipo los lea y firme.

Cuando un texto esté aprobado:

1. Quitar `<meta name="robots" content="noindex">` de esa página.
2. Quitar su línea `Disallow` en `robots.txt`.
3. Añadir la URL a `sitemap.xml`.
4. En el listado de `biblioteca.html`, retirar la etiqueta «Borrador» de esa ficha.
5. `node tools/partials.mjs --check`

No se indexa un borrador para «llenar» el sitemap.
