(function () {
  var toggle = document.querySelector("[data-nav-toggle]");
  var panel = document.querySelector("[data-nav-panel]");
  if (!toggle || !panel) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
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

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = (form.querySelector('[name="nombre"]') || {}).value || "";
    var email = (form.querySelector('[name="correo"]') || {}).value || "";
    var modality = (form.querySelector('[name="modalidad"]') || {}).value || "";
    var reason = (form.querySelector('[name="motivo"]') || {}).value || "";
    var consent = form.querySelector('[name="consentimiento"]');
    if (consent && !consent.checked) {
      form.querySelector("[data-form-status]").textContent =
        "Necesitamos tu consentimiento para enviar la solicitud.";
      return;
    }
    var body = [
      "Nombre: " + name,
      "Correo: " + email,
      "Modalidad: " + modality,
      "",
      "Motivo:",
      reason
    ].join("\n");
    var href =
      "mailto:contacto@psiconexsoc.com?subject=" +
      encodeURIComponent("Orientación inicial — " + name) +
      "&body=" +
      encodeURIComponent(body);
    window.location.href = href;
    form.querySelector("[data-form-status]").textContent =
      "Se abrirá tu correo para enviar la solicitud a contacto@psiconexsoc.com. No guardamos la ficha en este sitio.";
  });
})();
