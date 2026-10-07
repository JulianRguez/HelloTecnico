import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import "./Formulario.css";
import Grupo from "./Grupo";
import { calcularVence } from "../utils/fecha";
import NuevaTarea from "./NuevaTarea";
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

const ESTADOS_EDITABLES = ["Pendiente", "Pospuesto"];






function Formulario({ tarea, tecnicos = [], onGuardado, onCerrar }) {
  const [tareaEncontrada, setTareaEncontrada] = useState(null);

  const tareaActiva = tareaEncontrada || tarea;
  const editar = Boolean(tareaActiva);
  const finalizada =
  editar && ["Realizado", "Cancelado"].includes(tareaActiva?.estado);
  const bloqueado = editar && !ESTADOS_EDITABLES.includes(tareaActiva?.estado);

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
  const [modalNueva, setModalNueva] = useState(false);

  const textoGrupo = (formulario.grupo ?? [])
    .map((cliente) => cliente.nombre?.split(" ")[0])
    .filter(Boolean)
    .join(", ");
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  const nombreValido =
    formulario.cliente.length >= 7 && formulario.cliente.includes(" ");

  const puedeAgregarRevision = nombreValido && formulario.accion === "Revision";
  const tieneGrupo =
    Array.isArray(formulario.grupo) && formulario.grupo.length > 0;
    const teniaGrupoOriginal =
  editar &&
  Array.isArray(tareaActiva?.grupo) &&
  tareaActiva.grupo.length > 0;

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

  setFormulario((actual) => ({
    ...actual,
    [name]: value,
  }));
};

  const cargarNuevaTarea = (t) => {
    setTareaEncontrada(t);

    setFormulario({
      doc: t.doc ?? "",
      cliente: t.cliente ?? "",
      estado: t.estado ?? "Pendiente",
      accion: t.accion ?? "",
      direccion: t.direccion ?? "",
      zona: t.zona ?? "",
      telefono: t.telefono ?? "",
      telefono2: t.telefono2 ?? "",
      ip: t.ip ?? "",
      ip2: t.ip2 ?? "",
      instalacion: t.instalacion ?? "",
      plan: t.plan ?? "",
      debe: t.debe ?? false,
      valor: t.valor ?? 0,
      detalle: t.detalle ?? "",
      tecnico: t.tecnico?._id ?? t.tecnico ?? "",
      grupo: t.grupo ?? [],
    });

    setError("");
    setModalNueva(false);
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



    const guardar = async (e) => {
    e.preventDefault();

    setError("");

    // Una tarea Realizada o Cancelada no se puede modificar
    const tareaFinalizada =
      editar && ["Realizado", "Cancelado"].includes(tareaActiva?.estado);

    if (tareaFinalizada) return;

    // Comprobar cliente existente solamente al crear
    if (!editar) {
      try {
        const respuestaCliente = await fetch(
          `${API_URL}/api/tareas/cliente/${encodeURIComponent(formulario.cliente)}`,
        );

        if (respuestaCliente.ok) {
          // Limpia todo el formulario excepto el nombre del cliente
          setFormulario({
            doc: "",
            cliente: formulario.cliente,
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
            debe: false,
            valor: 0,
            detalle: "",
            tecnico: "",
            grupo: [],
          });

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

// Solo cuando pasa de cliente individual a grupo
const pasaAGrupo = tieneGrupoGuardar && !teniaGrupoOriginal;

if (pasaAGrupo) {
  clienteGuardar =
    `${formulario.accion}, ${formulario.zona}, ${formulario.direccion}`.toUpperCase();

  grupoGuardar = [
    {
      nombre: formulario.cliente,
      telefono: formulario.telefono,
      ip: formulario.ip,
      realizado: false,
    },
    ...grupoGuardar,
  ];
}

if (teniaGrupoOriginal && !clienteGuardar.startsWith("REVISION")) {
  setError('El nombre debe empezar por "REVISION".');
  return;
}

      // Validación DOC obligatorio para nuevas Instalaciones
      if (!editar && formulario.accion === "Instalacion" && !formulario.doc) {
        setError("El DOC es obligatorio para una Instalación.");
        return;
      }

      // Fechas: solo al crear. Al editar no se envían y quedan como están.
      let fechas = {};

      if (!editar) {
        const vence = await calcularVence(formulario.accion);

        if (!vence) {
          setError(
            "Seleccione una acción válida para calcular la fecha de vencimiento.",
          );
          return;
        }

        fechas = {
          solicitud: new Date().toISOString(),
          vence: vence.toISOString(),
        };
      }

      const cuerpo = {
        doc: formulario.doc === "" ? undefined : Number(formulario.doc),
        cliente: clienteGuardar,
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
        ...fechas,
        debe: formulario.debe,
        valor: Number(formulario.valor) || 0,
        detalle: formulario.detalle,
        tecnico: formulario.tecnico || null,
        grupo: grupoGuardar,
        ...(!editar && { creador: usuario?.nombre || "" }),
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
 


  const mensajeError = bloqueado
  ? "No puede editar una tarea Finalizada, haga clic en “Nueva tarea” para agendar un nuevo procedimiento."
  : error;

  return (
    <>

      <form className="formulario" onSubmit={guardar}>
        <div className="formulario-header">
          <h1 className="tittle">
            {editar ? "Editar Procedimiento" : "Nuevo Procedimiento"}
          </h1>

          <div className="formulario-botones">
            {finalizada ? (
              <button type="button" onClick={() => setModalNueva(true)}>
                Nueva tarea
              </button>
            ) : (
              <button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editar ? "Guardar" : "Crear"}
              </button>
            )}

            <button type="button" onClick={onCerrar} disabled={guardando}>
              Salir
            </button>
          </div>
        </div>

        {mensajeError && <div className="formulario-error">{mensajeError}</div>}
        <fieldset disabled={bloqueado} className="formulario-bloqueable">
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
                onChange={(e) => {
                const valor = e.target.value.toUpperCase();

                // Tarea con grupo: el nombre siempre debe empezar por REVISION
                if (teniaGrupoOriginal && !valor.startsWith("REVISION")) return;

                setFormulario({
                  ...formulario,
                  cliente: valor,
                });
              }}
                required
                readOnly={editar && !teniaGrupoOriginal}
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
              required={formulario.accion === "Revision"}
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
        </fieldset>

      </form>

      {modalGrupo && (
        <div className="modal-grupo">
          <div className="modal-grupo-contenido">
            <Grupo
              grupo={formulario.grupo}
              tareaId={tarea?._id}
              onGuardarGrupo={(nuevoGrupo) => {
                setFormulario((anterior) => ({
                  ...anterior,
                  grupo: nuevoGrupo,
                }));

                setModalGrupo(false);
              }}
              onDescartar={() => setModalGrupo(false)}
            />
          </div>
        </div>
      )}

      {modalNueva && (
  <div className="modal-grupo">
    <div className="modal-grupo-contenido">
      <NuevaTarea
        tarea={tareaActiva}
        onCerrar={() => setModalNueva(false)}
        onCreada={cargarNuevaTarea}
      />
    </div>
  </div>
)}
    </>
  );
}

export default Formulario;
