import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { History, Pencil } from "lucide-react";
import Formulario from "./Formulario";
import Historial from "./Historial";
import Grupo from "./Grupo";
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

/* =========================================================
   PALETAS POR ZONA
   ========================================================= */

const PALETAS_ZONA = {
  Antioquia: ["#95b5e3", "#a8c2f1", "#bcd1fa", "#cfdef5", "#e3eef4"],

  Paso: ["#e39595", "#f1a8a8", "#fabcbc", "#f5cfcf", "#f4e3e3"],

  "San Nicolas": ["#b8c2be", "#c7cecb", "#d5dbd9", "#e3e7e5", "#f0f3f2"],

  Filadelfia: ["#e3b095", "#f1c1a8", "#fad1bc", "#f5dfcf", "#f4ebe3"],

  Tunal: ["#95cfc3", "#a8d8ce", "#bce1da", "#cfeae5", "#e3f4f1"],

  "San Jeronimo": ["#be95e3", "#cca8f1", "#dbbcfa", "#e3cff5", "#ede3f4"],

  Piñones: ["#e3df95", "#f1eea8", "#faf9bc", "#f5f0cf", "#f4f2e3"],

  Llanadas: ["#e3df95", "#f1eea8", "#faf9bc", "#f5f0cf", "#f4f2e3"],

  "Quebrada Seca": ["#e3b095", "#f1c1a8", "#fad1bc", "#f5dfcf", "#f4ebe3"],

  Sucre: ["#95cfc3", "#a8d8ce", "#bce1da", "#cfeae5", "#e3f4f1"],

  Liborina: ["#be95e3", "#cca8f1", "#dbbcfa", "#e3cff5", "#ede3f4"],
};

/*
 * Si una tarea tiene una zona que no está configurada,
 * se utiliza una paleta neutra para evitar errores.
 */
const PALETA_DEFAULT = ["#b8c2be", "#c7cecb", "#d5dbd9", "#e3e7e5", "#f0f3f2"];

/* =========================================================
   OBTENER PALETA DE UNA ZONA
   ========================================================= */

const obtenerPaletaZona = (zona) => {
  return PALETAS_ZONA[zona] || PALETA_DEFAULT;
};

/* =========================================================
   COLOR DEL ESTADO
   5 estados = 5 tonos
   ========================================================= */

const obtenerColorEstado = (zona, estado) => {
  const paleta = obtenerPaletaZona(zona);

  const posicion = ESTADOS.indexOf(estado);

  if (posicion === -1) {
    return paleta[4];
  }

  return paleta[posicion];
};

/* =========================================================
   COLOR DE LA ACCIÓN
   10 acciones = 5 tonos
   Dos acciones por tono
   ========================================================= */

const obtenerColorAccion = (zona, accion) => {
  const paleta = obtenerPaletaZona(zona);

  const posicion = ACCIONES.indexOf(accion);

  if (posicion === -1) {
    return paleta[4];
  }

  const indiceColor = Math.floor(posicion / 2);

  return paleta[indiceColor];
};

/* =========================================================
   COLOR DEL CLIENTE
   Tono 4 de la paleta
   Texto negro
   ========================================================= */

const obtenerEstiloCliente = (zona) => {
  const paleta = obtenerPaletaZona(zona);

  return {
    backgroundColor: paleta[3],
    color: "#000000",
  };
};

function Soporte() {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  const navigate = useNavigate();

  const [tareas, setTareas] = useState([]);
  const [todasLasTareas, setTodasLasTareas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [venceEditando, setVenceEditando] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [actualizandoOrden, setActualizandoOrden] = useState(false);

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

  const [modalGrupo, setModalGrupo] = useState(false);
  const [tareaGrupo, setTareaGrupo] = useState(null);

  if (!usuario || usuario.perfil !== "Soporte") {
    return <Navigate to="/" replace />;
  }

  const cantidadTareasPorTecnico = todasLasTareas.reduce((conteo, tarea) => {
    if (tarea.tecnico?._id) {
      conteo[tarea.tecnico._id] = (conteo[tarea.tecnico._id] || 0) + 1;
    }

    return conteo;
  }, {});

  const cargarTareas = async () => {
    try {
      setCargando(true);
      setMensaje("");

      const respuesta = await fetch(`${API_URL}/api/tareas`);
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudieron obtener las tareas");
      }

      setTodasLasTareas(datos);
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

      // Actualiza inmediatamente la tarea modificada
      setTareas((actuales) =>
        actuales.map((item) => (item._id === tarea._id ? datos : item)),
      );

      // El backend reorganiza las posiciones del técnico anterior
      // y del nuevo técnico. Recargamos todas las tareas para
      // reflejar esas posiciones inmediatamente en el frontend.
      await cargarTareas();
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
    const fechaValidada = validarVence(nuevaFecha);

    if (!fechaValidada) {
      return;
    }

    try {
      const { dia, mes, año, horas, minutos } = fechaValidada;

      const fechaISO = new Date(
        año,
        mes - 1,
        dia,
        horas,
        minutos,
      ).toISOString();

      const respuesta = await fetch(`${API_URL}/api/tareas/${tarea._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vence: fechaISO,
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

  const cambiarTextoVence = (tarea, valor) => {
    const valorFormateado = formatearEntradaVence(valor);

    setVenceEditando((actuales) => ({
      ...actuales,
      [tarea._id]: valorFormateado,
    }));
  };

  const terminarEdicionVence = async (tarea) => {
    const valor = venceEditando[tarea._id];

    if (valor === undefined) {
      return;
    }

    const fechaValidada = validarVence(valor);

    if (!fechaValidada) {
      setVenceEditando((actuales) => {
        const copia = { ...actuales };
        delete copia[tarea._id];
        return copia;
      });

      setMensaje("Fecha no válida");

      setTimeout(() => {
        setMensaje("");
      }, 2000);

      return;
    }

    await cambiarVence(tarea, valor);

    setVenceEditando((actuales) => {
      const copia = { ...actuales };
      delete copia[tarea._id];
      return copia;
    });
  };

  const formatearVence = (fecha) => {
    if (!fecha) return "";

    const fechaObj = new Date(fecha);

    const dia = String(fechaObj.getDate()).padStart(2, "0");
    const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
    const año = fechaObj.getFullYear();

    const horas = String(fechaObj.getHours()).padStart(2, "0");
    const minutos = String(fechaObj.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  };

  const formatearEntradaVence = (valor) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 12);

    let resultado = "";

    if (numeros.length > 0) {
      resultado += numeros.slice(0, 2);
    }

    if (numeros.length >= 3) {
      resultado += "/" + numeros.slice(2, 4);
    }

    if (numeros.length >= 5) {
      resultado += "/" + numeros.slice(4, 8);
    }

    if (numeros.length >= 9) {
      resultado += " " + numeros.slice(8, 10);
    }

    if (numeros.length >= 11) {
      resultado += ":" + numeros.slice(10, 12);
    }

    return resultado;
  };

  const validarVence = (valor) => {
    const coincidencia = valor.match(
      /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/,
    );

    if (!coincidencia) {
      return null;
    }

    const dia = Number(coincidencia[1]);
    const mes = Number(coincidencia[2]);
    const año = Number(coincidencia[3]);
    const horas = Number(coincidencia[4]);
    const minutos = Number(coincidencia[5]);

    if (año !== 2026 && año !== 2027) {
      return null;
    }

    if (mes < 1 || mes > 12) {
      return null;
    }

    if (horas < 0 || horas > 23) {
      return null;
    }

    if (minutos < 0 || minutos > 59) {
      return null;
    }

    const diasDelMes = new Date(año, mes, 0).getDate();

    if (dia < 1 || dia > diasDelMes) {
      return null;
    }

    return {
      dia,
      mes,
      año,
      horas,
      minutos,
    };
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

  const abrirGrupo = (tarea) => {
    setTareaGrupo(tarea);
    setModalGrupo(true);
  };

  const actualizarDespuesDeGuardar = () => {
    setModalFormulario(false);
    setTareaEditar(null);
    cargarTareas();
  };

  const formatearSoloFecha = (fecha) => {
    if (!fecha) return "";

    return new Date(fecha).toLocaleDateString("es-CO", {
      dateStyle: "short",
    });
  };

  const venceHoyOAnterior = (fecha) => {
    if (!fecha) return false;

    const fechaVence = new Date(fecha);
    const hoy = new Date();

    fechaVence.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    return fechaVence <= hoy;
  };

  const obtenerPosicionTecnico = (tarea) => {
    if (!tarea.tecnico) return "";

    const tecnicoId =
      typeof tarea.tecnico === "object" ? tarea.tecnico._id : tarea.tecnico;

    const tareasDelTecnico = tareasFiltradas
      .filter((item) => {
        if (!item.tecnico) return false;

        const itemTecnicoId =
          typeof item.tecnico === "object" ? item.tecnico._id : item.tecnico;

        return itemTecnicoId === tecnicoId;
      })
      .sort((a, b) => new Date(a.vence) - new Date(b.vence));

    const posicion = tareasDelTecnico.findIndex(
      (item) => item._id === tarea._id,
    );

    return posicion === -1 ? "" : posicion + 1;
  };

  const guardarGrupo = async (nuevoGrupo) => {
    if (!tareaGrupo) return;

    try {
      const respuesta = await fetch(`${API_URL}/api/tareas/${tareaGrupo._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grupo: nuevoGrupo,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo actualizar el grupo");
      }

      setTareas((actuales) =>
        actuales.map((item) => (item._id === tareaGrupo._id ? datos : item)),
      );

      setModalGrupo(false);
      setTareaGrupo(null);
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo actualizar el grupo");
    }
  };
  const cambiarOrdenTecnico = async (tareaId, nuevoOrden) => {
    const orden = Number(nuevoOrden);

    if (!Number.isInteger(orden) || orden < 1) {
      return;
    }

    try {
      setActualizandoOrden(true);

      const respuesta = await fetch(`${API_URL}/api/tareas/${tareaId}/orden`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ordenTecnico: orden,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo cambiar la posición");
      }

      await cargarTareas();
    } catch (error) {
      console.error("Error cambiando orden:", error);
      alert(error.message);
    } finally {
      setActualizandoOrden(false);
    }
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
              <th>Estado</th>
              <th>Acción</th>
              <th className="columna-posicion">#</th>
              <th>Técnico</th>
              <th>Zona</th>
              <th>Solicitud</th>
              <th>Vence</th>
              <th>Instalación</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Teléfono 2</th>
              <th>IP Router</th>
              <th>IP Antena</th>
              <th>Plan</th>
              <th>Debe</th>
              <th>Valor</th>
              <th>Detalle</th>
              <th>DOC</th>
            </tr>
          </thead>

          <tbody>
            {tareasFiltradas.map((tarea) => {
              const telefonos = String(tarea.telefono || "")
                .split(",")
                .filter(Boolean);

              const colorEstado = obtenerColorEstado(tarea.zona, tarea.estado);

              const colorAccion = obtenerColorAccion(tarea.zona, tarea.accion);

              const estiloCliente = obtenerEstiloCliente(tarea.zona);

              return (
                <tr key={tarea._id}>
                  <td className="cliente-celda" style={estiloCliente}>
                    <button
                      type="button"
                      className="boton-icono boton-historial-icono"
                      onClick={() => abrirHistorial(tarea)}
                      title="Ver historial"
                      aria-label={`Ver historial de ${tarea.cliente}`}
                    >
                      <History size={16} />
                    </button>

                    <button
                      type="button"
                      className="boton-icono boton-editar-icono"
                      onClick={() => abrirEditar(tarea)}
                      title="Editar tarea"
                      aria-label={`Editar ${tarea.cliente}`}
                    >
                      <Pencil size={16} />
                    </button>

                    {Array.isArray(tarea.grupo) && tarea.grupo.length > 0 ? (
                      <button
                        type="button"
                        className="boton-cliente-grupo"
                        onClick={() => abrirGrupo(tarea)}
                        title="Editar otros clientes"
                      >
                        {tarea.cliente}
                      </button>
                    ) : (
                      <span>{tarea.cliente}</span>
                    )}
                  </td>

                  <td>
                    <select
                      className="boton-estado"
                      style={{
                        backgroundColor: colorEstado,
                        color: "#000000",
                      }}
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
                      className="boton-accion"
                      style={{
                        backgroundColor: colorAccion,
                        color: "#000000",
                      }}
                      value={tarea.accion}
                      onChange={(e) => cambiarAccion(tarea, e.target.value)}
                      disabled={
                        Array.isArray(tarea.grupo) && tarea.grupo.length > 0
                      }
                    >
                      {ACCIONES.map((accion) => (
                        <option key={accion} value={accion}>
                          {accion}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="soporte-orden">
                    {tarea.tecnico?._id && tarea.ordenTecnico ? (
                      <select
                        value={tarea.ordenTecnico}
                        onChange={(e) =>
                          cambiarOrdenTecnico(tarea._id, e.target.value)
                        }
                        disabled={actualizandoOrden}
                        className="soporte-orden-select"
                      >
                        {Array.from(
                          {
                            length:
                              cantidadTareasPorTecnico[tarea.tecnico._id] ||
                              tarea.ordenTecnico,
                          },
                          (_, indice) => indice + 1,
                        ).map((numero) => (
                          <option key={numero} value={numero}>
                            {numero}
                          </option>
                        ))}
                      </select>
                    ) : null}
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

                  <td>{formatearSoloFecha(tarea.solicitud)}</td>

                  <td>
                    <span
                      className={
                        venceHoyOAnterior(tarea.vence) ? "vence-vencido" : ""
                      }
                    >
                      {formatearSoloFecha(tarea.vence)}
                    </span>
                  </td>

                  <td>
                    <select
                      className={`boton-instalacion ${
                        tarea.instalacion === "Fibra óptica"
                          ? "instalacion-fibra"
                          : ""
                      }`}
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

                  <td>{tarea.plan}</td>

                  <td>
                    <select
                      className={`boton-debe ${tarea.debe ? "si" : "no"}`}
                      value={tarea.debe ? "Si" : "No"}
                      onChange={(e) =>
                        cambiarDebe(tarea, e.target.value === "Si")
                      }
                      disabled={
                        Array.isArray(tarea.grupo) && tarea.grupo.length > 0
                      }
                    >
                      <option value="No">No</option>
                      <option value="Si">Sí</option>
                    </select>
                  </td>

                  <td>{tarea.valor}</td>

                  <td>{tarea.detalle}</td>

                  <td>{tarea.doc || ""}</td>
                </tr>
              );
            })}

            {tareasFiltradas.length === 0 && (
              <tr>
                <td colSpan="19" className="sin-resultados">
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
        <div
          className="modal"
          onClick={() => {
            setModalHistorial(false);
            setTareaHistorial(null);
          }}
        >
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
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

      {modalGrupo && (
        <div className="modal">
          <div className="modal-contenido">
            <Grupo
              grupo={tareaGrupo?.grupo ?? []}
              onGuardarGrupo={guardarGrupo}
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default Soporte;
