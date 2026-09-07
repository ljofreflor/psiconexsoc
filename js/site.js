(function () {
  // Equipo, para encender cuentas y cobro:
  // 1. Inscribir el dominio y una casilla que reciba.
  // 2. Crear proyecto Supabase y pegar supabase/schema.sql.
  // 3. Auth: Google, Facebook (Meta) y Azure (Microsoft). Apple: appleAuth = true cuando exista Developer.
  //    googleClientId: ID web de Google Identity (botón oficial). Vacío = botón de marca + OAuth.
  //    appleClientId: Services ID de Sign in with Apple. Vacío = botón de marca + OAuth.
  //    Facebook: Login with Facebook en Supabase. No se carga el SDK ni el píxel.
  // 4. Rellenar supabaseUrl y supabaseAnonKey (la anon es pública).
  // 5. UPDATE perfiles SET es_equipo = true WHERE correo = '...';
  // 6. Honorario en equipo-interno.html (no enlazado en el menú público).
  // 7. plausibleDomain para el contador.
  // 8. Linktree: agenda.html o el sitio; no el dominio caído ni el calendar.app abierto.
  // 9. Lookalike Meta desde el Instagram público, aterrizaje agenda.html?desde=meta&codigo=
  // 10. Secrets de Mercado Pago en crear-pago y webhook-pago; nunca en este archivo.
  window.PSICONEXSOC = {
    origin: "https://ljofreflor.github.io",
    base: "/psiconexsoc/",
    futureOrigin: "https://psiconexsoc.com",
    telefono: "+56981216395",
    telefonoTexto: "+56 9 8121 6395",
    honorarioClp: null,
    plausibleDomain: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    appleAuth: false,
    googleClientId: "",
    appleClientId: "",
    profesionales: [
      "José Joaquín Valderrama",
      "Vicente Molina Toro",
      "Agustín Artigas Osorio"
    ]
  };

  var cfg = window.PSICONEXSOC;

  cfg.enSubcarpeta = /\/(areas|biblioteca|formacion)\//.test(location.pathname);
  cfg.prefijo = cfg.enSubcarpeta ? "../" : "";

  cfg.pagina = function (archivo, params) {
    var query = "";
    if (params) {
      var parts = [];
      Object.keys(params).forEach(function (key) {
        if (params[key] == null || params[key] === "") return;
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
      });
      if (parts.length) query = "?" + parts.join("&");
    }
    return cfg.prefijo + archivo + query;
  };

  cfg.agendaHref = function (desde) {
    return cfg.pagina("agenda.html", { desde: desde || "" });
  };

  cfg.cuentaHref = function (extra) {
    var params = extra ? Object.assign({}, extra) : {};
    var search = new URLSearchParams(location.search);
    if (search.get("codigo") && !params.codigo) params.codigo = search.get("codigo");
    if (search.get("desde") && !params.desde) params.desde = search.get("desde");
    return cfg.pagina("cuenta.html", params);
  };

  cfg.panelHref = function () {
    return cfg.pagina("panel.html");
  };

  cfg.clp = function (n) {
    if (n == null || n === "") return "—";
    var abs = Math.abs(Number(n));
    var formatted = "$" + abs.toLocaleString("es-CL");
    return Number(n) < 0 ? "−" + formatted : formatted;
  };

  cfg.mesNombre = function (date) {
    return date.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  };

  cfg.fechaLarga = function (iso) {
    var d = iso instanceof Date ? iso : new Date(iso);
    return d.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  cfg.param = function (name) {
    return new URLSearchParams(location.search).get(name) || "";
  };

  if (cfg.param("captura") === "1") {
    document.documentElement.classList.add("captura-cita");
    document.body.classList.add("captura-cita");
  }
})();
