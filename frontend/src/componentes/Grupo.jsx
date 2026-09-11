import { useState } from "react";
import { Search, X } from "lucide-react";
import "./Grupo.css";

const API_URL = import.meta.env.VITE_API_URL || "";

function Grupo({ grupo = [], onGuardarGrupo }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ip, setIp] = useState("");
  const [listaGrupo, setListaGrupo] = useState(grupo ?? []);

  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // VALIDACIONES
  // --------------------------------------------------

  const nombreValido = nombre.trim().length >= 7 && nombre.trim().includes(" ");

  const telefonoValido = telefono.length >= 7 && telefono.length <= 13;

  const ipValida = validarIPv4(ip);

  const formularioValido = nombreValido && telefonoValido && ipValida;

  // --------------------------------------------------
  // VALIDAR IPv4
  // --------------------------------------------------

  function validarIPv4(valor) {
    const partes = valor.trim().split(".");

    if (partes.length !== 4) {
      return false;
    }

    return partes.every((parte) => {
      if (!/^\d{1,3}$/.test(parte)) {
        return false;
      }

      const numero = Number(parte);

      return numero >= 0 && numero <= 255;
    });
  }

  // --------------------------------------------------
  // BUSCAR CLIENTE EN EXCEL
  // --------------------------------------------------

  const buscarCliente = async () => {
    if (buscandoCliente) return;

    setError("");

    const nombreBuscado = nombre.trim();

    if (!nombreValido) {
      setError("El formato de nombre y apellidos no es correcto");
      return;
    }

    setBuscandoCliente(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/tareas/cliente-excel/${encodeURIComponent(
          nombreBuscado,
        )}`,
      );

      if (respuesta.ok) {
        const datosExcel = await respuesta.json();

        setNombre(nombreBuscado);
        setTelefono(datosExcel.telefono ?? "");
        setIp(datosExcel.ip ?? "");

        return;
      }

      if (respuesta.status === 404) {
        setError("Cliente no encontrado en el Excel");
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

  // --------------------------------------------------
  // AGREGAR CLIENTE
  // --------------------------------------------------

  const agregarCliente = () => {
    if (!formularioValido) {
      return;
    }

    const nuevoCliente = {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      ip: ip.trim(),
    };

    setListaGrupo((actual) => [...actual, nuevoCliente]);

    setNombre("");
    setTelefono("");
    setIp("");
    setError("");
  };

  // --------------------------------------------------
  // ELIMINAR CLIENTE
  // --------------------------------------------------

  const eliminarCliente = (indice) => {
    setListaGrupo((actual) =>
      actual.filter((_, posicion) => posicion !== indice),
    );
  };

  // --------------------------------------------------
  // COPIAR IP
  // --------------------------------------------------

  const copiarIP = async (valor) => {
    if (!valor) return;

    try {
      await navigator.clipboard.writeText(valor);
    } catch (error) {
      console.error("No fue posible copiar la IP:", error);
    }
  };

  return (
    <div className="grupo">
      <h2>Otros clientes</h2>

      {/* -------------------------------------------- */}
      {/* FORMULARIO PARA AGREGAR */}
      {/* -------------------------------------------- */}

      <div className="grupo-formulario">
        {/* CLIENTE */}
        <div className="grupo-campo">
          <label>Cliente</label>

          <div className="grupo-campo-busqueda">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellidos"
            />

            <button
              type="button"
              className="boton-buscar-cliente"
              onClick={buscarCliente}
              disabled={!nombreValido || buscandoCliente}
              title={
                buscandoCliente ? "Buscando..." : "Buscar cliente en Excel"
              }
              aria-label="Buscar cliente en Excel"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* IP */}
        <div className="grupo-campo">
          <label>IP</label>

          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.1"
          />
        </div>

        {/* TELÉFONO */}
        <div className="grupo-campo">
          <label>Teléfono</label>

          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="312521451"
          />
        </div>

        {/* AGREGAR */}
        <button
          type="button"
          className="grupo-agregar"
          onClick={agregarCliente}
          disabled={!formularioValido}
        >
          Agregar
        </button>
      </div>

      {/* ERROR */}
      {error && <div className="grupo-error">{error}</div>}

      {/* -------------------------------------------- */}
      {/* LISTA */}
      {/* -------------------------------------------- */}

      <div className="grupo-lista">
        {listaGrupo.length === 0 ? (
          <div className="grupo-vacio">No hay otros clientes agregados.</div>
        ) : (
          listaGrupo.map((cliente, indice) => (
            <div className="grupo-registro" key={cliente._id || indice}>
              {/* NOMBRE */}
              <span className="grupo-nombre">{cliente.nombre}</span>

              {/* TELÉFONO */}
              <span className="grupo-telefono">{cliente.telefono}</span>

              {/* IP */}
              {cliente.ip ? (
                <button
                  type="button"
                  className="grupo-ip"
                  onClick={() => copiarIP(cliente.ip)}
                  title="Copiar IP"
                >
                  {cliente.ip}
                </button>
              ) : (
                <span className="grupo-sin-dato"></span>
              )}

              {/* ELIMINAR */}
              <button
                type="button"
                className="grupo-eliminar"
                onClick={() => eliminarCliente(indice)}
                title="Eliminar cliente"
                aria-label="Eliminar cliente"
              >
                <X size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* -------------------------------------------- */}
      {/* CONFIRMAR */}
      {/* -------------------------------------------- */}

      <button
        type="button"
        className="grupo-confirmar"
        onClick={() => onGuardarGrupo(listaGrupo)}
      >
        Guardar y salir
      </button>
    </div>
  );
}

export default Grupo;
