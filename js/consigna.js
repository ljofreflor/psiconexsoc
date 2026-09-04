(function () {
  var button = document.querySelector("[data-consigna]");
  if (!button) return;

  var src = "assets/audio/consigna.mp3";
  var audio = document.querySelector("[data-consigna-audio]");
  if (!audio) {
    audio = document.createElement("audio");
    audio.setAttribute("preload", "none");
    audio.setAttribute("data-consigna-audio", "");
    button.after(audio);
  }

  function markUnavailable() {
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    button.removeAttribute("aria-pressed");
    button.textContent = "La voz de la consigna aún no está";
  }

  function setPlaying(playing) {
    button.setAttribute("aria-pressed", playing ? "true" : "false");
    button.textContent = playing ? "Pausar la consigna" : "Escuchar la consigna";
  }

  fetch(src, { method: "HEAD" })
    .then(function (response) {
      if (!response.ok) {
        markUnavailable();
        return;
      }
      audio.src = src;
      button.addEventListener("click", function () {
        if (audio.paused) {
          audio.play();
          setPlaying(true);
        } else {
          audio.pause();
          setPlaying(false);
        }
      });
      audio.addEventListener("ended", function () {
        setPlaying(false);
      });
    })
    .catch(markUnavailable);
})();
