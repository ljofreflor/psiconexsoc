(function () {
  var cfg = window.PSICONEXSOC;
  if (!cfg) return;

  function plausible() {
    return typeof window.plausible === "function" ? window.plausible : function () {};
  }

  cfg.medir = function (nombre, props) {
    plausible()(nombre, props ? { props: props } : undefined);
  };

  if (cfg.plausibleDomain) {
    var script = document.createElement("script");
    script.defer = true;
    script.setAttribute("data-domain", cfg.plausibleDomain);
    script.src = "https://plausible.io/js/script.tagged-events.js";
    document.head.appendChild(script);
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a, button");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (link.hasAttribute("data-track")) {
      cfg.medir(link.getAttribute("data-track"), {
        desde: cfg.param("desde") || link.getAttribute("data-desde") || ""
      });
      return;
    }
    if (href.indexOf("agenda.html") !== -1) {
      cfg.medir("Agenda", { desde: cfg.param("desde") || "" });
    } else if (href.indexOf("tel:") === 0) {
      cfg.medir("Telefono");
    } else if (href.indexOf("cuenta.html") !== -1) {
      cfg.medir("Entrar");
    }
  });
})();
