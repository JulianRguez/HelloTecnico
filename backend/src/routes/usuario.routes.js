import { Router } from "express";
import mongoose from "mongoose";

import Usuario from "../models/usuario.model.js";
import Tarea from "../models/tarea.model.js";

const router = Router();

/*
  CREAR USUARIO
  POST /api/usuarios
*/
router.post("/", async (req, res) => {
  try {
    const { nombre, clave, perfil } = req.body;

    const usuario = await Usuario.create({
      nombre,
      clave,
      perfil
    });

    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({
      mensaje: "No se pudo crear el usuario",
      error: error.message
    });
  }
});

/*
  MODIFICAR USUARIO
  PUT /api/usuarios/:id
*/
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        mensaje: "El _id del usuario no es válido"
      });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!usuario) {
      return res.status(404).json({
        mensaje: "usuario no existe"
      });
    }

    res.json(usuario);
  } catch (error) {
    res.status(400).json({
      mensaje: "No se pudo modificar el usuario",
      error: error.message
    });
  }
});

/*
  OBTENER USUARIO POR CLAVE
  GET /api/usuarios/clave/:clave
*/
router.get("/clave/:clave", async (req, res) => {
  try {
    const { clave } = req.params;

    const usuario = await Usuario
      .findOne({ clave })
      .select("nombre clave perfil");

    if (!usuario) {
      return res.status(404).json({
        mensaje: "usuario no existe"
      });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error buscando usuario",
      error: error.message
    });
  }
});

/*
  OBTENER TODOS LOS TÉCNICOS
  GET /api/usuarios/tecnicos
*/
router.get("/tecnicos", async (req, res) => {
  try {
    const tecnicos = await Usuario
      .find({ perfil: "Tecnico" })
      .select("nombre perfil")
      .sort({ nombre: 1 });

    res.json(tecnicos);
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudieron obtener los tecnicos",
      error: error.message
    });
  }
});

/*
  ASIGNAR TAREA A USUARIO
  PUT /api/usuarios/:usuarioId/tareas/:tareaId
*/
router.put("/:usuarioId/tareas/:tareaId", async (req, res) => {
  try {
    const { usuarioId, tareaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.status(400).json({
        mensaje: "El _id del usuario no es válido"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tareaId)) {
      return res.status(400).json({
        mensaje: "El _id de la tarea no es válido"
      });
    }

    const usuario = await Usuario.findById(usuarioId).select(
      "nombre perfil"
    );

    if (!usuario) {
      return res.status(404).json({
        mensaje: "usuario no existe"
      });
    }

    if (usuario.perfil !== "Tecnico") {
      return res.status(400).json({
        mensaje: "El usuario no es un tecnico"
      });
    }

    const tarea = await Tarea.findByIdAndUpdate(
      tareaId,
      {
        tecnico: usuarioId
      },
      {
        new: true,
        runValidators: true
      }
    ).populate("tecnico", "nombre perfil");

    if (!tarea) {
      return res.status(404).json({
        mensaje: "tarea no existe"
      });
    }

    res.json(tarea);
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudo asignar la tarea al usuario",
      error: error.message
    });
  }
});

/*
  QUITAR ASIGNACIÓN DE TAREA
  DELETE /api/usuarios/:usuarioId/tareas/:tareaId
*/
router.delete("/:usuarioId/tareas/:tareaId", async (req, res) => {
  try {
    const { usuarioId, tareaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.status(400).json({
        mensaje: "El _id del usuario no es válido"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tareaId)) {
      return res.status(400).json({
        mensaje: "El _id de la tarea no es válido"
      });
    }

    const tarea = await Tarea.findOneAndUpdate(
      {
        _id: tareaId,
        tecnico: usuarioId
      },
      {
        tecnico: null
      },
      {
        new: true
      }
    );

    if (!tarea) {
      return res.status(404).json({
        mensaje: "tarea no existe o no está asignada a este usuario"
      });
    }

    res.json(tarea);
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudo quitar la asignación de la tarea",
      error: error.message
    });
  }
});

export default router;