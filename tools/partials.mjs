// Sincroniza nav, pie y preload de fuentes en los HTML públicos.
// Cero dependencias. Node 24.
//
//   node tools/partials.mjs
//   node tools/partials.mjs --check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

const SKIP = new Set([
  "cuenta.html",
  "panel.html",
  "gift.html",
  "equipo-interno.html"
]);

const REGIONES = ["fonts", "nav", "footer"];

function seccionDe(rel) {
  if (rel === "index.html") return "inicio";
  if (rel === "clinica.html" || rel === "agenda.html") return "clinica";
  if (rel === "biblioteca.html" || rel.startsWith("biblioteca/")) return "biblioteca";
  if (rel === "equipo.html") return "equipo";
  if (rel === "contacto.html") return "contacto";
  if (rel === "formacion.html" || rel.startsWith("formacion/")) return "formacion";
  if (rel === "sociedad.html") return "sociedad";
  if (rel === "areas-de-estudio.html" || rel.startsWith("areas/")) return "areas";
  if (rel === "psiconexsoc.html") return "proyecto";
  if (rel === "vinculacion.html") return "vinculacion";
  if (rel === "privacidad.html") return "privacidad";
  return "";
}

function prefijoDe(rel) {
  const depth = rel.split("/").length - 1;
  return depth ? "../".repeat(depth) : "";
}

function leerPartial(nombre) {
  return fs.readFileSync(path.join(root, "partials", nombre + ".html"), "utf8").trim();
}

function aplicar(plantilla, prefijo, seccion) {
  let html = plantilla.replaceAll("__/", prefijo);
  html = html.replace(/<a\b([^>]*)>/g, (tag, attrs) => {
    attrs = attrs.replace(/\s*aria-current="page"/g, "");
    const m = attrs.match(/data-seccion="([^"]+)"/);
    if (seccion && m && m[1] === seccion) {
      return "<a" + attrs + ' aria-current="page">';
    }
    return "<a" + attrs + ">";
  });
  return html;
}

function envolver(html, rel) {
  if (!html.includes("<!-- partial:nav -->") && /<header class="site-header">/.test(html)) {
    html = html.replace(
      /<header class="site-header">[\s\S]*?<\/header>/,
      "<!-- partial:nav -->\n  NAV\n  <!-- /partial:nav -->"
    );
  }
  if (!html.includes("<!-- partial:footer -->") && /<footer class="site-footer">/.test(html)) {
    html = html.replace(
      /<footer class="site-footer">[\s\S]*?<\/footer>/,
      "<!-- partial:footer -->\n  FOOTER\n  <!-- /partial:footer -->"
    );
  }
  if (!html.includes("<!-- partial:fonts -->") && /<link rel="stylesheet" href="[^"]*css\/main\.css[^"]*">/.test(html)) {
    html = html.replace(
      /(<link rel="stylesheet" href="[^"]*css\/main\.css[^"]*">)/,
      "$1\n  <!-- partial:fonts -->\n  FONTS\n  <!-- /partial:fonts -->"
    );
  }
  return html;
}

function rellenar(html, rel) {
  const prefijo = prefijoDe(rel);
  const seccion = seccionDe(rel);
  for (const nombre of REGIONES) {
    const abierto = "<!-- partial:" + nombre + " -->";
    const cerrado = "<!-- /partial:" + nombre + " -->";
    const i = html.indexOf(abierto);
    const j = html.indexOf(cerrado);
    if (i === -1 || j === -1 || j < i) {
      throw new Error(rel + ": falta la región " + nombre);
    }
    const cuerpo = aplicar(leerPartial(nombre), prefijo, seccion);
    html = html.slice(0, i) + abierto + "\n  " + cuerpo + "\n  " + html.slice(j);
  }
  return html;
}

function listarHtml(dir, base = "") {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".") || ent.name === "tmp" || ent.name === "partials") continue;
    const rel = base ? base + "/" + ent.name : ent.name;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listarHtml(full, rel));
    else if (ent.name.endsWith(".html") && !SKIP.has(rel)) out.push(rel);
  }
  return out.sort();
}

const plantillas = Object.fromEntries(REGIONES.map((n) => [n, leerPartial(n)]));
const paginas = listarHtml(root);
let fallos = 0;

for (const rel of paginas) {
  const full = path.join(root, rel);
  let actual = fs.readFileSync(full, "utf8");
  if (!actual.includes("<header class=\"site-header\">") && !actual.includes("<!-- partial:nav -->")) {
    continue;
  }
  const preparado = envolver(actual, rel);
  let siguiente;
  try {
    siguiente = rellenar(preparado, rel);
  } catch (err) {
    if (check) {
      console.error(err.message);
      fallos += 1;
      continue;
    }
    throw err;
  }
  if (siguiente === actual) continue;
  if (check) {
    console.error("desfasado: " + rel);
    fallos += 1;
    continue;
  }
  fs.writeFileSync(full, siguiente);
  console.log("actualizado " + rel);
}

if (check) {
  if (fallos) {
    console.error(fallos + " página(s) fuera de sync");
    process.exit(1);
  }
  console.log(paginas.length + " páginas alineadas");
}
