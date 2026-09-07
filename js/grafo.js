(function () {
  var lienzo = document.querySelector("[data-grafo]");
  if (!lienzo) return;

  var retrato = lienzo.querySelector("[data-grafo-retrato]");
  var audio = lienzo.querySelector("[data-grafo-audio]");
  var boton = lienzo.querySelector("[data-grafo-oido]");
  var TRAZADO = "assets/lacan/retrato.svg";
  var VOZ = "assets/audio/lacan-aura.m4a";
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Los tres estratos no se solapan: uno empieza donde el anterior terminó.
  var ESTRATOS = [[0, 0.34], [0.34, 0.66], [0.66, 1]];

  // Los cuatro momentos de falta, con la posición del matema que los convoca.
  // Lacan vuelve en cada uno y deriva hacia esa letra; entre ellos se retira al
  // fondo, pero nunca del todo, porque sigue escuchando.
  var FALTAS = [
    { en: 0.30, dx: -0.34, dy: 0.38 },  // $, la barra del sujeto
    { en: 0.52, dx: -0.34, dy: 0.08 },  // s(A), el mensaje que vuelve alienado
    { en: 0.80, dx: -0.32, dy: -0.28 }, // S(A tachado), el significante de la falta en el Otro
    { en: 0.93, dx: 0.30, dy: -0.08 }   // $ punzón a, el fantasma que vela la falta
  ];
  var ANCHO = 0.08;
  var RESTO = 0.07;

  // Los cuatro niveles de presión de tiza del retrato. Empiezan cuando el grafo
  // ya está en marcha y el último cierra junto con el recorrido: el remate es que
  // aparece dibujada la mano que dibujaba.
  var NIVELES = [[0.28, 0.52], [0.46, 0.70], [0.62, 0.86], [0.78, 1]];

  // Lo escrito no se borra al subir: ni el grafo ni el retrato ni el color. Lo
  // único reversible es la presencia, que respira.
  var trazo = [0, 0, 0];
  var tiza = [0, 0, 0, 0];
  var revelado = 0;
  var pedido = false;

  function acotar(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function poner(nombre, valor) {
    lienzo.style.setProperty(nombre, valor);
  }

  function pintar() {
    pedido = false;
    var recorrido = lienzo.offsetHeight - window.innerHeight;
    if (recorrido <= 0) return;
    var crudo = acotar(-lienzo.getBoundingClientRect().top / recorrido);

    if (crudo > revelado) revelado = crudo;
    // El mismo recorrido gobierna el dibujo, la presencia y el color de la tiza.
    poner("--revelado", revelado.toFixed(4));

    for (var i = 0; i < ESTRATOS.length; i++) {
      var rango = ESTRATOS[i];
      var p = acotar((crudo - rango[0]) / (rango[1] - rango[0]));
      if (p > trazo[i]) trazo[i] = p;
      poner("--p" + (i + 1), trazo[i].toFixed(4));
    }

    for (var n = 0; n < NIVELES.length; n++) {
      var franja = NIVELES[n];
      var q = acotar((crudo - franja[0]) / (franja[1] - franja[0]));
      if (q > tiza[n]) tiza[n] = q;
      poner("--n" + (n + 1), tiza[n].toFixed(4));
    }

    var presencia = 0;
    var suma = 0;
    var ax = 0;
    var ay = 0;
    for (var j = 0; j < FALTAS.length; j++) {
      var falta = FALTAS[j];
      var d = (crudo - falta.en) / ANCHO;
      var peso = Math.exp(-d * d);
      if (peso > presencia) presencia = peso;
      suma += peso;
      ax += falta.dx * peso;
      ay += falta.dy * peso;
    }
    if (suma > 0.0001) {
      ax /= suma;
      ay /= suma;
    }

    // Travesía lenta bajo las apariciones: nunca está dos veces en el mismo sitio.
    var deriva = crudo - 0.5;
    // La presencia sí es reversible: asoma en cada falta y se retira. Lo que no
    // hace nunca es llegar a cero, porque escucha. Y como el dibujo es monótono,
    // retirarse ya no lo borra: sigue estando escrito debajo.
    poner("--aura-o", (RESTO + revelado * 0.26 + presencia * 0.26).toFixed(3));
    // La deriva es corta a propósito: el retrato no debe salirse del lienzo ni
    // taparle los matemas al piso de arriba.
    poner("--aura-x", (ax * 20 + deriva * 6).toFixed(2) + "%");
    poner("--aura-y", (ay * 18 - deriva * 4).toFixed(2) + "%");
    poner("--aura-s", (1 + presencia * 0.14).toFixed(3));
  }

  function pedir() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(pintar);
  }

  function figuraEntera() {
    poner("--p1", "1");
    poner("--p2", "1");
    poner("--p3", "1");
    poner("--revelado", "1");
    poner("--n1", "1");
    poner("--n2", "1");
    poner("--n3", "1");
    poner("--n4", "1");
    poner("--aura-o", "0.42");
    poner("--aura-x", "0%");
    poner("--aura-y", "0%");
    poner("--aura-s", "1");
  }

  function seguirElScroll() {
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir, { passive: true });
    pintar();
  }

  function soltarElScroll() {
    window.removeEventListener("scroll", pedir);
    window.removeEventListener("resize", pedir);
  }

  function ajustar() {
    if (quieto.matches) {
      soltarElScroll();
      figuraEntera();
    } else {
      seguirElScroll();
    }
  }

  if (quieto.addEventListener) {
    quieto.addEventListener("change", ajustar);
  } else if (quieto.addListener) {
    quieto.addListener(ajustar);
  }
  ajustar();

  // El trazado de Lacan entra como trazo, no como imagen. Si no hay archivo de
  // origen legítimo, no se finge: el lienzo se queda con el grafo solo.
  if (retrato) {
    fetch(TRAZADO)
      .then(function (respuesta) {
        if (!respuesta.ok) throw new Error("sin trazado");
        return respuesta.text();
      })
      .then(function (texto) {
        var ajeno = new DOMParser().parseFromString(texto, "image/svg+xml");
        var raiz = ajeno.querySelector("svg");
        if (!raiz || ajeno.querySelector("parsererror")) throw new Error("trazado ilegible");
        retrato.setAttribute("viewBox", raiz.getAttribute("viewBox") || "0 0 480 600");
        Array.prototype.forEach.call(raiz.children, function (nodo) {
          retrato.appendChild(document.importNode(nodo, true));
        });
        // Solo el contorno se normaliza a 1, para escribirse parejo como un
        // matema. Las rayas de la trama no llevan pathLength a propósito: son
        // cortas, se escriben dentro de su turno y normalizarlas cuesta bytes.
        retrato.querySelectorAll('[data-tipo="contorno"] path').forEach(function (p) {
          if (!p.hasAttribute("pathLength")) p.setAttribute("pathLength", "1");
        });
      })
      .catch(function () {
        retrato.remove();
      });
  }

  if (!audio || !boton) return;

  function sinVoz() {
    var caja = boton.closest(".grafo-oido");
    if (caja) caja.hidden = true;
  }

  // El oído vive aparte del dibujo. Que el trazo se desdibuje no interrumpe la
  // escucha: son dos elementos distintos y la opacidad no detiene el audio.
  fetch(VOZ, { method: "HEAD" })
    .then(function (respuesta) {
      if (!respuesta.ok) {
        sinVoz();
        return;
      }
      audio.src = VOZ;
      boton.addEventListener("click", function () {
        if (audio.paused) {
          audio.play().catch(function () {});
          boton.setAttribute("aria-pressed", "true");
          boton.textContent = "Apagar el o\u00eddo";
        } else {
          audio.pause();
          boton.setAttribute("aria-pressed", "false");
          boton.textContent = "Encender el o\u00eddo";
        }
      });
    })
    .catch(sinVoz);
})();
