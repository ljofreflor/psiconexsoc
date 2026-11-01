(function () {
  var toggle = document.querySelector("[data-nav-toggle]");
  var panel = document.querySelector("[data-nav-panel]");
  if (!toggle || !panel) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "Cerrar" : "Más";
    panel.hidden = !open;
    document.body.classList.toggle("nav-open", open);
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  panel.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });
})();

(function () {
  var form = document.querySelector("[data-contact-form]");
  if (!form) return;

  var status = form.querySelector("[data-form-status]");
  var cfg = window.PSICONEXSOC || {};
  var phone = cfg.telefonoTexto || "+56 9 8121 6395";
  var tel = cfg.telefono || "56981216395";

  function setStatus(text) {
    if (!status) return;
    status.textContent = text;
  }

  function copyPhone() {
    var text = phone;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus("Teléfono copiado: " + text);
      }).catch(function () {
        setStatus("Llama al " + text);
      });
      return;
    }
    setStatus("Llama al " + text);
  }

  var copyBtn = document.querySelector("[data-copy-phone]");
  if (copyBtn) {
    copyBtn.addEventListener("click", copyPhone);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = (form.querySelector('[name="nombre"]') || {}).value || "";
    var email = (form.querySelector('[name="correo"]') || {}).value || "";
    var modality = (form.querySelector('[name="modalidad"]') || {}).value || "";
    var reason = (form.querySelector('[name="motivo"]') || {}).value || "";
    var consent = form.querySelector('[name="consentimiento"]');
    var desde = (cfg.param && cfg.param("desde")) || "";
    var motivoConOrigen = desde ? ("[desde=" + desde + "] " + reason).trim() : reason;
    if (consent && !consent.checked) {
      setStatus("Necesitamos tu consentimiento para enviar la solicitud.");
      return;
    }

    setStatus("Enviando…");
    if (window.PSICONEXSOC && window.PSICONEXSOC.medir) {
      window.PSICONEXSOC.medir("Formulario", { desde: desde || "contacto" });
    }

    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
      if (cfg.correoContacto) {
        var asunto = encodeURIComponent("Solicitud PSICONEXSOC");
        var cuerpo = encodeURIComponent(
          "Nombre: " + name + "\n" +
          "Correo: " + email + "\n" +
          "Modalidad: " + modality + "\n" +
          "Origen: " + (desde || "contacto") + "\n" +
          "Motivo: " + reason + "\n"
        );
        window.location.href = "mailto:" + cfg.correoContacto + "?subject=" + asunto + "&body=" + cuerpo;
        setStatus("Se abrió tu correo. Si no, llama al " + phone + " o reserva en la agenda.");
        return;
      }
      setStatus("El formulario aún no tiene destino. Llama al " + phone + ", copia el teléfono abajo o reserva en la agenda.");
      return;
    }

    var db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    db.rpc("enviar_solicitud", {
      p_nombre: name,
      p_correo: email,
      p_modalidad: modality,
      p_motivo: motivoConOrigen
    }).then(function (result) {
      if (result.error) {
        setStatus("No se pudo enviar. Llama al " + phone + ".");
        copyPhone();
        return;
      }
      form.reset();
      setStatus("Solicitud recibida. Te responderemos; el teléfono sigue siendo " + phone + ".");
    }).catch(function () {
      setStatus("No se pudo enviar. Llama al " + phone + ".");
      copyPhone();
    });
  });
})();

(function () {
  var bar = document.querySelector(".reading-bar");
  if (!bar) return;
  if (window.CSS && CSS.supports && CSS.supports("animation-timeline", "scroll()")) {
    return;
  }
  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = "scaleX(" + progress + ")";
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
})();
