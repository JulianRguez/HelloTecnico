import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import Formulario from "./Formulario";
import Historial from "./Historial";
import "./Soporte.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ESTADOS = ["Pendiente", "Realizado", "Cancelado", "Pospuesto", "Cerrado"];

const ACCIONES = [
  "Instalacion",
  "Traslado",
  "Revision",
  "Reconexion",
  "Retiro equipos",
  "Cableado interno",
  "Repetidor",
  "Viabilidad",
  "Cambio equipo",
  "Cambio cable",
];

const INSTALACIONES = ["Utp", "Fibra óptica", "Radio enlace"];

const claseEstado = (estado) => {
  switch (estado) {
    case "Pendiente":
      return "estado-pendiente";

    case "Realizado":
      return "estado-realizado";

    case "Cancelado":
      return "estado-cancelado";

    case "Pospuesto":
      return "estado-pospuesto";

    case "Cerrado":
      return "estado-cerrado";

    default:
      return "";
  }
};

const claseAccion = (accion) => {
  if (["Revision", "Cambio equipo", "Cambio cable"].includes(accion)) {
    return "accion-grupo-1";
  }

  if (["Instalacion", "Traslado", "Reconexion"].includes(accion)) {
    return "accion-grupo-2";
  }

  if (
    ["Cableado interno", "Repetidor", "Retiro equipos", "Viabilidad"].includes(
      accion,
    )
  ) {
    return "accion-grupo-3";
  }

  return "";
};

function Soporte() {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  const navigate = useNavigate();

  const [tareas, setTareas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");

  const [estadosSeleccionados, setEstadosSeleccionados] = useState({
    Pendiente: true,
    Realizado: false,
    Cancelado: false,
    Pospuesto: true,
    Cerrado: false,
  });

  const [modalFormulario, setModalFormulario] = useState(false);
  const [tareaEditar, setTareaEditar] = useState(null);

  const [modalHistorial, setModalHistorial] = useState(false);
  const [tareaHistorial, setTareaHistorial] = useState(null);

  if (!usuario || usuario.perfil !== "Soporte") {
    return <Navigate to="/" replace />;
  }

  const cargarTareas = async () => {
    try {
      setCargando(true);
      setMensaje("");

      const respuesta = await fetch(`${API_URL}/api/tareas`);
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudieron obtener las tareas");
      }

      setTareas(datos);
    } catch (error) {
      console.error(error);
      setMensaje("No fue posible cargar las tareas");
    } finally {
      setCargando(false);
    }
  };

  const cargarTecnicos = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/api/usuarios/tecnicos`);
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudieron obtener los técnicos");
      }

      setTecnicos(datos);
    } catch (error) {
      console.error(error);
      setMensaje("No fue posible cargar los técnicos");
    }
  };

  useEffect(() => {
    cargarTareas();
    cargarTecnicos();
  }, []);

  const tareasFiltradas = useMemo(() => {
    let resultado = tareas.filter(
      (tarea) => estadosSeleccionados[tarea.estado],
    );

    if (busqueda.length > 5) {
      const texto = busqueda.toLowerCase();

      resultado = resultado.filter((tarea) =>
        String(tarea.cliente || "")
          .toLowerCase()
          .includes(texto),
      );
    }

    return resultado;
  }, [tareas, estadosSeleccionados, busqueda]);

  const cambiarEstado = async (tarea, nuevoEstado) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/tareas/${tarea._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: nuevoEstado,

          // Si deja de estar Pendiente, se desasigna el técnico
          tecnico:
            nuevoEstado === "Pendiente" ? tarea.tecnico?._id || null : null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo modificar el estado");
      }

      setTareas((actuales) =>
        actuales.map((item) => (item._id === tarea._id ? datos : item)),
      );
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo cambiar el estado");
    }
  };

  const cambiarAccion = async (tarea, nuevaAccion) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/tareas/${tarea._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accion: nuevaAccion,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo modificar la acción");
      }

      setTareas((actuales) =>
        actuales.map((item) => (item._id === tarea._id ? datos : item)),
      );
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo cambiar la acción");
    }
  };

  const cambiarInstalacion = async (tarea, nuevaInstalacion) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/tareas/${tarea._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instalacion: nuevaInstalacion,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo modificar la instalación");
      }

      setTareas((actuales) =>
        actuales.map((item) => (item._id === tarea._id ? datos : item)),
      );
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo cambiar la instalación");
    }
  };

  const cambiarTecnico = async (tarea, tecnicoId) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/tareas/${tarea._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tecnico: tecnicoId || null,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo asignar el técnico");
      }

      setTareas((actuales) =>
        actuales.map((item) => (item._id === tarea._id ? datos : item)),
      );
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo cambiar el técnico");
    }
  };

  const cambiarDebe = async (tarea, nuevoDebe) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/tareas/${tarea._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          debe: nuevoDebe,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo modificar debe");
      }

      setTareas((actuales) =>
        actuales.map((item) => (item._id === tarea._id ? datos : item)),
      );
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo cambiar el campo debe");
    }
  };

  const cambiarVence = async (tarea, nuevaFecha) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/tareas/${tarea._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vence: nuevaFecha,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo modificar la fecha");
      }

      setTareas((actuales) =>
        actuales.map((item) => (item._id === tarea._id ? datos : item)),
      );
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo cambiar la fecha");
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

  const formatearFecha = (fecha) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const cambiarFiltroEstado = (estado) => {
    setEstadosSeleccionados((actuales) => ({
      ...actuales,
      [estado]: !actuales[estado],
    }));
  };

  const abrirNuevo = () => {
    setTareaEditar(null);
    setModalFormulario(true);
  };

  const abrirEditar = (tarea) => {
    setTareaEditar(tarea);
    setModalFormulario(true);
  };

  const abrirHistorial = (tarea) => {
    setTareaHistorial(tarea);
    setModalHistorial(true);
  };

  const actualizarDespuesDeGuardar = () => {
    setModalFormulario(false);
    setTareaEditar(null);
    cargarTareas();
  };

  return (
    <main className="soporte">
      <header className="soporte-header">
        <div>
          <h1>Soporte</h1>
          <p>Bienvenido, {usuario.nombre}</p>
        </div>

        <div className="soporte-header-botones">
          <button type="button" onClick={cargarTareas} disabled={cargando}>
            {cargando ? "Actualizando..." : "Actualizar"}
          </button>

          <button type="button" onClick={abrirNuevo}>
            Nuevo
          </button>
        </div>
      </header>

      <section className="soporte-controles">
        <div className="filtros-estados">
          {ESTADOS.map((estado) => (
            <label key={estado} className="filtro-estado">
              <input
                type="checkbox"
                checked={estadosSeleccionados[estado]}
                onChange={() => cambiarFiltroEstado(estado)}
              />

              <span>{estado}</span>
            </label>
          ))}
        </div>

        <div className="buscador">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre del cliente..."
          />
        </div>
      </section>

      {mensaje && <div className="soporte-mensaje">{mensaje}</div>}

      <section className="tabla-contenedor">
        <table className="tabla-tareas">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>DOC</th>
              <th>Estado</th>
              <th>Acción</th>
              <th>Técnico</th>
              <th>Zona</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Teléfono 2</th>
              <th>IP</th>
              <th>IP2</th>
              <th>Instalación</th>
              <th>Plan</th>
              <th>Solicitud</th>
              <th>Vence</th>
              <th>Debe</th>
              <th>Valor</th>
              <th>Detalle</th>
              <th>Historial</th>
              <th>Editar</th>
            </tr>
          </thead>

          <tbody>
            {tareasFiltradas.map((tarea) => {
              const telefonos = String(tarea.telefono || "")
                .split(",")
                .filter(Boolean);

              return (
                <tr key={tarea._id}>
                  <td>{tarea.cliente}</td>
                  <td>{tarea.doc || ""}</td>

                  <td>
                    <select
                      className={`boton-estado estado-${tarea.estado.toLowerCase()}`}
                      value={tarea.estado}
                      onChange={(e) => cambiarEstado(tarea, e.target.value)}
                    >
                      {ESTADOS.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select
                      className={`boton-accion ${
                        ["Revision", "Cambio equipo", "Cambio cable"].includes(
                          tarea.accion,
                        )
                          ? "accion-grupo-1"
                          : ["Instalacion", "Traslado", "Reconexion"].includes(
                                tarea.accion,
                              )
                            ? "accion-grupo-2"
                            : "accion-grupo-3"
                      }`}
                      value={tarea.accion}
                      onChange={(e) => cambiarAccion(tarea, e.target.value)}
                    >
                      {ACCIONES.map((accion) => (
                        <option key={accion} value={accion}>
                          {accion}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select
                      className={`boton-tecnico ${
                        tarea.tecnico ? "asignado" : "sin-asignar"
                      }`}
                      value={tarea.tecnico?._id || ""}
                      onChange={(e) => cambiarTecnico(tarea, e.target.value)}
                      disabled={tarea.estado !== "Pendiente"}
                    >
                      <option value="">Sin asignar</option>

                      {tecnicos.map((tecnico) => (
                        <option key={tecnico._id} value={tecnico._id}>
                          {tecnico.nombre}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>{tarea.zona}</td>

                  <td>{tarea.direccion}</td>

                  <td>
                    <button
                      type="button"
                      className="boton-tel"
                      onClick={() => copiar(tarea.telefono)}
                    >
                      {tarea.telefono || ""}
                    </button>
                  </td>

                  <td>
                    <button
                      type="button"
                      className={
                        tarea.telefono2 ? "boton-tel" : "boton-tel-vacio"
                      }
                      onClick={() => copiar(tarea.telefono2)}
                    >
                      {tarea.telefono2 || ""}
                    </button>
                  </td>

                  <td>
                    <button
                      type="button"
                      className={tarea.ip ? "boton-ip" : "boton-ip vacio"}
                      onClick={() => copiar(tarea.ip)}
                      disabled={!tarea.ip}
                    >
                      {tarea.ip || ""}
                    </button>
                  </td>

                  <td>
                    <button
                      type="button"
                      className={tarea.ip2 ? "boton-ip2" : "boton-ip2 vacio"}
                      onClick={() => copiar(tarea.ip2)}
                      disabled={!tarea.ip2}
                    >
                      {tarea.ip2 || ""}
                    </button>
                  </td>

                  <td>
                    <select
                      className="boton-instalacion"
                      value={tarea.instalacion}
                      onChange={(e) =>
                        cambiarInstalacion(tarea, e.target.value)
                      }
                    >
                      {INSTALACIONES.map((instalacion) => (
                        <option key={instalacion} value={instalacion}>
                          {instalacion}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>{tarea.plan}</td>

                  <td>{formatearFecha(tarea.solicitud)}</td>

                  <td>
                    <input
                      type="datetime-local"
                      value={
                        tarea.vence
                          ? (() => {
                              const fecha = new Date(tarea.vence);
                              const offset = fecha.getTimezoneOffset();
                              const fechaLocal = new Date(
                                fecha.getTime() - offset * 60000,
                              );

                              return fechaLocal.toISOString().slice(0, 16);
                            })()
                          : ""
                      }
                      onChange={(e) => cambiarVence(tarea, e.target.value)}
                    />
                  </td>

                  <td>
                    <select
                      className={`boton-debe ${tarea.debe ? "si" : "no"}`}
                      value={tarea.debe ? "Si" : "No"}
                      onChange={(e) =>
                        cambiarDebe(tarea, e.target.value === "Si")
                      }
                    >
                      <option value="No">No</option>
                      <option value="Si">Sí</option>
                    </select>
                  </td>

                  <td>{tarea.valor}</td>

                  <td>{tarea.detalle}</td>

                  <td>
                    <button
                      type="button"
                      className="boton-historial"
                      onClick={() => abrirHistorial(tarea)}
                    >
                      Historial
                    </button>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="boton-editar"
                      onClick={() => abrirEditar(tarea)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}

            {tareasFiltradas.length === 0 && (
              <tr>
                <td colSpan="18" className="sin-resultados">
                  No hay tareas para mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {modalFormulario && (
        <div className="modal">
          <div className="modal-contenido">
            <Formulario
              tarea={tareaEditar}
              tecnicos={tecnicos}
              onGuardado={actualizarDespuesDeGuardar}
              onCerrar={() => {
                setModalFormulario(false);
                setTareaEditar(null);
              }}
            />
          </div>
        </div>
      )}

      {modalHistorial && (
        <div className="modal">
          <div className="modal-contenido">
            <Historial
              tarea={tareaHistorial}
              onCerrar={() => {
                setModalHistorial(false);
                setTareaHistorial(null);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default Soporte;
