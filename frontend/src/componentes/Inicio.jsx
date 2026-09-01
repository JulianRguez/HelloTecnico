import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import "./Inicio.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Inicio() {
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const ingresar = async (e) => {
    e.preventDefault();

    setMensaje("");

    if (!clave.trim()) {
      setMensaje("Ingrese su contraseña de acceso");
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        `${API_URL}/api/usuarios/clave/${encodeURIComponent(clave.trim())}`,
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje("El usuario asociado a esa contraseña no existe");
        return;
      }

      sessionStorage.setItem(
        "usuario",
        JSON.stringify({
          _id: datos._id,
          nombre: datos.nombre,
          perfil: datos.perfil,
          tareas: datos.tareas,
        }),
      );

      if (datos.perfil === "Tecnico") {
        navigate("/tecnico");
        return;
      }

      if (datos.perfil === "Soporte") {
        navigate("/soporte");
        return;
      }

      sessionStorage.removeItem("usuario");

      setMensaje("El perfil del usuario no es válido");
    } catch (error) {
      console.error(error);
      setMensaje("No fue posible conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="inicio">
      <section className="inicio-card">
        <h1>Bienvenidos</h1>

        <div className="inicio-icono">
          <Wrench size={58} strokeWidth={1.8} />
        </div>

        <p className="inicio-subtitulo">Ingrese su contraseña de acceso</p>

        <form onSubmit={ingresar}>
          <input
            type="password"
            placeholder="Contraseña"
            value={clave}
            onChange={(e) => {
              setClave(e.target.value);
              setMensaje("");
            }}
            autoComplete="current-password"
          />

          <button type="submit" disabled={cargando}>
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="inicio-ayuda">
          Si no cuenta con contraseña de acceso puede solicitarla en la línea
          WhatsApp <strong>3216046640</strong>
        </p>

        {mensaje && <p className="inicio-mensaje">{mensaje}</p>}
      </section>
    </main>
  );
}

export default Inicio;
