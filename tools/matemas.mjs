// Hornea los matemas del grafo como SVG de MathJax (Computer Modern).
// No viaja al navegador: se ejecuta en autoría y el HTML queda estático.
//
//   mkdir -p tmp/mathjax && cd tmp/mathjax && npm init -y && npm install mathjax-full@3
//   node tools/matemas.mjs
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(path.join(root, 'tmp/mathjax/package.json'));
const { mathjax } = req('mathjax-full/js/mathjax.js');
const { TeX } = req('mathjax-full/js/input/tex.js');
const { SVG } = req('mathjax-full/js/output/svg.js');
const { liteAdaptor } = req('mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = req('mathjax-full/js/handlers/html.js');
const { AllPackages } = req('mathjax-full/js/input/tex/AllPackages.js');

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const html = mathjax.document('', {
  InputJax: new TeX({ packages: AllPackages }),
  OutputJax: new SVG({ fontCache: 'none' })
});

const EM = 0.036;

function svgDe(tex) {
  const raw = adaptor.outerHTML(html.convert(tex, { display: false }));
  const m = raw.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/);
  if (!m) throw new Error('sin svg: ' + tex);
  const vb = /viewBox="([^"]+)"/.exec(m[1])[1];
  return { viewBox: vb, inner: m[2].trim() };
}

function colocar(tex, { x, y, anchor = 'start', scale = EM, inn, rotate, slash, barra }) {
  const { viewBox, inner: crudo } = svgDe(tex);
  const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);
  let inner = crudo;
  // S(Ⱥ): aspa solo sobre la A. La A romana, ya volteada, tiene las astas
  // en un triángulo (arriba x≈1350, abajo x≈1680), no en el bbox del matema:
  // (1100,-680)→(1700,40) nacía entre el paréntesis y la A y se salía por
  // debajo de la línea de base.
  if (slash) {
    inner += `<line x1="1355" y1="-600" x2="1680" y2="-40" stroke-width="58" />`;
  }
  // El sujeto barrado no es el dólar: es S con un trazo vertical, como en los Écrits.
  // La S itálica de CM no tiene el eje en el centro del viewBox: arriba el trazo
  // empieza a x≈384, abajo acaba a x≈427. 400 corta las dos panzas.
  if (barra) {
    inner += `<line x1="400" y1="-690" x2="400" y2="15" stroke-width="58" />`;
  }
  const w = vw * scale;
  const h = vh * scale;
  const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
  const y0 = y + vy * scale;
  const rot = rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : '';
  return (
    `<svg class="grafo-letra" style="--in:${inn}" x="${x0.toFixed(1)}" y="${y0.toFixed(1)}"` +
    ` width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="${viewBox}"` +
    ` aria-hidden="true"${rot}>${inner}</svg>`
  );
}

const matemas = [
  ['\\Delta', { x: 628, y: 648, inn: '.44', rotate: 8 }],
  ['S', { x: 368, y: 655, anchor: 'end', inn: '.92', barra: true }],
  ['S', { x: 58, y: 430, anchor: 'end', inn: '.06' }],
  ["S'", { x: 948, y: 430, inn: '.40' }],
  ['\\mathrm{A}', { x: 690, y: 312, inn: '.12' }],
  ['s(\\mathrm{A})', { x: 318, y: 312, anchor: 'end', inn: '.28' }],
  ['i(a)', { x: 708, y: 532, inn: '.42' }],
  ['m', { x: 285, y: 528, anchor: 'end', inn: '.88' }],
  ['d', { x: 318, y: 410, anchor: 'end', inn: '.84' }],
  ['I(\\mathrm{A})', { x: 120, y: 655, anchor: 'end', inn: '.90' }],
  ['S(\\mathrm{A})', { x: 318, y: 128, anchor: 'end', inn: '.14', slash: true }],
  ['S\\Diamond\\mathrm{D}', { x: 694, y: 130, inn: '.28', barra: true }],
  ['S\\Diamond a', { x: 742, y: 238, inn: '.56', barra: true }]
];

for (const [tex, pos] of matemas) {
  console.log(`<!-- ${tex} -->`);
  console.log(colocar(tex, pos));
}
