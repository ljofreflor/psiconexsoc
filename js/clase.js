(function () {
  // Cinta ASCII horneada. El mp4 no entra. No va en botones.
  if (document.body.classList.contains("regime-reading")) return;

  var quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CAMPOS = ".hero, .look-clinic, .shop-card.orange";
  var nodos = [];
  document.querySelectorAll(CAMPOS).forEach(function (el) {
    if (el.classList.contains("btn") || el.closest(".btn")) return;
    nodos.push(el);
  });
  if (!nodos.length) return;

  var script = document.currentScript;
  var src = script && script.getAttribute("src");
  var jsonUrl = (src ? src.replace(/[^/]+$/, "") : "js/").replace(/js\/?$/, "") + "assets/clase/frames.json?v=20260917";

  function hexToRgb(hex) {
    var n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mix(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }

  function cssRgb(c) {
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  }

  function decodeFrame(s) {
    var cells = [];
    for (var i = 0; i < s.length; ) {
      var n = parseInt(s.slice(i, i + 2), 10);
      var ci = parseInt(s.charAt(i + 2), 16);
      var pi = parseInt(s.charAt(i + 3), 16);
      i += 4;
      for (var k = 0; k < n; k++) cells.push(ci, pi);
    }
    return cells;
  }

  function cssColor(el, name, fallbackHex, fallbackRgb) {
    var raw = getComputedStyle(el).getPropertyValue(name).trim() || fallbackHex;
    if (raw.charAt(0) !== "#") {
      var probe = document.createElement("span");
      probe.style.color = raw;
      el.appendChild(probe);
      var m = getComputedStyle(probe).color.match(/\d+/g);
      probe.remove();
      if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
      return fallbackRgb;
    }
    return hexToRgb(raw);
  }

  function paint(ctx, data, cells, mixed, wpx, hpx) {
    var cw = wpx / data.w;
    var ch = hpx / data.h;
    ctx.clearRect(0, 0, wpx, hpx);
    ctx.font = Math.max(4, Math.floor(ch * 0.96)) + "px ui-monospace, SF Mono, Menlo, Consolas, monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    var i = 0;
    for (var y = 0; y < data.h; y++) {
      var cy = (y + 0.5) * ch;
      for (var x = 0; x < data.w; x++) {
        var gi = cells[i++];
        var pi = cells[i++];
        var glyph = data.ramp.charAt(gi);
        if (!glyph || glyph === " ") continue;
        ctx.fillStyle = mixed[pi];
        ctx.fillText(glyph, (x + 0.5) * cw, cy);
      }
    }
  }

  function mount(data) {
    var decoded = data.frames.map(decodeFrame);
    var screens = [];

    nodos.forEach(function (el) {
      var canvas = document.createElement("canvas");
      canvas.className = "clase-ascii";
      canvas.setAttribute("aria-hidden", "true");
      el.insertBefore(canvas, el.firstChild);

      var orange = cssColor(el, "--orange", "#eb6608", [235, 102, 8]);
      var cyan = cssColor(el, "--cyan", "#426f8e", [66, 111, 142]);
      var grisAzul = mix(mix(cyan, orange, 0.38), [22, 30, 40], 0.42);
      var vivid = mix(orange, [220, 48, 0], 0.22);
      var sombra = mix(vivid, [70, 18, 0], 0.38);
      var clara = mix(vivid, [255, 168, 72], 0.42);
      var mixed = data.palette.map(function (hex) {
        var p = hexToRgb(hex);
        var luma = (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
        var t = Math.max(0, Math.min(1, (luma - 0.5) * 2.05 + 0.42));
        var warm = mix(sombra, clara, t);
        return cssRgb(mix(grisAzul, warm, t));
      });

      var ctx = canvas.getContext("2d");
      var lastW = 0;
      var lastH = 0;

      function size() {
        var dpr = window.devicePixelRatio || 1;
        var w = el.clientWidth;
        var h = el.clientHeight;
        if (!w || !h) return false;
        if (w === lastW && h === lastH && canvas.width) return true;
        lastW = w;
        lastH = h;
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return true;
      }

      screens.push({ canvas: canvas, ctx: ctx, mixed: mixed, size: size, el: el });
    });

    var frame = 0;
    function draw() {
      var cells = decoded[frame] || decoded[0];
      for (var i = 0; i < screens.length; i++) {
        var s = screens[i];
        if (!s.size()) continue;
        paint(s.ctx, data, cells, s.mixed, s.el.clientWidth, s.el.clientHeight);
      }
    }

    draw();
    if (quiet || decoded.length < 2) return;

    var fps = data.fps || 6;
    var last = 0;
    function tick(now) {
      if (!last) last = now;
      if (now - last >= 1000 / fps) {
        frame = (frame + 1) % decoded.length;
        last = now;
        draw();
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);

    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(draw);
      screens.forEach(function (s) { ro.observe(s.el); });
    }
  }

  fetch(jsonUrl)
    .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
    .then(mount)
    .catch(function () {});
})();
