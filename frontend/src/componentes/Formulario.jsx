import { useEffect, useState } from "react";
import "./Formulario.css";
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

  return `${año}-${mes}-${dia}T${horas}:${minutos}`;
}

function Formulario({ tarea, tecnicos = [], onGuardado, onCerrar }) {
  const editar = Boolean(tarea);

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
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

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
        solicitud: "",
        vence: "",
        debe: false,
        valor: 0,
        detalle: "",
        tecnico: "",
      });
    }
  }, [tarea]);

  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const guardar = async (e) => {
    e.preventDefault();

    setError("");

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
      const cuerpo = {
        doc: formulario.doc === "" ? undefined : Number(formulario.doc),
        cliente: formulario.cliente,
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
        solicitud: formulario.solicitud
          ? new Date(formulario.solicitud).toISOString()
          : undefined,
        vence: formulario.vence
          ? new Date(formulario.vence).toISOString()
          : undefined,
        debe: formulario.debe,
        valor: Number(formulario.valor) || 0,
        detalle: formulario.detalle,
        tecnico: formulario.tecnico || null,
      };

      const url = editar
        ? `${API_URL}/api/tareas/${tarea._id}`
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

  return (
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
          />
        </div>

        <div className="campo">
          <label>Cliente</label>
          <input
            type="text"
            name="cliente"
            value={formulario.cliente}
            onChange={cambiarCampo}
            required
            readOnly={editar}
            minLength={8}
            maxLength={40}
          />
        </div>

        <div className="campo">
          <label>Estado</label>
          <select
            name="estado"
            value={formulario.estado}
            onChange={cambiarCampo}
            disabled
          >
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
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
            maxLength={50}
          />
        </div>

        <div className="campo">
          <label>Zona</label>
          <select
            name="zona"
            value={formulario.zona}
            onChange={cambiarCampo}
            required
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
          />
        </div>

        <div className="campo">
          <label>Solicitud</label>
          <input
            type="datetime-local"
            name="solicitud"
            value={formulario.solicitud}
            onChange={cambiarCampo}
            required
            disabled={editar}
          />
        </div>

        <div className="campo">
          <label>Vence</label>
          <input
            type="datetime-local"
            name="vence"
            value={formulario.vence}
            onChange={cambiarCampo}
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
            min="0"
            max="1000000"
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
  );
}

export default Formulario;
