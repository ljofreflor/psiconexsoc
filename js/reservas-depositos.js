/**
 * Pedido de horas — sin cobro en la página.
 * El honorario se acuerda en persona (analista / secretario).
 * Reagendar: solo con 48 horas de anticipación.
 */

const HORAS_MINIMAS_REAGENDAR = 48;

async function inicializarSistemaReservas() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "/cuenta.html";
    return;
  }

  const esPrimeraSesion = await verificarPrimeraSesion(session.user.id);
  if (esPrimeraSesion) mostrarUIOrientacion();
  else mostrarUISesion();
}

async function verificarPrimeraSesion(perfilId) {
  const { data: reservasPrevias } = await supabase
    .from("reservas")
    .select("id")
    .eq("perfil_id", perfilId)
    .limit(1);

  return reservasPrevias && reservasPrevias.length === 0;
}

async function crearReservaPrimeraSesion(bloqueId, profesional, inicio, fin) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const { data: reserva, error } = await supabase
      .from("reservas")
      .insert({
        perfil_id: session.user.id,
        bloque_id: bloqueId,
        profesional: profesional,
        inicio: inicio,
        fin: fin,
        es_primera_sesion: true,
        requiere_deposito: false,
        deposito_monto: null,
        deposito_estado: "exento"
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from("bloques")
      .update({ tomado: true })
      .eq("id", bloqueId);

    mostrarConfirmacion({
      titulo: "Orientación pedida",
      mensaje: "Sin costo. El equipo confirma la hora. Este sitio no cobra.",
      reserva: reserva
    });

    return reserva;
  } catch (error) {
    console.error("Error al crear reserva:", error);
    mostrarError("No pudimos anotar el pedido. Llamá al secretario.");
  }
}

/** Pedido de sesión: la hora la confirma el equipo; el pago es personal. */
async function crearReservaSesion(bloqueId, profesional, inicio, fin) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const { data: reserva, error } = await supabase
      .from("reservas")
      .insert({
        perfil_id: session.user.id,
        bloque_id: bloqueId,
        profesional: profesional,
        inicio: inicio,
        fin: fin,
        es_primera_sesion: false,
        requiere_deposito: false,
        deposito_monto: null,
        deposito_estado: "exento"
      })
      .select()
      .single();

    if (error) throw error;

    mostrarConfirmacion({
      titulo: "Pedido de sesión anotado",
      mensaje:
        "El honorario se acuerda en persona con el analista o el secretario. Esta página no procesa pagos.",
      reserva: reserva
    });

    return reserva;
  } catch (error) {
    console.error("Error al crear reserva:", error);
    mostrarError("No pudimos anotar el pedido. Llamá al secretario.");
  }
}

async function crearReservaConDeposito(bloqueId, profesional, inicio, fin) {
  return crearReservaSesion(bloqueId, profesional, inicio, fin);
}

async function crearReservaConAnticipo(bloqueId, profesional, inicio, fin) {
  return crearReservaSesion(bloqueId, profesional, inicio, fin);
}

async function cancelarReserva(reservaId) {
  try {
    const { data: reserva } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (!reserva) throw new Error("Reserva no encontrada");

    const horasHastaReserva = calcularHorasHastaReserva(reserva.inicio);

    if (horasHastaReserva < HORAS_MINIMAS_REAGENDAR) {
      mostrarError(
        "Con menos de 48 horas no se libera ni se reagenda. La hora permanece a tu nombre. Hablá con el secretario si hay una situación excepcional."
      );
      return;
    }

    await supabase
      .from("reservas")
      .update({
        estado: "movida",
        asistencia: "cancelo_a_tiempo"
      })
      .eq("id", reservaId);

    if (reserva.bloque_id) {
      await supabase
        .from("bloques")
        .update({ tomado: false })
        .eq("id", reserva.bloque_id);
    }

    mostrarConfirmacion({
      titulo: "Hora liberada",
      mensaje: "Se liberó con más de 48 horas. Coordiná una nueva hora con el equipo."
    });
  } catch (error) {
    console.error("Error al cancelar reserva:", error);
    mostrarError("No pudimos liberar la hora. Contactá al secretario.");
  }
}

function calcularHorasHastaReserva(fechaReserva) {
  return (new Date(fechaReserva) - new Date()) / (1000 * 60 * 60);
}

function mostrarUIOrientacion() {
  const el = document.getElementById("info-primera-sesion");
  if (!el) return;
  el.hidden = false;
  el.innerHTML = `
    <div class="info-encuadre">
      <p><strong>Orientación inicial</strong> — sin costo. El cobro de un eventual proceso se acuerda en persona.</p>
    </div>
  `;
}

function mostrarUISesion() {
  const el = document.getElementById("info-deposito");
  if (!el) return;
  el.hidden = false;
  el.innerHTML = `
    <div class="info-encuadre">
      <p><strong>Sesión</strong> — el honorario se acuerda en persona. Esta página no cobra.</p>
      <p>Reagendar solo con 48 horas de anticipación.</p>
      <a href="/honorarios.html#encuadre-personal" class="link-politica">Ver encuadre</a>
    </div>
  `;
}

function mostrarUIPriveraSesion() { mostrarUIOrientacion(); }
function mostrarUIConDeposito() { mostrarUISesion(); }
function mostrarUIConAnticipo() { mostrarUISesion(); }

function mostrarConfirmacion(config) {
  const container = document.getElementById("confirmacion-container");
  if (!container) return;
  container.innerHTML = `
    <div class="confirmacion-success">
      <h2>${config.titulo}</h2>
      <p>${config.mensaje}</p>
      ${config.reserva ? `
        <div class="detalles-reserva">
          <p><strong>Fecha:</strong> ${new Date(config.reserva.inicio).toLocaleString("es-CL")}</p>
          <p><strong>Profesional:</strong> ${config.reserva.profesional}</p>
        </div>
      ` : ""}
      <a href="/cuenta.html" class="btn btn-primary">Ir a la cuenta</a>
    </div>
  `;
  container.hidden = false;
}

function mostrarError(mensaje) {
  const errorDiv = document.getElementById("error-container");
  if (!errorDiv) {
    console.error(mensaje);
    return;
  }
  errorDiv.textContent = mensaje;
  errorDiv.hidden = false;
  setTimeout(function () { errorDiv.hidden = true; }, 6000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarSistemaReservas);
} else if (document.getElementById("info-primera-sesion") || document.getElementById("info-deposito")) {
  inicializarSistemaReservas();
}
