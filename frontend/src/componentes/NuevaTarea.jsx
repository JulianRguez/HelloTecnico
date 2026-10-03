import { useState } from "react";
import { calcularVence, DIAS_POR_ACCION } from "../utils/fecha";
import "./NuevaTarea.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const ACCIONES = Object.keys(DIAS_POR_ACCION);

function NuevaTarea({ tarea, onCerrar, onCreada }) {
  const [accion, setAccion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const aceptar = async () => {
    if (!accion) {
      setError("Seleccione un procedimiento");
      return;
    }

    setError("");
    setGuardando(true);

    try {
      const vence = await calcularVence(accion);

      const respuesta = await fetch(
        `${API_URL}/api/tareas/${tarea._id}/nueva`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accion,
            solicitud: new Date().toISOString(),
            vence: vence.toISOString(),
          }),
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo crear la nueva tarea");
      }

      onCreada(datos);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="nueva-tarea">
      <h2>Seleccione el nuevo procedimiento para {tarea?.cliente}</h2>

      <select value={accion} onChange={(e) => setAccion(e.target.value)}>
        <option value="">Seleccione...</option>

        {ACCIONES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {error && <div className="nueva-tarea-error">{error}</div>}

      <div className="nueva-tarea-botones">
        <button
          type="button"
          className="nueva-tarea-cancelar"
          onClick={onCerrar}
          disabled={guardando}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="nueva-tarea-aceptar"
          onClick={aceptar}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Aceptar"}
        </button>
      </div>
    </div>
  );
}

export default NuevaTarea;