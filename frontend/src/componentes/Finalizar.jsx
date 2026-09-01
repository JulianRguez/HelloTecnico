import { useState } from "react";
import "./Finalizar.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ESTADOS = ["Pendiente", "Pospuesto", "Realizado"];

const NOTAS_RAPIDAS = [
  {
    nombre: "Instalado",
    texto: "La Instalación Fue realizada",
    estados: ["Realizado"],
  },
  {
    nombre: "No contesta",
    texto: "No contesto 3 Llamadas",
    estados: ["Pospuesto"],
  },
  {
    nombre: "Apagado",
    texto: "El numero de contacto suena apagado",
    estados: ["Pospuesto"],
  },
  {
    nombre: "Trasladado",
    texto: "El traslado fue realizado a la nueva dirección",
    estados: ["Realizado"],
  },
  {
    nombre: "Router Cambiado",
    texto: "Se realizó cambio de Router",
    estados: ["Realizado"],
  },
  {
    nombre: "Cable cambiado",
    texto: "Cable Remplazado desde el poste.",
    estados: ["Realizado"],
  },
];

function Finalizar({ tarea, onCerrar, onFinalizado }) {
  const [estado, setEstado] = useState("Pendiente");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cambiarEstado = (e) => {
    const nuevoEstado = e.target.value;

    setEstado(nuevoEstado);
    setNota("");
    setMensaje("");
  };

  const cambiarNota = (e) => {
    setNota(e.target.value);
    setMensaje("");
  };

  const cambiarNotaRapida = (texto) => {
    setNota(texto);
    setMensaje("");
  };

  const terminar = async (e) => {
    e.preventDefault();

    const notaLimpia = nota.trim();

    if (estado === "Pendiente") {
      setMensaje("Seleccione Pospuesto o Realizado");
      return;
    }

    if (notaLimpia.length < 10) {
      setMensaje("La nota debe tener mínimo 10 caracteres");
      return;
    }

    if (notaLimpia.length > 70) {
      setMensaje("La nota no puede superar 70 caracteres");
      return;
    }

    if (!tarea?._id) {
      setMensaje("No se encontró la tarea");
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      // Agregar nota al historial
      const respuestaHistorial = await fetch(
        `${API_URL}/api/tareas/${tarea._id}/historial`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            historial: notaLimpia,
            tecnico: tarea.tecnico?.nombre || "Técnico no identificado",
          }),
        },
      );

      const textoHistorial = await respuestaHistorial.text();

      if (!respuestaHistorial.ok) {
        throw new Error(
          `Error al actualizar historial: ${respuestaHistorial.status}`,
        );
      }

      // Actualizar estado
      const respuestaEstado = await fetch(
        `${API_URL}/api/tareas/${tarea._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado,
            tecnico: null,
          }),
        },
      );

      const textoEstado = await respuestaEstado.text();

      if (!respuestaEstado.ok) {
        throw new Error(
          `Error al actualizar estado: ${respuestaEstado.status}`,
        );
      }

      // Cerrar modal y cargar nuevamente las tareas
      onFinalizado();
    } catch (error) {
      console.error("Error al finalizar tarea:", error);

      setMensaje(error.message || "No se pudo finalizar la tarea");
    } finally {
      setGuardando(false);
    }
  };

  const notaHabilitada = estado === "Realizado" || estado === "Pospuesto";

  const puedeTerminar =
    !guardando &&
    notaHabilitada &&
    nota.trim().length >= 10 &&
    nota.trim().length <= 70;

  return (
    <div className="finalizar">
      <div className="finalizar-encabezado">
        <h2>Finalizar tarea</h2>

        <button
          type="button"
          className="finalizar-cerrar"
          onClick={onCerrar}
          disabled={guardando}
        >
          ×
        </button>
      </div>

      <div className="finalizar-cliente">{tarea?.cliente}</div>

      <form onSubmit={terminar}>
        {/* ESTADO */}
        <div className="finalizar-campo">
          <label htmlFor="estado">Estado</label>

          <select
            id="estado"
            value={estado}
            onChange={cambiarEstado}
            disabled={guardando}
            className="finalizar-select"
          >
            {ESTADOS.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </div>

        {/* NOTA */}
        <div className="finalizar-campo">
          <label htmlFor="nota">Detalle</label>

          <textarea
            id="nota"
            value={nota}
            onChange={cambiarNota}
            minLength={10}
            maxLength={70}
            rows={3}
            placeholder={
              notaHabilitada
                ? "Escriba una nota..."
                : "Seleccione un estado para ingresar el detalle"
            }
            disabled={!notaHabilitada || guardando}
          />

          <div className="finalizar-contador">{nota.length}/70</div>
        </div>

        {/* NOTAS RÁPIDAS */}
        <div className="finalizar-campo">
          <label>Notas rápidas</label>

          <div className="finalizar-rapidas">
            {NOTAS_RAPIDAS.map((opcion) => {
              const habilitada =
                notaHabilitada && opcion.estados.includes(estado);

              return (
                <button
                  key={opcion.nombre}
                  type="button"
                  className="finalizar-rapida"
                  onClick={() => cambiarNotaRapida(opcion.texto)}
                  disabled={!habilitada || guardando}
                >
                  {opcion.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {mensaje && <div className="finalizar-mensaje">{mensaje}</div>}

        {/* BOTONES */}
        <div className="finalizar-botones">
          <button
            type="submit"
            className="finalizar-terminar"
            disabled={!puedeTerminar}
          >
            {guardando ? "Guardando..." : "Terminar tarea"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Finalizar;
