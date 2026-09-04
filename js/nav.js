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

  function mailtoFallback(name, email, modality, reason) {
    var body = [
      "Nombre: " + name,
      "Correo: " + email,
      "Modalidad: " + modality,
      "",
      "Motivo:",
      reason
    ].join("\n");
    window.location.href =
      "mailto:contacto@psiconexsoc.com?subject=" +
      encodeURIComponent("Orientación inicial — " + name) +
      "&body=" +
      encodeURIComponent(body);
    status.textContent =
      "Si no se abre el envío, escribe a contacto@psiconexsoc.com. Este sitio no guarda la ficha.";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = (form.querySelector('[name="nombre"]') || {}).value || "";
    var email = (form.querySelector('[name="correo"]') || {}).value || "";
    var modality = (form.querySelector('[name="modalidad"]') || {}).value || "";
    var reason = (form.querySelector('[name="motivo"]') || {}).value || "";
    var consent = form.querySelector('[name="consentimiento"]');
    if (consent && !consent.checked) {
      status.textContent = "Necesitamos tu consentimiento para enviar la solicitud.";
      return;
    }

    status.textContent = "Enviando…";

    fetch("https://formsubmit.co/ajax/contacto@psiconexsoc.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        nombre: name,
        correo: email,
        modalidad: modality,
        motivo: reason,
        _subject: "Orientación inicial — " + name,
        _template: "box",
        _captcha: "false"
      })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok) {
          form.reset();
          status.textContent =
            "Solicitud enviada a contacto@psiconexsoc.com. Te responderemos por correo. Este sitio no guarda la ficha.";
          return;
        }
        mailtoFallback(name, email, modality, reason);
      })
      .catch(function () {
        mailtoFallback(name, email, modality, reason);
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
