import { Router } from "express";

const router = Router();

// Navegadores conectados en este momento
const clientes = new Set();

/*
  SSE
  GET /api/eventos
*/
router.get("/", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // evita que nginx/proxies retengan los mensajes
  });
  res.flushHeaders();

  // Le dice al navegador cuánto esperar antes de reconectar si se cae
  res.write("retry: 3000\n\n");

  clientes.add(res);

  // Latido cada 25 s para que proxies/hosting no cierren la conexión inactiva
  const latido = setInterval(() => {
    res.write(": ping\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(latido);
    clientes.delete(res);
  });
});

/*
  Avisa a todos los navegadores conectados
*/
export function notificarCambio(tipo = "actualizado", id = null) {
  const mensaje = `event: tareas\ndata: ${JSON.stringify({ tipo, id })}\n\n`;

  for (const cliente of clientes) {
    cliente.write(mensaje);
  }
}

export default router;