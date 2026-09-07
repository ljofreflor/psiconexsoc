(function () {
  var cfg = window.PSICONEXSOC;
  if (!cfg) return;

  var supabase = null;
  var session = null;
  var perfil = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function ready() {
    return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  }

  function fail(node, message) {
    if (!node) return;
    node.hidden = false;
    node.textContent = message;
  }

  function mesActual() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }

  async function client() {
    if (!ready()) return null;
    if (!supabase) {
      supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, detectSessionInUrl: true }
      });
    }
    return supabase;
  }

  async function loadSession() {
    var db = await client();
    if (!db) return null;
    var result = await db.auth.getSession();
    session = result.data && result.data.session;
    if (!session) {
      perfil = null;
      return null;
    }
    var row = await db.from("perfiles").select("*").eq("id", session.user.id).maybeSingle();
    perfil = row.data;
    return session;
  }

  async function rpc(db, name, args) {
    var result = await db.rpc(name, args);
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }

  async function honorario() {
    if (cfg.honorarioClp) return cfg.honorarioClp;
    var db = await client();
    if (!db) return null;
    var row = await db.from("configuracion").select("valor").eq("clave", "honorario_clp").maybeSingle();
    var n = row.data && row.data.valor ? Number(row.data.valor) : null;
    return n || null;
  }

  async function saldoDe(id) {
    var db = await client();
    var rows = await db.from("movimientos").select("monto").eq("perfil_id", id);
    if (rows.error) return 0;
    return (rows.data || []).reduce(function (sum, row) {
      return sum + Number(row.monto);
    }, 0);
  }

  cfg.cuenta = {
    ready: ready,
    loadSession: loadSession,
    honorario: honorario
  };

  function redirectIfLoggedIn() {
    if (session && /cuenta\.html$/.test(location.pathname)) {
      location.replace(cfg.panelHref());
    }
  }

  function requireSession() {
    if (!session && /panel\.html$/.test(location.pathname)) {
      location.replace(cfg.cuentaHref({ desde: cfg.param("desde") }));
      return false;
    }
    return true;
  }

  async function renderLogin() {
    var box = $("[data-cuenta-login]");
    if (!box) return;
    var status = $("[data-cuenta-status]");
    var codigoInput = $("[name=codigo]");
    if (codigoInput && cfg.param("codigo")) codigoInput.value = cfg.param("codigo");

    if (!cfg.appleAuth) {
      var apple = box.querySelector('[data-oauth="apple"]');
      if (apple) apple.hidden = true;
    }

    function guardarCodigo() {
      var codigoPendiente = (codigoInput && codigoInput.value) || "";
      if (codigoPendiente) sessionStorage.setItem("psn-codigo", codigoPendiente);
    }

    function loadScript(src) {
      return new Promise(function (resolve, reject) {
        if (document.querySelector('script[src="' + src + '"]')) {
          resolve();
          return;
        }
        var el = document.createElement("script");
        el.src = src;
        el.async = true;
        el.onload = resolve;
        el.onerror = reject;
        document.head.appendChild(el);
      });
    }

    async function entrarOAuth(provider) {
      if (provider === "apple" && !cfg.appleAuth) {
        fail(status, "Apple se publica cuando exista la cuenta de desarrollador.");
        return;
      }
      cfg.medir("Login", { proveedor: provider });
      guardarCodigo();
      var db = await client();
      var redirect = new URL(cfg.pagina("panel.html"), location.href).href;
      var error = await db.auth.signInWithOAuth({
        provider: provider,
        options: { redirectTo: redirect }
      });
      if (error.error) fail(status, "No se pudo entrar con " + provider + ".");
    }

    async function montarGoogle() {
      if (!cfg.googleClientId || !window.google || !google.accounts) return;
      var host = box.querySelector("[data-google-plugin]");
      var fallback = box.querySelector('[data-oauth="google"]');
      if (!host) return;
      google.accounts.id.initialize({
        client_id: cfg.googleClientId,
        ux_mode: "popup",
        callback: async function (response) {
          cfg.medir("Login", { proveedor: "google" });
          guardarCodigo();
          var db = await client();
          var result = await db.auth.signInWithIdToken({
            provider: "google",
            token: response.credential
          });
          if (result.error) {
            await entrarOAuth("google");
            return;
          }
          location.replace(cfg.panelHref());
        }
      });
      fallback.hidden = true;
      host.hidden = false;
      google.accounts.id.renderButton(host, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        locale: "es-419",
        width: Math.min(Math.floor(host.getBoundingClientRect().width || box.clientWidth || 320), 400)
      });
    }

    async function montarApple() {
      if (!cfg.appleAuth || !cfg.appleClientId || !window.AppleID) return;
      var host = box.querySelector("[data-apple-plugin]");
      var fallback = box.querySelector('[data-oauth="apple"]');
      if (!host) return;
      AppleID.auth.init({
        clientId: cfg.appleClientId,
        scope: "name email",
        redirectURI: new URL(cfg.pagina("panel.html"), location.href).href,
        usePopup: true
      });
      fallback.hidden = true;
      host.hidden = false;
      host.innerHTML = '<div id="appleid-signin" data-color="black" data-border="false" data-type="sign in" data-width="100%" data-height="40" data-border-radius="4" data-mode="center-align"></div>';
      if (AppleID.auth.renderButton) AppleID.auth.renderButton();
      document.addEventListener("AppleIDSignInOnSuccess", async function (event) {
        var token = event.detail && event.detail.authorization && event.detail.authorization.id_token;
        if (!token) {
          await entrarOAuth("apple");
          return;
        }
        cfg.medir("Login", { proveedor: "apple" });
        guardarCodigo();
        var db = await client();
        var result = await db.auth.signInWithIdToken({
          provider: "apple",
          token: token
        });
        if (result.error) {
          await entrarOAuth("apple");
          return;
        }
        location.replace(cfg.panelHref());
      });
      document.addEventListener("AppleIDSignInOnFailure", function () {
        fail(status, "No se pudo entrar con Apple.");
      });
    }

    if (!ready()) {
      fail(status, "El acceso se habilita cuando el equipo configure las cuentas. Mientras tanto, el teléfono es el canal que responde: " + cfg.telefonoTexto + ".");
      box.querySelectorAll("button[data-oauth], [data-cuenta-alta] button, [data-cuenta-entrar] button").forEach(function (el) {
        el.disabled = true;
      });
      return;
    }

    var db = await client();

    if (cfg.googleClientId) {
      loadScript("https://accounts.google.com/gsi/client").then(montarGoogle).catch(function () {});
    }
    if (cfg.appleAuth && cfg.appleClientId) {
      loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid.auth/1.1/appleid.auth.js").then(montarApple).catch(function () {});
    }

    box.addEventListener("click", async function (event) {
      var btn = event.target.closest("[data-oauth]");
      if (!btn) return;
      await entrarOAuth(btn.getAttribute("data-oauth"));
    });

    var alta = $("[data-cuenta-alta]");
    if (alta) {
      alta.addEventListener("submit", async function (event) {
        event.preventDefault();
        var email = alta.correo.value;
        var password = alta.clave.value;
        var nombre = alta.nombre.value;
        fail(status, "Creando la cuenta…");
        var result = await db.auth.signUp({
          email: email,
          password: password,
          options: { data: { full_name: nombre } }
        });
        if (result.error) {
          fail(status, result.error.message);
          return;
        }
        var code = (codigoInput && codigoInput.value) || "";
        if (result.data.session && code) {
          try { await rpc(db, "canjear_codigo", { p_codigo: code }); } catch (err) { /* se ve en el panel */ }
        }
        fail(status, result.data.session ? "Cuenta creada." : "Revisa el correo para confirmar el acceso.");
        if (result.data.session) location.replace(cfg.panelHref());
      });
    }

    var entrar = $("[data-cuenta-entrar]");
    if (entrar) {
      entrar.addEventListener("submit", async function (event) {
        event.preventDefault();
        var result = await db.auth.signInWithPassword({
          email: entrar.correo.value,
          password: entrar.clave.value
        });
        if (result.error) {
          fail(status, result.error.message);
          return;
        }
        var code = (codigoInput && codigoInput.value) || "";
        if (code) {
          try {
            await rpc(db, "canjear_codigo", { p_codigo: code });
            cfg.medir("Canje", { tipo: "login" });
          } catch (err) {
            fail(status, err.message || "El código no se pudo canjear.");
          }
        }
        location.replace(cfg.panelHref());
      });
    }
  }

  async function renderPanel() {
    var root = $("[data-panel]");
    if (!root) return;
    if (!requireSession()) return;
    var db = await client();
    if (!db || !session) return;

    var pendingCode = sessionStorage.getItem("psn-codigo");
    if (pendingCode) {
      sessionStorage.removeItem("psn-codigo");
      try {
        await rpc(db, "canjear_codigo", { p_codigo: pendingCode });
        cfg.medir("Canje", { tipo: "oauth" });
      } catch (err) {
        fail($("[data-panel-status]"), err.message);
      }
    }

    var nombre = (perfil && perfil.nombre) || (session.user.email || "").split("@")[0];
    var nameNode = $("[data-panel-nombre]");
    if (nameNode) nameNode.textContent = nombre;

    var salir = $("[data-salir]");
    if (salir) {
      salir.addEventListener("click", async function () {
        await db.auth.signOut();
        location.href = cfg.pagina("cuenta.html");
      });
    }

    var saldo = await saldoDe(session.user.id);
    var hon = await honorario();
    $("[data-saldo]").textContent = cfg.clp(saldo);
    $("[data-saldo-estado]").textContent = saldo < 0 ? "Por regularizar" : "A tu favor";

    var reag = await db
      .from("reagendamientos")
      .select("id")
      .eq("perfil_id", session.user.id)
      .eq("mes", mesActual());
    var usados = (reag.data || []).length;
    $("[data-reagendos]").textContent = usados + " / 2";
    $("[data-reagendos-mes]").textContent = cfg.mesNombre(new Date());

    var reservas = await db
      .from("reservas")
      .select("*")
      .eq("perfil_id", session.user.id)
      .eq("estado", "tomada")
      .order("inicio", { ascending: true });
    var lista = reservas.data || [];
    var now = Date.now();
    var proximas = lista.filter(function (r) { return new Date(r.inicio).getTime() >= now; });
    var anteriores = lista.filter(function (r) { return new Date(r.inicio).getTime() < now; }).reverse();
    var proxima = proximas[0];

    var proxBox = $("[data-proxima]");
    var vacio = $("[data-proxima-vacio]");
    if (proxima) {
      vacio.hidden = true;
      proxBox.hidden = false;
      $("[data-proxima-fecha]").textContent = cfg.fechaLarga(proxima.inicio);
      $("[data-proxima-meta]").textContent = [
        proxima.profesional,
        proxima.modalidad,
        proxima.sobre_cupo ? "sobre cupo" : ""
      ].filter(Boolean).join(" · ");
      var reageBtn = $("[data-reagendar]");
      var reageNota = $("[data-reagendar-nota]");
      if (usados >= 2) {
        reageBtn.hidden = true;
        reageNota.hidden = false;
      } else {
        reageBtn.hidden = false;
        reageNota.hidden = true;
        reageBtn.onclick = function () {
          $("[data-bloques]").hidden = false;
          $("[data-bloques]").setAttribute("data-reagendar-de", proxima.id);
        };
      }
    } else {
      proxBox.hidden = true;
      vacio.hidden = false;
    }

    function filas(rows, dest) {
      dest.innerHTML = "";
      if (!rows.length) {
        dest.innerHTML = "<li class=\"note\">No hay horas en este tramo.</li>";
        return;
      }
      rows.forEach(function (r) {
        var li = document.createElement("li");
        li.innerHTML =
          "<strong>" + cfg.fechaLarga(r.inicio) + "</strong>" +
          "<span>" + r.profesional + (r.sobre_cupo ? " · sobre cupo" : "") + "</span>";
        dest.appendChild(li);
      });
    }
    filas(proximas, $("[data-serie-proximas]"));
    filas(anteriores, $("[data-serie-anteriores]"));

    var pagos = await db
      .from("pagos")
      .select("*")
      .eq("perfil_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(12);
    var pagoList = $("[data-pagos]");
    pagoList.innerHTML = "";
    (pagos.data || []).forEach(function (p) {
      var li = document.createElement("li");
      li.innerHTML =
        "<strong>" + cfg.clp(p.monto) + "</strong>" +
        "<span>" + (p.pasarela || "") + " · " + p.estado + "</span>";
      pagoList.appendChild(li);
    });
    if (!pagos.data || !pagos.data.length) {
      pagoList.innerHTML = "<li class=\"note\">Aún no hay pagos registrados.</li>";
    }

    var libro = $("[data-libro]");
    if (libro) {
      var movs = await db
        .from("movimientos")
        .select("*")
        .eq("perfil_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      libro.innerHTML = "";
      (movs.data || []).forEach(function (m) {
        var li = document.createElement("li");
        li.textContent = m.tipo + " · " + cfg.clp(m.monto);
        libro.appendChild(li);
      });
    }

    var honNode = $("[data-honorario]");
    if (honNode) {
      honNode.textContent = hon ? cfg.clp(hon) : "se informa al reservar, cuando el equipo lo fije";
    }

    var bloquesBox = $("[data-bloques-lista]");
    if (bloquesBox) {
      var bloques = await db
        .from("bloques")
        .select("*")
        .eq("tomado", false)
        .gt("inicio", new Date().toISOString())
        .order("inicio", { ascending: true })
        .limit(24);
      bloquesBox.innerHTML = "";
      (bloques.data || []).forEach(function (b) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-ghost";
        btn.textContent = cfg.fechaLarga(b.inicio) + " · " + b.profesional;
        btn.addEventListener("click", async function () {
          var reageDe = $("[data-bloques]").getAttribute("data-reagendar-de");
          try {
            if (reageDe) {
              await rpc(db, "reagendar_reserva", { p_reserva: reageDe, p_bloque: b.id });
              cfg.medir("Reagendo");
            } else {
              if (hon && saldo < hon) {
                fail($("[data-panel-status]"), "El saldo no cubre la hora. Paga o canjea un código.");
                return;
              }
              await rpc(db, "reservar_bloque", {
                p_bloque: b.id,
                p_modalidad: "Por definir",
                p_sobre_cupo: false
              });
              cfg.medir("Reserva");
            }
            location.reload();
          } catch (err) {
            fail($("[data-panel-status]"), (err && err.message) || "No se pudo tomar esa hora.");
          }
        });
        li.appendChild(btn);
        bloquesBox.appendChild(li);
      });
      if (!bloques.data || !bloques.data.length) {
        bloquesBox.innerHTML = "<li class=\"note\">No hay bloques publicados todavía.</li>";
      }
    }

    var pagar = $("[data-pagar]");
    if (pagar) {
      pagar.addEventListener("click", async function () {
        fail($("[data-panel-status]"), "Abriendo el pago…");
        try {
          var res = await fetch(cfg.supabaseUrl + "/functions/v1/crear-pago", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + session.access_token,
              "Content-Type": "application/json"
            }
          });
          var body = await res.json();
          if (body.init_point) {
            cfg.medir("Checkout");
            location.href = body.init_point;
            return;
          }
          fail($("[data-panel-status]"), body.error || "El pago en línea se habilita cuando exista la cuenta de cobro. El equipo puede registrar una transferencia.");
        } catch (err) {
          fail($("[data-panel-status]"), "El pago en línea no está disponible todavía.");
        }
      });
    }

    var canje = $("[data-canje]");
    if (canje) {
      canje.addEventListener("submit", async function (event) {
        event.preventDefault();
        try {
          var monto = await rpc(db, "canjear_codigo", { p_codigo: canje.codigo.value });
          cfg.medir("Canje", { tipo: "panel" });
          fail($("[data-panel-status]"), "Se acreditaron " + cfg.clp(monto) + ".");
          location.reload();
        } catch (err) {
          fail($("[data-panel-status]"), (err && err.message) || "Código no válido.");
        }
      });
    }
  }

  async function renderEquipo() {
    var root = $("[data-equipo-admin]");
    if (!root) return;
    var status = $("[data-equipo-status]");
    if (!ready()) {
      fail(status, "Configura supabaseUrl y supabaseAnonKey en js/site.js.");
      return;
    }
    var db = await client();
    await loadSession();
    if (!session) {
      location.replace(cfg.cuentaHref());
      return;
    }
    if (!perfil || !perfil.es_equipo) {
      fail(status, "Esta página es solo para el equipo.");
      root.querySelectorAll("form, button").forEach(function (el) { el.disabled = true; });
      return;
    }

    $("[data-salir]").addEventListener("click", async function () {
      await db.auth.signOut();
      location.href = cfg.pagina("cuenta.html");
    });

    var honForm = $("[data-honorario-form]");
    if (honForm) {
      var actual = await honorario();
      if (actual) honForm.honorario.value = actual;
      honForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var { error } = await db.from("configuracion").upsert({
          clave: "honorario_clp",
          valor: String(honForm.honorario.value)
        });
        fail(status, error ? error.message : "Honorario guardado.");
      });
    }

    $("[data-bloque-form]").addEventListener("submit", async function (event) {
      event.preventDefault();
      var form = event.target;
      var { error } = await db.from("bloques").insert({
        profesional: form.profesional.value,
        inicio: new Date(form.inicio.value).toISOString(),
        fin: new Date(form.fin.value).toISOString()
      });
      fail(status, error ? error.message : "Bloque publicado.");
      if (!error) form.reset();
    });

    $("[data-codigo-form]").addEventListener("submit", async function (event) {
      event.preventDefault();
      var form = event.target;
      var { error } = await db.rpc("emitir_codigo", {
        p_codigo: form.codigo.value,
        p_tipo: form.tipo.value,
        p_monto: Number(form.monto.value),
        p_usos: Number(form.usos.value || 1),
        p_vence: form.vence.value || null,
        p_correo: form.correo.value || "",
        p_campana: form.campana.value || ""
      });
      fail(status, error ? error.message : "Código emitido.");
      if (!error) form.reset();
    });

    $("[data-credito-form]").addEventListener("submit", async function (event) {
      event.preventDefault();
      var form = event.target;
      var buscado = await db.from("perfiles").select("id").eq("correo", form.correo.value).maybeSingle();
      if (!buscado.data) {
        fail(status, "No hay cuenta con ese correo.");
        return;
      }
      var { error } = await db.rpc("cargar_credito", {
        p_perfil: buscado.data.id,
        p_monto: Number(form.monto.value),
        p_nota: form.nota.value || ""
      });
      fail(status, error ? error.message : "Crédito cargado.");
    });

    $("[data-pago-form]").addEventListener("submit", async function (event) {
      event.preventDefault();
      var form = event.target;
      var buscado = await db.from("perfiles").select("id").eq("correo", form.correo.value).maybeSingle();
      if (!buscado.data) {
        fail(status, "No hay cuenta con ese correo.");
        return;
      }
      var { error } = await db.rpc("registrar_pago", {
        p_perfil: buscado.data.id,
        p_monto: Number(form.monto.value),
        p_pasarela: form.pasarela.value || "transferencia"
      });
      fail(status, error ? error.message : "Pago registrado y acreditado.");
    });
  }

  async function start() {
    try {
      await loadSession();
    } catch (err) {
      session = null;
    }
    redirectIfLoggedIn();
    await renderLogin();
    await renderPanel();
    await renderEquipo();
  }

  start();
})();
