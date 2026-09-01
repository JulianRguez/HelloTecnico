import { useEffect, useState } from "react";
import {
  RefreshCw,
  UserRound,
  Wrench,
  MapPin,
  Phone,
  Wifi,
  FileText,
  CircleDollarSign,
} from "lucide-react";

import Finalizar from "./Finalizar";
import "./Tecnico.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Tecnico() {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));

  const [tareaSiguiente, setTareaSiguiente] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const usuarioId = usuario?._id;

  useEffect(() => {
    if (usuarioId) {
      cargarTareas();
    }
  }, [usuarioId]);

  const cargarTareas = async () => {
    if (!usuarioId) return;

    try {
      setCargando(true);
      setMensaje("");

      // Siguiente tarea
      const respuestaSiguiente = await fetch(
        `${API_URL}/api/tareas/tecnico/${usuarioId}/siguiente`,
      );

      const datosSiguiente = await respuestaSiguiente.json();

      if (!respuestaSiguiente.ok) {
        throw new Error(
          datosSiguiente.mensaje || "No se pudo obtener la siguiente tarea",
        );
      }

      setTareaSiguiente(datosSiguiente);

      // Todas las tareas del técnico
      const respuestaTareas = await fetch(
        `${API_URL}/api/tareas/tecnico/${usuarioId}`,
      );

      const datosTareas = await respuestaTareas.json();

      if (!respuestaTareas.ok) {
        throw new Error(
          datosTareas.mensaje || "No se pudieron obtener las tareas",
        );
      }

      // Las demás tareas pendientes o pospuestas
      const otrasTareas = datosTareas.filter(
        (tarea) =>
          tarea._id !== datosSiguiente?._id &&
          ["Pendiente", "Pospuesto"].includes(tarea.estado),
      );

      setTareas(otrasTareas);
    } catch (error) {
      console.error(error);
      setMensaje(error.message || "No se pudieron cargar las tareas");
    } finally {
      setCargando(false);
    }
  };

  const copiar = async (texto) => {
    if (!texto) return;

    try {
      await navigator.clipboard.writeText(texto);

      setMensaje(`Copiado: ${texto}`);

      setTimeout(() => {
        setMensaje("");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMensaje("No fue posible copiar");
    }
  };

  const abrirFinalizar = () => {
    setModalFinalizar(true);
  };

  const cerrarFinalizar = () => {
    setModalFinalizar(false);
  };

  const finalizarCompletada = async () => {
    setModalFinalizar(false);

    // Vuelve a consultar:
    // 1. siguiente tarea
    // 2. lista de tareas restantes
    await cargarTareas();
  };
  const obtenerClaseGrupo = (accion) => {
    if (["Revision", "Cambio equipo", "Cambio cable"].includes(accion)) {
      return "grupo-revision";
    }

    if (["Instalacion", "Traslado", "Reconexion"].includes(accion)) {
      return "grupo-principal";
    }

    return "grupo-otros";
  };

  return (
    <div className="tecnico">
      <div className="tecnico-encabezado">
        <h1>
          <UserRound size={22} />
          {usuario?.nombre}
        </h1>

        <button
          type="button"
          className="tecnico-actualizar"
          onClick={cargarTareas}
          title="Actualizar"
        >
          <RefreshCw size={22} />
        </button>
      </div>

      {mensaje && <div className="tecnico-mensaje">{mensaje}</div>}

      {tareaSiguiente ? (
        <>
          <div className="tecnico-tarea">
            <div className="tecnico-fila tecnico-cliente">
              {tareaSiguiente.cliente}
            </div>

            <div className="tecnico-fila">
              <Wrench size={17} />
              <span>{tareaSiguiente.accion}</span>
              <span>{tareaSiguiente.instalacion}</span>
            </div>

            <div className="tecnico-fila">
              <MapPin size={17} />
              <span>{tareaSiguiente.zona}</span>
              <span>{tareaSiguiente.direccion}</span>
            </div>

            {tareaSiguiente.telefono && (
              <div className="tecnico-fila">
                <Phone size={17} />

                <div className="tecnico-dato-copiar">
                  <span>
                    <strong>Telefono 1:</strong> {tareaSiguiente.telefono}
                  </span>

                  <button
                    type="button"
                    className="tecnico-copiar"
                    onClick={() => copiar(tareaSiguiente.telefono)}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {tareaSiguiente.telefono2 && (
              <div className="tecnico-fila">
                <Phone size={17} />

                <div className="tecnico-dato-copiar">
                  <span>
                    <strong>Telefono 2:</strong> {tareaSiguiente.telefono2}
                  </span>

                  <button
                    type="button"
                    className="tecnico-copiar"
                    onClick={() => copiar(tareaSiguiente.telefono2)}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {tareaSiguiente.ip && (
              <div className="tecnico-fila">
                <Wifi size={17} />

                <div className="tecnico-dato-copiar">
                  <span>
                    <strong>IP Router:</strong> {tareaSiguiente.ip}
                  </span>

                  <button
                    type="button"
                    className="tecnico-copiar"
                    onClick={() => copiar(tareaSiguiente.ip)}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {tareaSiguiente.ip2 && (
              <div className="tecnico-fila">
                <Wifi size={17} />

                <div className="tecnico-dato-copiar">
                  <span>
                    <strong>IP Antena:</strong> {tareaSiguiente.ip2}
                  </span>

                  <button
                    type="button"
                    className="tecnico-copiar"
                    onClick={() => copiar(tareaSiguiente.ip2)}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {tareaSiguiente.detalle && (
              <div className="tecnico-fila tecnico-detalle">
                <FileText size={17} />
                <span>{tareaSiguiente.detalle}</span>
              </div>
            )}

            <div className="tecnico-fila tecnico-debe">
              <CircleDollarSign size={17} />
              <span>
                {tareaSiguiente.debe
                  ? `Debe: ${tareaSiguiente.valor}`
                  : "No debe"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="tecnico-finalizar"
            onClick={abrirFinalizar}
          >
            Finalizar tarea
          </button>
        </>
      ) : (
        <div className="tecnico-sin-tarea">No tienes tareas pendientes.</div>
      )}

      <h2>Próximo procedimiento</h2>

      <div className="tecnico-lista">
        {tareas.length > 0 ? (
          tareas.map((tarea) => (
            <div
              className={`tecnico-proxima ${obtenerClaseGrupo(tarea.accion)}`}
              key={tarea._id}
            >
              <strong>{tarea.cliente?.split(" ").slice(0, 2).join(" ")}</strong>

              <span>{tarea.zona}</span>

              <span className="tecnico-accion">
                <span className="tecnico-punto"></span>
                {tarea.accion?.split(" ")[0]}
              </span>
            </div>
          ))
        ) : (
          <div className="tecnico-sin-proximas">
            No hay más procedimientos asignados.
          </div>
        )}
      </div>

      {modalFinalizar && (
        <div className="modal">
          <div className="modal-contenido">
            <Finalizar
              tarea={tareaSiguiente}
              onCerrar={cerrarFinalizar}
              onFinalizado={finalizarCompletada}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Tecnico;
