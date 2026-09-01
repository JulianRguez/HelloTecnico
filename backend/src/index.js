import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import usuarioRoutes from "./routes/usuario.routes.js";
import tareaRoutes from "./routes/tarea.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mensaje: "Backend funcionando"
  });
});

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/tareas", tareaRoutes);

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  })
  .then(() => {
    console.log("MongoDB conectado correctamente");

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error conectando a MongoDB:");
    console.error(error.message);
    process.exit(1);
  });