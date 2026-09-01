import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import usuarioRoutes from "./routes/usuario.routes.js";
import tareaRoutes from "./routes/tarea.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Obtener la ruta del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Frontend compilado
const frontendPath = path.resolve(__dirname, "../../frontend/dist");

app.use(cors());
app.use(express.json());

// API
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mensaje: "Backend funcionando"
  });
});

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/tareas", tareaRoutes);

// Servir frontend
app.use(express.static(frontendPath));

// Para las rutas de React
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  })
  .then(() => {
    console.log("MongoDB conectado correctamente");

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error conectando a MongoDB:");
    console.error(error.message);
    process.exit(1);
  });