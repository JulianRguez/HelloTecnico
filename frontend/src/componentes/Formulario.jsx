import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import "./Formulario.css";
import Grupo from "./Grupo";
const API_URL = import.meta.env.VITE_API_URL || "";

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

const ZONAS = [
  "Antioquia",
  "Paso",
  "San Nicolas",
  "Filadelfia",
  "Tunal",
  "San Jeronimo",
  "Piñones",
  "Llanadas",
  "Quebrada Seca",
  "Sucre",
  "Liborina",
];

function convertirFechaLocal(fecha) {
  if (!fecha) return "";

  const d = new Date(fecha);

  const año = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  const horas = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${año} ${horas}:${minutos}`;
}

function obtenerFechaHoraActual() {
  const ahora = new Date();

  const dia = String(ahora.getDate()).padStart(2, "0");
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const año = ahora.getFullYear();
  const horas = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${año} ${horas}:${minutos}`;
}

function Formulario({ tarea, tecnicos = [], onGuardado, onCerrar }) {
  const [tareaEncontrada, setTareaEncontrada] = useState(null);

  const tareaActiva = tareaEncontrada || tarea;
  const editar = Boolean(tareaActiva);

  const [formulario, setFormulario] = useState({
    doc: "",
    cliente: "",
    estado: "Pendiente",
    accion: "",
    direccion: "",
    zona: "",
    telefono: "",
    telefono2: "",
    ip: "",
    ip2: "",
    instalacion: "",
    plan: "",
    solicitud: "",
    vence: "",
    debe: false,
    valor: 0,
    detalle: "",
    tecnico: "",
    grupo: [],
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [modalGrupo, setModalGrupo] = useState(false);

  const textoGrupo = (formulario.grupo ?? [])
    .map((cliente) => cliente.nombre?.split(" ")[0])
    .filter(Boolean)
    .join(", ");

  const nombreValido =
    formulario.cliente.length >= 7 && formulario.cliente.includes(" ");

  const puedeAgregarRevision = nombreValido && formulario.accion === "Revision";
  const tieneGrupo =
    Array.isArray(formulario.grupo) && formulario.grupo.length > 0;

  useEffect(() => {
    if (tarea) {
      setFormulario({
        doc: tarea.doc ?? "",
        cliente: tarea.cliente ?? "",
        estado: tarea.estado ?? "Pendiente",
        accion: tarea.accion ?? "",
        direccion: tarea.direccion ?? "",
        zona: tarea.zona ?? "",
        telefono: tarea.telefono ?? "",
        telefono2: tarea.telefono2 ?? "",
        ip: tarea.ip ?? "",
        ip2: tarea.ip2 ?? "",
        instalacion: tarea.instalacion ?? "",
        plan: tarea.plan ?? "",
        solicitud: convertirFechaLocal(tarea.solicitud),
        vence: convertirFechaLocal(tarea.vence),
        debe: tarea.debe ?? false,
        valor: tarea.valor ?? 0,
        detalle: tarea.detalle ?? "",
        tecnico: tarea.tecnico?._id ?? tarea.tecnico ?? "",
        grupo: tarea.grupo ?? [],
      });
    } else {
      setFormulario({
        doc: "",
        cliente: "",
        estado: "Pendiente",
        accion: "",
        direccion: "",
        zona: "",
        telefono: "",
        telefono2: "",
        ip: "",
        ip2: "",
        instalacion: "",
        plan: "",
        solicitud: obtenerFechaHoraActual(),
        vence: "",
        debe: false,
        valor: 0,
        detalle: "",
        tecnico: "",
        grupo: [],
      });
    }
  }, [tarea]);

  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    if (name === "solicitud" || name === "vence") {
      const valorFormateado = formatearEntradaFecha(value);

      setFormulario((actual) => ({
        ...actual,
        [name]: valorFormateado,
      }));

      return;
    }

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const buscarCliente = async () => {
    if (buscandoCliente) return;

    setError("");

    const nombre = formulario.cliente;

    if (nombre.length < 7 || !nombre.includes(" ")) {
      setError("El formato de nombre y apellidos no es correcto");
      return;
    }

    setBuscandoCliente(true);

    try {
      // --------------------------------------------------
      // 1. Buscar primero en MongoDB
      // --------------------------------------------------
      const respuestaMongo = await fetch(
        `${API_URL}/api/tareas/cliente/${encodeURIComponent(nombre)}`,
      );

      if (respuestaMongo.ok) {
        const tareaEncontradaMongo = await respuestaMongo.json();

        setTareaEncontrada(tareaEncontradaMongo);

        setFormulario({
          doc: tareaEncontradaMongo.doc ?? "",
          cliente: tareaEncontradaMongo.cliente ?? "",
          estado: tareaEncontradaMongo.estado ?? "Pendiente",
          accion: tareaEncontradaMongo.accion ?? "",
          direccion: tareaEncontradaMongo.direccion ?? "",
          zona: tareaEncontradaMongo.zona ?? "",
          telefono: tareaEncontradaMongo.telefono ?? "",
          telefono2: tareaEncontradaMongo.telefono2 ?? "",
          ip: tareaEncontradaMongo.ip ?? "",
          ip2: tareaEncontradaMongo.ip2 ?? "",
          instalacion: tareaEncontradaMongo.instalacion ?? "",
          plan: tareaEncontradaMongo.plan ?? "",
          solicitud: convertirFechaLocal(tareaEncontradaMongo.solicitud),
          vence: convertirFechaLocal(tareaEncontradaMongo.vence),
          debe: tareaEncontradaMongo.debe ?? false,
          valor: tareaEncontradaMongo.valor ?? 0,
          detalle: tareaEncontradaMongo.detalle ?? "",
          tecnico:
            tareaEncontradaMongo.tecnico?._id ??
            tareaEncontradaMongo.tecnico ??
            "",
          grupo: tareaEncontradaMongo.grupo ?? [],
        });

        return;
      }

      // Si Mongo devuelve algo diferente de 404, hubo otro problema
      if (respuestaMongo.status !== 404) {
        setError("No se pudo buscar el cliente en MongoDB");
        return;
      }

      // --------------------------------------------------
      // 2. No existe en MongoDB → buscar en Google Sheets
      // --------------------------------------------------
      setTareaEncontrada(null);

      const respuestaExcel = await fetch(
        `${API_URL}/api/tareas/cliente-excel/${encodeURIComponent(nombre)}`,
      );

      if (respuestaExcel.ok) {
        const datosExcel = await respuestaExcel.json();

        setFormulario({
          doc: "",
          cliente: nombre,
          estado: "Pendiente",
          accion: "",
          direccion: datosExcel.direccion ?? "",
          zona: "",
          telefono: datosExcel.telefono ?? "",
          telefono2: "",
          ip: datosExcel.ip ?? "",
          ip2: datosExcel.ip2 ?? "",
          instalacion: "",
          plan: datosExcel.plan ?? "",
          solicitud: obtenerFechaHoraActual(),
          vence: "",
          debe: false,
          valor: 0,
          detalle: "",
          tecnico: "",
          grupo: [],
        });

        return;
      }

      // --------------------------------------------------
      // 3. No existe ni en Mongo ni en Google Sheets
      // --------------------------------------------------
      if (respuestaExcel.status === 404) {
        setError(
          "Ese nombre no existe o está mal escrito, la coincidencia debe ser exacta",
        );
        return;
      }

      setError("No se pudo buscar el cliente en Google Sheets");
    } catch (error) {
      console.error("Error buscando cliente:", error);
      setError("No se pudo realizar la búsqueda del cliente");
    } finally {
      setBuscandoCliente(false);
    }
  };

  function convertirFechaParaBackend(valor) {
    const fecha = validarFechaFormulario(valor);

    if (!fecha) {
      return null;
    }

    const { dia, mes, año, horas, minutos } = fecha;

    return new Date(año, mes - 1, dia, horas, minutos).toISOString();
  }

  const guardar = async (e) => {
    e.preventDefault();

    setError("");

    const solicitudValida = validarFechaFormulario(formulario.solicitud);
    const venceValida = validarFechaFormulario(formulario.vence);

    if (!solicitudValida) {
      setError("La fecha de Solicitud no es válida");
      return;
    }

    if (!venceValida) {
      setError("La fecha de Vence no es válida");
      return;
    }

    // Comprobar cliente existente solamente al crear
    if (!editar) {
      try {
        const respuestaCliente = await fetch(
          `${API_URL}/api/tareas/cliente/${encodeURIComponent(formulario.cliente)}`,
        );

        if (respuestaCliente.ok) {
          setError(
            "Este cliente ya existe. Puede buscarlo en el listado y editarlo o usar otro nombre.",
          );
          return;
        }

        if (respuestaCliente.status !== 404) {
          setError("No se pudo comprobar si el cliente ya existe.");
          return;
        }
      } catch (error) {
        console.error(error);
        setError("No se pudo comprobar si el cliente ya existe.");
        return;
      }
    }

    setGuardando(true);

    try {
      let clienteGuardar = (formulario.cliente || "").toUpperCase();
      let grupoGuardar = formulario.grupo ?? [];

      const tieneGrupoGuardar =
        Array.isArray(grupoGuardar) && grupoGuardar.length > 0;

      const clienteGrupo =
        `${formulario.accion}, ${formulario.zona}, ${formulario.direccion}`.toUpperCase();

      if (tieneGrupoGuardar && formulario.cliente !== clienteGrupo) {
        grupoGuardar = [
          {
            nombre: formulario.cliente,
            telefono: formulario.telefono,
            ip: formulario.ip,
          },
          ...grupoGuardar,
        ];

        clienteGuardar = clienteGrupo;
      }

      // Validación DOC obligatorio para nuevas Instalaciones
      if (!editar && formulario.accion === "Instalacion" && !formulario.doc) {
        setError("El DOC es obligatorio para una Instalación.");
        return;
      }

      const cuerpo = {
        doc: formulario.doc === "" ? undefined : Number(formulario.doc),
        cliente: clienteGuardar,
        estado: formulario.estado,
        accion: formulario.accion,
        direccion: formulario.direccion,
        zona: formulario.zona,
        telefono: formulario.telefono,
        telefono2: formulario.telefono2 || undefined,
        ip: formulario.ip,
        ip2: formulario.ip2 || null,
        instalacion: formulario.instalacion,
        plan: formulario.plan,
        solicitud: convertirFechaParaBackend(formulario.solicitud),
        vence: convertirFechaParaBackend(formulario.vence),
        debe: formulario.debe,
        valor: Number(formulario.valor) || 0,
        detalle: formulario.detalle,
        tecnico: formulario.tecnico || null,
        grupo: grupoGuardar,
      };

      const url = editar
        ? `${API_URL}/api/tareas/${tareaActiva._id}`
        : `${API_URL}/api/tareas`;

      const respuesta = await fetch(url, {
        method: editar ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cuerpo),
      });

      const texto = await respuesta.text();

      let datos = {};

      try {
        datos = texto ? JSON.parse(texto) : {};
      } catch {
        datos = {};
      }

      if (!respuesta.ok) {
        throw new Error(
          datos.error
            ? `${datos.mensaje}: ${datos.error}`
            : datos.mensaje || "No se pudo guardar la tarea",
        );
      }

      onGuardado(datos);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  };
  function formatearEntradaFecha(valor) {
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
  }

  function validarFechaFormulario(valor) {
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
  }

  const validarCampoFecha = (e) => {
    const { name, value } = e.target;

    if (name !== "solicitud" && name !== "vence") {
      return;
    }

    if (!validarFechaFormulario(value)) {
      setError(
        `${name === "solicitud" ? "Solicitud" : "Vence"}: fecha no válida`,
      );

      return;
    }

    setError("");
  };

  return (
    <>
      <form className="formulario" onSubmit={guardar}>
        <div className="formulario-header">
          <h1 className="tittle">
            {editar ? "Editar Procedimiento" : "Nuevo Procedimiento"}
          </h1>

          <div className="formulario-botones">
            <button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : editar ? "Guardar" : "Crear"}
            </button>

            <button type="button" onClick={onCerrar} disabled={guardando}>
              Salir
            </button>
          </div>
        </div>

        {error && <div className="formulario-error">{error}</div>}

        <div className="formulario-grid">
          <div className="campo">
            <label>DOC</label>
            <input
              type="text"
              name="doc"
              value={formulario.doc}
              onChange={cambiarCampo}
              minLength={5}
              maxLength={12}
              disabled={editar && tieneGrupo}
            />
          </div>

          <div className="campo campo-cliente">
            <label>Cliente</label>

            <div className="cliente-busqueda">
              <input
                type="text"
                name="cliente"
                value={formulario.cliente}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    cliente: e.target.value.toUpperCase(),
                  })
                }
                required
                readOnly={editar}
                minLength={8}
                maxLength={40}
              />

              <button
                type="button"
                className="boton-buscar-cliente"
                onClick={buscarCliente}
                disabled={editar || buscandoCliente}
                title={buscandoCliente ? "Buscando..." : "Buscar cliente"}
                aria-label={
                  buscandoCliente ? "Buscando cliente" : "Buscar cliente"
                }
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          <div className="campo">
            <label>Otros clientes</label>
            <button
              type="button"
              className="campo-grupo"
              disabled={!puedeAgregarRevision}
              onClick={() => setModalGrupo(true)}
            >
              {puedeAgregarRevision ? textoGrupo : "Función no disponible"}
            </button>
          </div>

          <div className="campo">
            <label>Acción</label>
            <select
              name="accion"
              value={formulario.accion}
              onChange={cambiarCampo}
              required
              disabled={editar}
            >
              <option value="">Seleccione...</option>

              {ACCIONES.map((accion) => (
                <option key={accion} value={accion}>
                  {accion}
                </option>
              ))}
            </select>
          </div>

          <div className="campo campo-ancho">
            <label>Dirección</label>
            <input
              type="text"
              name="direccion"
              value={formulario.direccion}
              onChange={cambiarCampo}
              required
              minLength={8}
              maxLength={32}
              disabled={editar && tieneGrupo}
            />
          </div>

          <div className="campo">
            <label>Zona</label>
            <select
              name="zona"
              value={formulario.zona}
              onChange={cambiarCampo}
              required
              disabled={editar && tieneGrupo}
            >
              <option value="">Seleccione...</option>

              {ZONAS.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={formulario.telefono}
              onChange={cambiarCampo}
              minLength={7}
              maxLength={15}
              required
              disabled={editar && tieneGrupo}
            />
          </div>

          <div className="campo">
            <label>Teléfono 2</label>
            <input
              type="text"
              name="telefono2"
              value={formulario.telefono2}
              onChange={cambiarCampo}
              minLength={7}
              maxLength={15}
              disabled={editar && tieneGrupo}
            />
          </div>

          <div className="campo">
            <label>IP Router</label>
            <input
              type="text"
              name="ip"
              value={formulario.ip}
              onChange={cambiarCampo}
              pattern="^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$"
              title="Ingrese una dirección IPv4 válida. Ejemplo: 192.168.1.10"
              disabled={editar && tieneGrupo}
            />
          </div>

          <div className="campo">
            <label>IP Antena</label>
            <input
              type="text"
              name="ip2"
              value={formulario.ip2}
              onChange={cambiarCampo}
              pattern="^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$"
              title="Ingrese una dirección IPv4 válida. Ejemplo: 192.168.1.10"
              disabled={editar && tieneGrupo}
            />
          </div>

          <div className="campo">
            <label>Instalación</label>
            <select
              name="instalacion"
              value={formulario.instalacion}
              onChange={cambiarCampo}
              required
              disabled={editar}
            >
              <option value="">Seleccione...</option>

              {INSTALACIONES.map((instalacion) => (
                <option key={instalacion} value={instalacion}>
                  {instalacion}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Plan</label>
            <input
              type="text"
              name="plan"
              value={formulario.plan}
              onChange={cambiarCampo}
              minLength={5}
              maxLength={30}
              disabled={editar && tieneGrupo}
            />
          </div>

          <div className="campo">
            <label>Solicitud</label>
            <input
              type="text"
              name="solicitud"
              value={formulario.solicitud}
              onChange={cambiarCampo}
              onBlur={validarCampoFecha}
              placeholder="DD/MM/AAAA HH:MM"
              inputMode="numeric"
              maxLength={16}
              required
              disabled={editar}
            />
          </div>

          <div className="campo">
            <label>Vence</label>
            <input
              type="text"
              name="vence"
              value={formulario.vence}
              onChange={cambiarCampo}
              onBlur={validarCampoFecha}
              placeholder="DD/MM/AAAA HH:MM"
              inputMode="numeric"
              maxLength={16}
              required
              disabled={editar}
            />
          </div>

          <div className="campo">
            <label>Debe</label>
            <select
              name="debe"
              value={formulario.debe ? "Si" : "No"}
              onChange={(e) =>
                setFormulario((actual) => ({
                  ...actual,
                  debe: e.target.value === "Si",
                }))
              }
              disabled={editar}
            >
              <option value="No">No</option>
              <option value="Si">Sí</option>
            </select>
          </div>

          <div className="campo">
            <label>Valor</label>
            <input
              type="number"
              name="valor"
              value={formulario.valor}
              onChange={cambiarCampo}
              onBlur={() => {
                if (!editar) {
                  setFormulario((actual) => ({
                    ...actual,
                    debe: true,
                  }));
                }
              }}
              min="0"
              max="1000000"
              disabled={editar && tieneGrupo}
            />
          </div>

          <div className="campo">
            <label>Técnico</label>

            <select
              name="tecnico"
              value={formulario.tecnico}
              onChange={cambiarCampo}
              disabled={editar}
            >
              <option value="">Sin asignar</option>

              {tecnicos.map((tecnico) => (
                <option key={tecnico._id} value={tecnico._id}>
                  {tecnico.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo campo-ancho">
            <label>Detalle</label>
            <input
              type="text"
              name="detalle"
              value={formulario.detalle}
              onChange={cambiarCampo}
              minLength={7}
              maxLength={80}
            />
          </div>
        </div>
      </form>

      {modalGrupo && (
        <div className="modal-grupo">
          <div className="modal-grupo-contenido">
            <Grupo
              grupo={formulario.grupo}
              onGuardarGrupo={(nuevoGrupo) => {
                setFormulario((anterior) => ({
                  ...anterior,
                  grupo: nuevoGrupo,
                }));

                setModalGrupo(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Formulario;
