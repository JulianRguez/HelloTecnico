import { useEffect, useRef } from "react";

const EVENTOS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

function useInactividad(minutos, alExpirar) {
  const ultimaActividad = useRef(Date.now());
  const alExpirarRef = useRef(alExpirar);

  useEffect(() => {
    alExpirarRef.current = alExpirar;
  }, [alExpirar]);

  useEffect(() => {
    const limite = minutos * 60 * 1000;

    const registrar = () => {
      ultimaActividad.current = Date.now();
    };

    const revisar = () => {
      if (Date.now() - ultimaActividad.current >= limite) {
        alExpirarRef.current();
      }
    };

    EVENTOS.forEach((evento) =>
      window.addEventListener(evento, registrar, { passive: true }),
    );

    // Revisa cada 30 s
    const intervalo = setInterval(revisar, 30000);

    // Al volver a la pestaña (o reactivar el equipo) revisa de inmediato
    const alVolver = () => {
      if (document.visibilityState === "visible") revisar();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      EVENTOS.forEach((evento) => window.removeEventListener(evento, registrar));
      document.removeEventListener("visibilitychange", alVolver);
      clearInterval(intervalo);
    };
  }, [minutos]);
}

export default useInactividad;