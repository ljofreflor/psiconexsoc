// Convierte los contornos tonales de tools/rotoscopio.sh en un retrato de tiza.
//
//   node tools/tiza.mjs tmp/contornos/n-*.svg > assets/lacan/retrato.svg
//
// Rough.js SOLO en tiempo de autoria: se ejecuta aqui, en Node, y lo que viaja al
// navegador es el SVG horneado. La pagina no carga ninguna libreria.
// Instalarlo fuera del repositorio, que no tiene package.json:
//
//   mkdir -p tmp/rough && cd tmp/rough && npm install roughjs
//
// Salida: un <g data-nivel="N"> por nivel de presion de tiza.
//   nivel 1  data-tipo="contorno"  el trazo de potrace tal cual, con pathLength="1"
//   nivel N  data-tipo="trama"     rayas sueltas, cada una con su turno en --in
//
// La division no es caprichosa. Pasar un contorno largo por Rough.js lo estalla en
// cientos de sub-trazos jitterados, y entonces stroke-dashoffset ya no lo escribe
// progresivo: aparece de golpe. En la trama ese estallido es justo lo que se quiere,
// porque cada raya ES un trazo de tiza y se escriben una tras otra.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// El repositorio no tiene package.json a proposito. Rough.js se instala aparte, en
// tmp/ (ignorado por git), y se busca ahi o donde diga ROUGH_EN.
function cargarRough() {
  const donde = [process.env.ROUGH_EN, 'tmp/rough', '.'].filter(Boolean);
  for (const base of donde) {
    try {
      const req = createRequire(path.resolve(base, 'package.json'));
      return req('roughjs');
    } catch { /* se prueba el siguiente */ }
  }
  throw new Error(
    'falta Rough.js. Instalalo fuera del repositorio:\n' +
    '  mkdir -p tmp/rough && cd tmp/rough && npm init -y && npm install roughjs'
  );
}

const g = cargarRough().generator();
const un = n => (Math.round(n * 10) / 10).toString();

// potrace emite <g transform="translate(0,H) scale(s,-s)"> y usa M, m, l, c y z.
// Se hornea la transformada en las coordenadas: asi la trama se calcula en el
// espacio final (el angulo de rayado es el que se ve) y las cifras son cortas.
const PARES = { m: 1, l: 1, t: 1, c: 3, s: 2, q: 2 };
function hornear(d, sx, sy, ty) {
  const t = d.match(/[A-Za-z]|-?\d*\.?\d+(?:[eE][+-]?\d+)?/g) || [];
  const fuera = [];
  let cmd = '';
  for (let i = 0; i < t.length;) {
    if (/[A-Za-z]/.test(t[i])) {
      cmd = t[i++];
      fuera.push(cmd);
      if (cmd === 'z' || cmd === 'Z') continue;
    }
    const pares = PARES[cmd.toLowerCase()];
    if (!pares) throw new Error(`comando de trazado no contemplado: ${cmd}`);
    const abs = cmd === cmd.toUpperCase();
    for (let k = 0; k < pares; k++) {
      const x = parseFloat(t[i++]), y = parseFloat(t[i++]);
      fuera.push(un(x * sx), un(abs ? ty + y * sy : y * sy));
    }
  }
  return fuera.join(' ').replace(/ ?([A-Za-z]) ?/g, '$1');
}

// Rough.js entrega cada raya como curva de cuatro puntos. Guardarla como recta
// cuesta la mitad de bytes y no se pierde nada: el temblor que se ve esta en los
// extremos, que Rough ya desplaza, y el polvo lo pone el filtro de tiza del CSS.
function recta(d) {
  const n = d.match(/-?\d+(?:\.\d+)?/g);
  return n && n.length >= 8 ? `M${n[0]} ${n[1]}L${n[6]} ${n[7]}` : d;
}

const enteros = d => d.replace(/-?\d*\.\d+/g, m => Math.round(parseFloat(m)).toString());
const partir = d => d.split(/(?=M)/).map(s => s.trim()).filter(Boolean);

// Cada nivel es una presion de tiza distinta, no una luminancia distinta:
// contorno, trama abierta, trama cerrada y el brillo repasado en cruz.
export const PRESIONES = [
  { contorno: true },
  { estilo: 'hachure',     paso: 20, angulo: -41, aspereza: 1.3, pandeo: 1.0 },
  { estilo: 'hachure',     paso: 15, angulo: -41, aspereza: 1.1, pandeo: 0.8 },
  { estilo: 'cross-hatch', paso: 17, angulo: 38,  aspereza: 1.0, pandeo: 0.6 },
  { estilo: 'hachure',     paso: 13, angulo: 12,  aspereza: 0.9, pandeo: 0.5 }
];

export function retratoDeTiza(archivos, opciones = {}) {
  const { semilla = 7, pasos = 24 } = opciones;
  const salida = [];
  let vb = null;

  archivos.forEach((archivo, idx) => {
    const a = PRESIONES[Math.min(idx, PRESIONES.length - 1)];
    const svg = fs.readFileSync(archivo, 'utf8');
    vb = vb || svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    const m = svg.match(/<g transform="translate\(([\d.eE+-]+),([\d.eE+-]+)\) scale\(([\d.eE+-]+),([\d.eE+-]+)\)"/);
    if (!m) throw new Error(`${archivo}: no parece una salida de potrace -s`);
    const ty = parseFloat(m[2]), sx = parseFloat(m[3]), sy = parseFloat(m[4]);
    const ds = [...svg.matchAll(/ d="([^"]+)"/g)]
      .map(x => hornear(x[1].replace(/\s+/g, ' ').trim(), sx, sy, ty));

    if (a.contorno) {
      salida.push({ nivel: idx + 1, tipo: 'contorno', trazos: ds });
      return;
    }
    const rayas = [];
    for (const d of ds) {
      const s = g.path(d, { fill: '#fff', stroke: 'none', fillWeight: 1, seed: semilla,
                            roughness: a.aspereza, bowing: a.pandeo,
                            fillStyle: a.estilo, hachureGap: a.paso, hachureAngle: a.angulo });
      for (const p of g.toPaths(s)) rayas.push(...partir(enteros(p.d)).map(recta));
    }
    salida.push({ nivel: idx + 1, tipo: 'trama', trazos: rayas });
  });

  const [, , w, h] = vb;
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w)} ${Math.round(h)}">`];
  for (const { nivel, tipo, trazos } of salida) {
    out.push(`<g data-nivel="${nivel}" data-tipo="${tipo}">`);
    trazos.forEach((d, i) => {
      if (tipo === 'contorno') {
        // pathLength normaliza el contorno a 1: se escribe parejo, como los matemas.
        out.push(`<path pathLength="1" d="${d}"/>`);
        return;
      }
      // --in es el turno de cada raya dentro del nivel: la trama barre en vez de
      // aparecer entera. Se cuantiza en pocos escalones porque los valores
      // repetidos comprimen mucho mejor.
      const turno = Math.round((i / Math.max(1, trazos.length - 1)) * pasos) / pasos;
      out.push(`<path style="--in:${turno.toFixed(2)}" d="${d}"/>`);
    });
    out.push('</g>');
  }
  out.push('</svg>');
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const archivos = process.argv.slice(2);
  if (!archivos.length) {
    console.error('uso: node tools/tiza.mjs <contorno-1.svg> [contorno-2.svg ...] > retrato.svg');
    process.exit(1);
  }
  process.stdout.write(retratoDeTiza(archivos) + '\n');
}
