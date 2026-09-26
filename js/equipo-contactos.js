/**
 * Rellena teléfonos bajo cada profesional (js/site.js → profesionales).
 */
(function () {
  var cfg = window.PSICONEXSOC || {};
  var byId = {};
  (cfg.profesionales || []).forEach(function (p) {
    byId[p.id] = p;
  });

  function fill(id, el) {
    var p = byId[id];
    if (!p || !el) return;
    var parts = [];
    if (p.telefono && p.telefonoTexto) {
      parts.push(
        'Teléfono: <a href="tel:' + p.telefono + '">' + p.telefonoTexto + "</a>"
      );
    }
    if (p.secretarioTelefono && p.secretarioTelefonoTexto) {
      parts.push(
        (p.secretarioNombre || "Asistente / secretario") +
          ': <a href="tel:' +
          p.secretarioTelefono +
          '">' +
          p.secretarioTelefonoTexto +
          "</a>"
      );
    }
    if (parts.length) {
      el.className = "note";
      el.innerHTML = parts.join("<br>");
    }
  }

  fill("valderrama", document.querySelector("[data-tel-valderrama]"));
  fill("molina", document.querySelector("[data-tel-molina]"));
  fill("artigas", document.querySelector("[data-tel-artigas]"));
})();
