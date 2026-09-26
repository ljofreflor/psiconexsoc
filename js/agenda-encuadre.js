/**
 * Pinta el calendario del sitio con slots de la API de Google
 * (vía Edge Function agenda-disponibilidad). Diseño propio; reserva en Google.
 */
(function () {
  var cfg = window.PSICONEXSOC || {};
  var calUrl = cfg.calendarioGoogle || "https://calendar.app.google/C9fMj6JkVmG1vV1B7";
  var horas = cfg.agendaHoras || ["09:00", "10:10", "11:20", "15:00", "16:10", "17:20"];
  var weekEl = document.querySelector("[data-cal-week]");
  var labelEl = document.querySelector("[data-cal-label]");
  var fuenteEl = document.querySelector("[data-cal-fuente]");
  var summary = document.querySelector("[data-booking-summary]");
  var slotTxt = document.querySelector("[data-booking-slot]");
  var continuar = document.querySelector("[data-continuar-google]");
  var statusEl = document.querySelector("[data-cal-status]");

  document.querySelectorAll("[data-calendario-google]").forEach(function (a) {
    a.href = calUrl;
  });
  if (continuar) continuar.href = calUrl;

  // Contactos
  var root = document.querySelector("[data-contactos-profesionales]");
  if (root && cfg.profesionales) {
    cfg.profesionales.forEach(function (p) {
      var art = document.createElement("article");
      art.className = "member";
      art.id = "contacto-" + p.id;
      var html = "<h3>" + p.nombre + "</h3>";
      if (p.orientacion) html += '<p class="note">' + p.orientacion + "</p>";
      if (p.telefono && p.telefonoTexto) {
        html += '<p><a href="tel:' + p.telefono + '">' + p.telefonoTexto + "</a></p>";
      } else {
        html +=
          '<p class="note">Teléfono directo: se publica cuando el profesional lo confirme.</p>';
      }
      if (p.secretarioTelefono && p.secretarioTelefonoTexto) {
        html +=
          "<p>" +
          (p.secretarioNombre || "Asistente / secretario") +
          ': <a href="tel:' +
          p.secretarioTelefono +
          '">' +
          p.secretarioTelefonoTexto +
          "</a></p>";
      }
      art.innerHTML = html;
      root.appendChild(art);
    });
  }

  if (!weekEl) return;

  var weekOffset = 0;
  var selected = null;
  /** @type {Object.<string, {libre:boolean, start:string, end:string, day:string, hour:string}>} */
  var slotMap = {};
  var apiLive = false;
  var loading = false;

  function startOfWeek(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    var day = x.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    return x;
  }

  function addDays(d, n) {
    var x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  (function initOffset() {
    var mon = startOfWeek(new Date());
    var friEnd = addDays(mon, 4);
    friEnd.setHours(23, 59, 0, 0);
    if (Date.now() > friEnd.getTime()) weekOffset = 1;
  })();

  function fmtDay(d) {
    return d.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }

  function weekLabel(mon) {
    var fri = addDays(mon, 4);
    return (
      mon.toLocaleDateString("es-CL", { day: "numeric", month: "long" }) +
      " – " +
      fri.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })
    );
  }

  function dayKey(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function setStatus(t) {
    if (statusEl) statusEl.textContent = t || "";
  }

  function showSummary() {
    if (!selected || !summary) return;
    summary.hidden = false;
    if (slotTxt) slotTxt.textContent = selected.label;
    if (continuar) continuar.href = calUrl;
    try {
      sessionStorage.setItem(
        "psiconexsoc_franja",
        JSON.stringify({
          label: selected.label,
          iso: selected.start,
          end: selected.end
        })
      );
    } catch (_) {}
  }

  function paint() {
    var mon = addDays(startOfWeek(new Date()), weekOffset * 7);
    if (labelEl) labelEl.textContent = weekLabel(mon);
    if (fuenteEl) {
      fuenteEl.textContent = apiLive
        ? "Disponibilidad leída de Google Calendar y pintada con el diseño de PSICONEXSOC. Confirmás en Google."
        : loading
          ? "Consultando disponibilidad en Google…"
          : "Conectá la API (Supabase → agenda-disponibilidad) para pintar ocupación real. Mientras, podés abrir Google.";
    }

    weekEl.classList.toggle("is-loading", loading);
    weekEl.innerHTML = "";

    var days = [];
    for (var i = 0; i < 5; i++) days.push(addDays(mon, i));

    var head = document.createElement("div");
    head.className = "cal-week-head";
    head.innerHTML =
      '<span class="cal-corner" aria-hidden="true"></span>' +
      days
        .map(function (d) {
          return (
            '<span class="cal-day-label"><span class="cal-day-name">' +
            d.toLocaleDateString("es-CL", { weekday: "short" }) +
            '</span><span class="cal-day-num">' +
            d.getDate() +
            "</span></span>"
          );
        })
        .join("");
    weekEl.appendChild(head);

    horas.forEach(function (hora) {
      var row = document.createElement("div");
      row.className = "cal-week-row";
      var time = document.createElement("span");
      time.className = "cal-time-label";
      time.textContent = hora;
      row.appendChild(time);

      days.forEach(function (day) {
        var key = dayKey(day) + "|" + hora;
        var info = slotMap[key];
        var libre = info ? info.libre : false;
        // Sin API: no inventar libres; celdas neutras
        var unknown = !apiLive && !loading;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cal-slot";
        if (unknown) {
          btn.classList.add("is-unknown");
          btn.disabled = true;
          btn.innerHTML = '<span class="cal-slot-mark">·</span>';
          btn.setAttribute("aria-label", "Sin datos de API aún");
        } else if (!libre) {
          btn.classList.add("is-busy");
          btn.disabled = true;
          btn.innerHTML = '<span class="cal-slot-mark">—</span>';
          btn.setAttribute("aria-label", "Ocupado " + fmtDay(day) + " " + hora);
        } else {
          btn.classList.add("is-free");
          if (selected && selected.key === key) btn.classList.add("is-selected");
          btn.innerHTML =
            '<span class="cal-slot-mark">Libre</span><span class="cal-slot-hour">' +
            hora +
            "</span>";
          btn.setAttribute("aria-label", "Libre " + fmtDay(day) + " " + hora);
          btn.addEventListener("click", function () {
            selected = {
              key: key,
              start: info.start,
              end: info.end,
              label:
                day.toLocaleDateString("es-CL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                }) +
                " · " +
                hora
            };
            paint();
            showSummary();
          });
        }
        row.appendChild(btn);
      });
      weekEl.appendChild(row);
    });
  }

  async function loadFromApi() {
    loading = true;
    apiLive = false;
    slotMap = {};
    paint();
    setStatus("Consultando Google Calendar…");

    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      loading = false;
      paint();
      setStatus(
        "Falta supabaseUrl / supabaseAnonKey en js/site.js para pintar desde la API."
      );
      return;
    }

    var mon = addDays(startOfWeek(new Date()), weekOffset * 7);
    var end = addDays(mon, 5);
    end.setHours(23, 59, 0, 0);

    try {
      var url =
        cfg.supabaseUrl.replace(/\/$/, "") + "/functions/v1/agenda-disponibilidad";
      var res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + cfg.supabaseAnonKey,
          apikey: cfg.supabaseAnonKey
        },
        body: JSON.stringify({
          timeMin: mon.toISOString(),
          timeMax: end.toISOString(),
          hours: horas
        })
      });
      var data = await res.json().catch(function () {
        return {};
      });
      loading = false;

      if (!res.ok || !data.configured || !Array.isArray(data.slots)) {
        paint();
        setStatus(
          data.error ||
            "API no configurada. Deploy agenda-disponibilidad + secrets de Google."
        );
        return;
      }

      data.slots.forEach(function (s) {
        slotMap[s.day + "|" + s.hour] = s;
      });
      apiLive = true;
      setStatus(
        "Pintado desde Google (" +
          (data.mode || "api") +
          "). " +
          data.slots.filter(function (s) {
            return s.libre;
          }).length +
          " franjas libres esta semana."
      );
      paint();
    } catch (e) {
      loading = false;
      paint();
      setStatus("No se pudo hablar con la API. Probá de nuevo o abrí Google.");
    }
  }

  function goWeek(delta) {
    weekOffset += delta;
    selected = null;
    if (summary) summary.hidden = true;
    loadFromApi();
  }

  var prev = document.querySelector("[data-cal-prev]");
  var next = document.querySelector("[data-cal-next]");
  var clear = document.querySelector("[data-cal-limpiar]");
  var reload = document.querySelector("[data-cal-reload]");
  if (prev) prev.addEventListener("click", function () { goWeek(-1); });
  if (next) next.addEventListener("click", function () { goWeek(1); });
  if (clear) {
    clear.addEventListener("click", function () {
      selected = null;
      if (summary) summary.hidden = true;
      paint();
    });
  }
  if (reload) reload.addEventListener("click", function () { loadFromApi(); });

  loadFromApi();
})();
