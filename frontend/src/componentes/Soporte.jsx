import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import useInactividad from "../hooks/useInactividad";
import { Star, Pencil } from "lucide-react";
import Formulario from "./Formulario";
import Grupo from "./Grupo";
import "./Soporte.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ESTADOS = ["Pendiente", "Realizado", "Cancelado", "Pospuesto", "Cerrado"];

// Estados en los que la tarea todavía se puede modificar
const ESTADOS_ABIERTOS = ["Pendiente", "Pospuesto"];

// Estados que se pueden elegir en el desplegable (Cerrado ya no se usa)
const ESTADOS_CAMBIABLES = ["Pendiente", "Realizado", "Cancelado", "Pospuesto"];

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
  Antioquia: ["#a8c2f1", "#cfdef5", "#bcd1fa", "#e3eef4", "#95b5e3"],

  Paso: ["#f1a8a8", "#f5cfcf", "#fabcbc", "#f4e3e3", "#e39595"],

  "San Nicolas": ["#c7cecb", "#e3e7e5", "#d5dbd9", "#f0f3f2", "#b8c2be"],

  Filadelfia: ["#f1c1a8", "#f5dfcf", "#fad1bc", "#f4ebe3", "#e3b095"],

  Tunal: ["#a8d8ce", "#cfeae5", "#bce1da", "#e3f4f1", "#95cfc3"],

  "San Jeronimo": ["#cca8f1", "#e3cff5", "#dbbcfa", "#ede3f4", "#be95e3"],

  Piñones: ["#f1eea8", "#f5f0cf", "#faf9bc", "#f4f2e3", "#e3df95"],

  Llanadas: ["#f1eea8", "#f5f0cf", "#faf9bc", "#f4f2e3", "#e3df95"],

  "Quebrada Seca": ["#f1c1a8", "#f5dfcf", "#fad1bc", "#f4ebe3", "#e3b095"],

  Sucre: ["#a8d8ce", "#cfeae5", "#bce1da", "#e3f4f1", "#95cfc3"],

  Liborina: ["#cca8f1", "#e3cff5", "#dbbcfa", "#ede3f4", "#be95e3"],
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

/* =========================================================
   COLORES POR TÉCNICO
   Cada técnico recibe un color pastel distinto.
   El primero es el verde que ya usabas.
   ========================================================= */

const PALETA_TECNICOS = [
  { fondo: "#9fd8c8", texto: "#16866d", borde: "#b8e8dc" }, // verde
  { fondo: "#a9c8f0", texto: "#1f5fa8", borde: "#c3d9f5" }, // azul
  { fondo: "#f5e08a", texto: "#8a6a00", borde: "#f7e9a8" }, // amarillo
  { fondo: "#f7bd8a", texto: "#b25a00", borde: "#f9d0ab" }, // naranja
  { fondo: "#f4b0c8", texto: "#a8325f", borde: "#f8c8d9" }, // rosado
  { fondo: "#cfb0ec", texto: "#6a3fa0", borde: "#dcc7f2" }, // morado
  { fondo: "#9adbe8", texto: "#1a7286", borde: "#b5e5ee" }, // turquesa
  { fondo: "#f4a8a0", texto: "#a63a30", borde: "#f7c2bc" }, // coral
  { fondo: "#cfe58f", texto: "#547a0e", borde: "#ddedb0" }, // lima
  { fondo: "#b7c3d6", texto: "#445570", borde: "#ccd5e3" }, // gris azulado
];

const obtenerEstiloTecnico = (tecnicoId, tecnicos) => {
  if (!tecnicoId) return undefined;

  // Se ordenan los _id para que el color de cada técnico no cambie
  // aunque la lista llegue en otro orden. Los técnicos nuevos van al final.
  const ids = tecnicos.map((tecnico) => tecnico._id).sort();
  const posicion = ids.indexOf(tecnicoId);

  if (posicion === -1) return undefined; // usa el verde del CSS

  const color = PALETA_TECNICOS[posicion % PALETA_TECNICOS.length];

  return {
    backgroundColor: color.fondo,
    color: color.texto,
    borderColor: color.borde,
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
  const [modalGrupo, setModalGrupo] = useState(false);
  const [tareaGrupo, setTareaGrupo] = useState(null);
  const [clienteTooltip, setClienteTooltip] = useState(null);
  // Cierra la sesión tras 5 minutos sin interacción
  useInactividad(5, () => {
    sessionStorage.removeItem("usuario");
    navigate("/", { replace: true });
  });
  if (!usuario || usuario.perfil !== "Soporte") {
    return <Navigate to="/" replace />;
  }

  const cantidadTareasPorTecnico = todasLasTareas.reduce((conteo, tarea) => {
    if (tarea.tecnico?._id) {
      conteo[tarea.tecnico._id] = (conteo[tarea.tecnico._id] || 0) + 1;
    }

    return conteo;
  }, {});

  const cargarTareas = async (silencioso = false) => {
  try {
    if (!silencioso) {
      setCargando(true);
      setMensaje("");
    }

    const respuesta = await fetch(`${API_URL}/api/tareas`);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.mensaje || "No se pudieron obtener las tareas");
    }

    setTodasLasTareas(datos);
    setTareas(datos);
  } catch (error) {
    console.error(error);
    if (!silencioso) setMensaje("No fue posible cargar las tareas");
  } finally {
    if (!silencioso) setCargando(false);
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

  useEffect(() => {
  const eventos = new EventSource(`${API_URL}/api/eventos`);
  let temporizador = null;
  let yaSeConecto = false;

  // Agrupa varios avisos seguidos en una sola recarga
  const recargar = () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => cargarTareas(true), 300);
  };

  eventos.addEventListener("tareas", recargar);

  // Si la conexión se cayó y volvió, recarga por si se perdió algún aviso
  eventos.onopen = () => {
    if (yaSeConecto) recargar();
    yaSeConecto = true;
  };

  return () => {
    clearTimeout(temporizador);
    eventos.close();
  };
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

      const eliminarTarea = async (tarea) => {
      try {
        const respuesta = await fetch(`${API_URL}/api/tareas/${tarea._id}`, {
          method: "DELETE",
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.mensaje || "No se pudo eliminar la tarea");
        }

        const quitar = (actuales) =>
          actuales.filter((item) => item._id !== tarea._id);

        setTareas(quitar);
        setTodasLasTareas(quitar);
      } catch (error) {
        console.error(error);
        setMensaje("No se pudo eliminar la tarea");
      }
      };

    const cambiarEstado = async (tarea, nuevoEstado) => {
    if (nuevoEstado === "Eliminar") {
      await eliminarTarea(tarea);
      return;
    }
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

const alternarMarcado = async (tarea) => {
  const nuevoValor = !tarea.marcado;

  const aplicar = (valor) => (actuales) =>
    actuales.map((item) =>
      item._id === tarea._id ? { ...item, marcado: valor } : item,
    );

  // Cambio inmediato en pantalla
  setTareas(aplicar(nuevoValor));

  try {
    const respuesta = await fetch(
      `${API_URL}/api/tareas/${tarea._id}/marcado`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marcado: nuevoValor }),
      },
    );

    if (!respuesta.ok) {
      throw new Error("No se pudo actualizar el marcado");
    }
  } catch (error) {
    console.error(error);

    // Si falló, vuelve al valor anterior
    setTareas(aplicar(!nuevoValor));
    setMensaje("No se pudo actualizar el marcado");
  }
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

  const obtenerTextoHistorial = (registro) => {
    if (registro === null || registro === undefined) {
      return "";
    }

    if (typeof registro === "string") {
      return registro;
    }

    if (typeof registro === "object") {
      // Si el registro es un objeto, intentamos mostrar
      // su contenido de una manera legible.
      return (
        registro.detalle ||
        registro.texto ||
        registro.descripcion ||
        JSON.stringify(registro)
      );
    }

    return String(registro);
  };

  const mostrarTooltipCliente = (tarea, evento) => {
    const detalle =
      tarea.detalle !== null &&
      tarea.detalle !== undefined &&
      String(tarea.detalle).trim() !== ""
        ? String(tarea.detalle).trim()
        : "";

    const historial = Array.isArray(tarea.historial)
      ? tarea.historial
          .map(obtenerTextoHistorial)
          .map((texto) => texto.trim())
          .filter(Boolean)
      : [];

    // Si no hay nada que mostrar, no mostramos el globo.
    if (!detalle && historial.length === 0) {
      setClienteTooltip(null);
      return;
    }

    setClienteTooltip({
      tareaId: tarea._id,
      detalle,
      historial,
      x: evento.clientX + 14,
      y: evento.clientY + 14,
    });
  };

  const moverTooltipCliente = (evento) => {
    setClienteTooltip((actual) => {
      if (!actual) return null;

      return {
        ...actual,
        x: evento.clientX + 14,
        y: evento.clientY + 14,
      };
    });
  };

  const ocultarTooltipCliente = () => {
    setClienteTooltip(null);
  };

  return (
    <main className="soporte">
      <header className="soporte-header">
        <div>
          <h1>Soporte</h1>
          <p>Bienvenido, {usuario.nombre}</p>
        </div>

        <div className="soporte-header-botones">
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
              <th>Vence</th>
              <th>IP Router</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Teléfono 2</th>
              <th>IP Antena</th>
              <th>Plan</th>
              <th>Debe</th>
              <th>Valor</th>
              <th>Solicitud</th>
              <th>Instalación</th>
              <th>Detalle</th>
              <th>DOC</th>
              <th>Autor</th>
            </tr>
          </thead>

          <tbody>
            {tareasFiltradas.map((tarea) => {
              const telefonos = String(tarea.telefono || "")
                .split(",")
                .filter(Boolean);

              const colorEstado = obtenerColorEstado(tarea.zona, tarea.estado);

              const estadoAbierto = ESTADOS_ABIERTOS.includes(tarea.estado);

              const colorAccion = obtenerColorAccion(tarea.zona, tarea.accion);

              const estiloCliente = obtenerEstiloCliente(tarea.zona);

              const estiloTecnico = obtenerEstiloTecnico(tarea.tecnico?._id, tecnicos);

              return (
                <tr key={tarea._id}>
                  <td className="cliente-celda" style={estiloCliente}>
                    <button
                      type="button"
                      className={`boton-icono boton-marcado-icono ${
                        tarea.marcado ? "si" : "no"
                      }`}
                      onClick={() => alternarMarcado(tarea)}
                      title={tarea.marcado ? "Quitar prioridad" : "Marcar como prioritario"}
                      aria-label={
                        tarea.marcado
                          ? `Quitar prioridad de ${tarea.cliente}`
                          : `Marcar ${tarea.cliente} como prioritario`
                      }
                    >
                      <Star size={16} />
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
                        className="boton-cliente-grupo cliente-con-tooltip"
                        onClick={() => abrirGrupo(tarea)}
                        onMouseEnter={(e) => mostrarTooltipCliente(tarea, e)}
                        onMouseMove={moverTooltipCliente}
                        onMouseLeave={ocultarTooltipCliente}
                        title="Editar otros clientes"
                      >
                        {tarea.cliente}
                      </button>
                    ) : (
                      <span
                        className="cliente-con-tooltip"
                        onMouseEnter={(e) => mostrarTooltipCliente(tarea, e)}
                        onMouseMove={moverTooltipCliente}
                        onMouseLeave={ocultarTooltipCliente}
                      >
                        {tarea.cliente}
                      </span>
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
                        {(estadoAbierto ? ESTADOS_CAMBIABLES : [tarea.estado]).map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}

                        <option value="Eliminar">Eliminar</option>
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
                        !estadoAbierto ||
                        (Array.isArray(tarea.grupo) && tarea.grupo.length > 0)
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
                      style={estiloTecnico}
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
                    <button
                      type="button"
                      className={tarea.ip ? "boton-ip" : "boton-ip vacio"}
                      onClick={() => copiar(tarea.ip)}
                      disabled={!tarea.ip}
                    >
                      {tarea.ip || ""}
                    </button>
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

                  <td>{formatearSoloFecha(tarea.solicitud)}</td>

                  <td>
                    <select
                      className={`boton-instalacion ${
                        tarea.instalacion === "Fibra óptica"
                          ? "instalacion-fibra"
                          : ""
                      }`}
                      value={tarea.instalacion}
                      disabled={!estadoAbierto}
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

                  <td>{tarea.detalle}</td>

                  <td>{tarea.doc || ""}</td>
                  <td>{tarea.creador || ""}</td>
                </tr>
              );
            })}

            {clienteTooltip && (
              <div
                className="cliente-tooltip"
                style={{
                  left: `${clienteTooltip.x}px`,
                  top: `${clienteTooltip.y}px`,
                }}
              >
                {clienteTooltip.detalle && (
                  <div className="cliente-tooltip-detalle">
                    {clienteTooltip.detalle}
                  </div>
                )}

                {clienteTooltip.historial.map((registro, indice) => (
                  <div
                    key={`${clienteTooltip.tareaId}-historial-${indice}`}
                    className="cliente-tooltip-historial"
                  >
                    {registro}
                  </div>
                ))}
              </div>
            )}

            {tareasFiltradas.length === 0 && (
              <tr>
                <td colSpan="20" className="sin-resultados">
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


      {modalGrupo && (
  <div className="modal">
    <div className="modal-contenido">
      <Grupo
        grupo={tareaGrupo?.grupo ?? []}
        tareaId={tareaGrupo?._id}
        onGuardarGrupo={guardarGrupo}
        onDescartar={() => {
          setModalGrupo(false);
          setTareaGrupo(null);
        }}
      />
    </div>
  </div>
)}

    </main>
  );
}

export default Soporte;
