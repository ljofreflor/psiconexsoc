(function () {
  var cajas = document.querySelectorAll("[data-archivo]");
  if (!cajas.length) return;

  var cfg = window.PSICONEXSOC;
  var prefijo = (cfg && cfg.prefijo) || "";

  function escapar(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fechaCorta(iso) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  }

  function ficha(p) {
    var href = prefijo + p.href;
    var meta = [
      escapar(p.autor),
      escapar(fechaCorta(p.fecha)),
      escapar(String(p.minutos)) + " min"
    ];
    if (p.estado === "borrador") meta.push("Borrador");
    return (
      '<article class="card">' +
        '<p class="section-kicker">' + escapar(p.nivel) + "</p>" +
        "<h3><a href=\"" + escapar(href) + "\">" + escapar(p.titulo) + "</a></h3>" +
        "<p>" + escapar(p.bajada) + "</p>" +
        '<p class="object-meta">' +
          meta.map(function (m) {
            return "<span>" + m + "</span>";
          }).join("") +
        "</p>" +
      "</article>"
    );
  }

  fetch(prefijo + "data/publicaciones.json")
    .then(function (respuesta) {
      if (!respuesta.ok) throw new Error("sin catálogo");
      return respuesta.json();
    })
    .then(function (lista) {
      if (!Array.isArray(lista)) return;
      lista = lista.slice().sort(function (a, b) {
        if (a.fecha === b.fecha) return 0;
        return a.fecha < b.fecha ? 1 : -1;
      });
      Array.prototype.forEach.call(cajas, function (caja) {
        var piezas = lista;
        if (caja.getAttribute("data-archivo") === "recientes") piezas = lista.slice(0, 6);
        caja.innerHTML = piezas.map(ficha).join("");
      });
    })
    .catch(function () {});
})();
