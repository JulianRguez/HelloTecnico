import { Router } from "express";
import mongoose from "mongoose";

import Tarea from "../models/tarea.model.js";
import Usuario from "../models/usuario.model.js";

function parseCSV(csv) {
  const filas = [];
  let fila = [];
  let valor = "";
  let dentroComillas = false;

  for (let i = 0; i < csv.length; i++) {
    const caracter = csv[i];
    const siguiente = csv[i + 1];

    if (caracter === '"') {
      if (dentroComillas && siguiente === '"') {
        valor += '"';
        i++;
      } else {
        dentroComillas = !dentroComillas;
      }
    } else if (caracter === "," && !dentroComillas) {
      fila.push(valor);
      valor = "";
    } else if (
      (caracter === "\n" || caracter === "\r") &&
      !dentroComillas
    ) {
      if (caracter === "\r" && siguiente === "\n") {
        i++;
      }

      fila.push(valor);
      valor = "";

      if (fila.some((celda) => celda !== "")) {
        filas.push(fila);
      }

      fila = [];
    } else {
      valor += caracter;
    }
  }

  if (valor !== "" || fila.length > 0) {
    fila.push(valor);

    if (fila.some((celda) => celda !== "")) {
      filas.push(fila);
    }
  }

  return filas;
}

const router = Router();

/*
  CREAR TAREA
  POST /api/tareas
*/
router.post("/", async (req, res) => {
  try {
    const tarea = await Tarea.create(req.body);

    res.status(201).json(tarea);
  } catch (error) {
    res.status(400).json({
      mensaje: "No se pudo crear la tarea",
      error: error.message
    });
  }
});

/*
  MODIFICAR TAREA
  PUT /api/tareas/:id
*/
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        mensaje: "El _id de la tarea no es válido"
      });
    }

    const tarea = await Tarea.findByIdAndUpdate(
      id,
      req.body,
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
    res.status(400).json({
      mensaje: "No se pudo modificar la tarea",
      error: error.message
    });
  }
});

/*
  AGREGAR HISTORIAL
  POST /api/tareas/:id/historial
*/
router.post("/:id/historial", async (req, res) => {
  try {
    const { id } = req.params;
    const { historial, tecnico } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        mensaje: "El _id de la tarea no es válido"
      });
    }

if (
      typeof tecnico !== "string" ||
      !tecnico.trim()
    ) {
      return res.status(400).json({
        mensaje: "El nombre del técnico es obligatorio"
      });
    }

    if (
      typeof historial !== "string" ||
      historial.trim().length < 20 ||
      historial.trim().length > 80
    ) {
      return res.status(400).json({
        mensaje: "El historial debe tener entre 20 y 80 caracteres"
      });
    }

    const fecha = new Date();

    const fechaFormateada = fecha.toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

     const nuevoHistorial = `${fechaFormateada} - Técnico: ${tecnico.trim()} - ${historial.trim()}`;

    const tarea = await Tarea.findByIdAndUpdate(
      id,
      {
        $push: {
          historial: nuevoHistorial
        }
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
    res.status(400).json({
      mensaje: "No se pudo agregar el historial",
      error: error.message
    });
  }
});

/*
  ELIMINAR TAREAS POR ESTADO
  DELETE /api/tareas/estado/:estado
*/
router.delete("/estado/:estado", async (req, res) => {
  try {
    const { estado } = req.params;

    const estadosValidos = [
      "Pendiente",
      "Realizado",
      "Cancelado",
      "Pospuesto",
      "Cerrado",
    ];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado no válido",
        estadosValidos,
      });
    }

    const resultado = await Tarea.deleteMany({
      estado,
    });

    res.json({
      mensaje: `Se eliminaron las tareas con estado ${estado}`,
      eliminadas: resultado.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudieron eliminar las tareas",
      error: error.message,
    });
  }
});

/*
  ELIMINAR TAREA
  DELETE /api/tareas/:id
*/
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        mensaje: "El _id de la tarea no es válido"
      });
    }

    const tarea = await Tarea.findByIdAndDelete(id);

    if (!tarea) {
      return res.status(404).json({
        mensaje: "tarea no existe"
      });
    }

    res.json({
      mensaje: "Tarea eliminada correctamente",
      tarea
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudo eliminar la tarea",
      error: error.message
    });
  }
});


/*
  OBTENER TODAS LAS TAREAS
  GET /api/tareas
*/
router.get("/", async (req, res) => {
  try {
    const tareas = await Tarea.aggregate([
      {
  $addFields: {
    prioridad: {
      $switch: {
        branches: [
          // Grupo 1 — Instalacion, Traslado, Reconexion
          {
            case: {
              $and: [
                { $in: ["$estado", ["Pendiente", "Pospuesto"]] },
                {
                  $in: [
                    "$accion",
                    [
                      "Instalacion",
                      "Traslado",
                      "Reconexion"
                    ]
                  ]
                }
              ]
            },
            then: 1
          },

          // Grupo 2 — Revision, Cambio equipo, Cambio cable
          {
            case: {
              $and: [
                { $in: ["$estado", ["Pendiente", "Pospuesto"]] },
                {
                  $in: [
                    "$accion",
                    [
                      "Revision",
                      "Cambio equipo",
                      "Cambio cable"
                    ]
                  ]
                }
              ]
            },
            then: 2
          },

          // Grupo 3 — Cableado interno, Repetidor, Retiro equipos, Viabilidad
          {
            case: {
              $and: [
                { $in: ["$estado", ["Pendiente", "Pospuesto"]] },
                {
                  $in: [
                    "$accion",
                    [
                      "Cableado interno",
                      "Repetidor",
                      "Retiro equipos",
                      "Viabilidad"
                    ]
                  ]
                }
              ]
            },
            then: 3
          },

          // Realizado
          {
            case: {
              $eq: ["$estado", "Realizado"]
            },
            then: 4
          },

          // Cancelado
          {
            case: {
              $eq: ["$estado", "Cancelado"]
            },
            then: 5
          },

          // Cerrado
          {
            case: {
              $eq: ["$estado", "Cerrado"]
            },
            then: 6
          }
        ],

        default: 7
      }
    }
  }
},
      {
  $addFields: {
    zonaPrioridad: {
      $switch: {
        branches: [
          { case: { $eq: ["$zona", "Antioquia"] }, then: 1 },
          { case: { $eq: ["$zona", "Paso"] }, then: 2 },
          { case: { $eq: ["$zona", "San Nicolas"] }, then: 3 },
          { case: { $eq: ["$zona", "Filadelfia"] }, then: 4 },
          { case: { $eq: ["$zona", "Tunal"] }, then: 5 },
          { case: { $eq: ["$zona", "San Jeronimo"] }, then: 6 },
          { case: { $eq: ["$zona", "Piñones"] }, then: 7 },
          { case: { $eq: ["$zona", "Llanadas"] }, then: 8 },
          { case: { $eq: ["$zona", "Quebrada Seca"] }, then: 9 },
          { case: { $eq: ["$zona", "Sucre"] }, then: 10 },
          { case: { $eq: ["$zona", "Liborina"] }, then: 11 }
        ],
        default: 99
      }
    }
  }
},
{
  $sort: {
    prioridad: 1,
    zonaPrioridad: 1,
    vence: 1
  }
},
      {
        $lookup: {
          from: "usuarios",
          localField: "tecnico",
          foreignField: "_id",
          as: "tecnico"
        }
      },
      {
        $unwind: {
          path: "$tecnico",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          prioridad: 0,
          zonaPrioridad: 0,
          "tecnico.clave": 0,
          "tecnico.createdAt": 0,
          "tecnico.updatedAt": 0
        }
      }
    ]);

    res.json(tareas);
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudieron obtener las tareas",
      error: error.message
    });
  }
});

/*
  OBTENER TODAS LAS TAREAS DE UN TÉCNICO
  GET /api/tareas/tecnico/:usuarioId
*/
router.get("/tecnico/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.status(400).json({
        mensaje: "El _id del usuario no es válido"
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

    const tareas = await Tarea.find({
      tecnico: usuarioId
    })
      .sort({ vence: 1 })
      .populate("tecnico", "nombre perfil");

    res.json(tareas);
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudieron obtener las tareas del técnico",
      error: error.message
    });
  }
});

/*
  OBTENER SIGUIENTE TAREA DEL TÉCNICO
  GET /api/tareas/tecnico/:usuarioId/siguiente
*/
router.get("/tecnico/:usuarioId/siguiente", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
      return res.status(400).json({
        mensaje: "El _id del usuario no es válido"
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

    const tarea = await Tarea.findOne({
      tecnico: usuarioId,
      estado: "Pendiente"
    })
      .sort({ vence: 1 })
      .populate("tecnico", "nombre perfil");

    if (!tarea) {
      return res.json(null);
    }

    res.json(tarea);
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudo obtener la siguiente tarea",
      error: error.message
    });
  }
});

/*
  BUSCAR TAREA POR NOMBRE EXACTO
  GET /api/tareas/cliente/:nombre
*/
router.get("/cliente/:nombre", async (req, res) => {
  try {
    const { nombre } = req.params;

    const tarea = await Tarea.findOne({
      cliente: nombre
    }).populate("tecnico", "nombre perfil");

    if (!tarea) {
      return res.status(404).json({
        mensaje: "No existe una tarea con ese nombre"
      });
    }

    res.json(tarea);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error buscando tarea por nombre",
      error: error.message
    });
  }
});

/*
  BUSCAR TAREA POR CLIENTE EN GOOGLE SHEETS
  GET /api/tareas/cliente-excel/:nombre
*/

router.get("/cliente-excel/:nombre", async (req, res) => {
  try {
    const { nombre } = req.params;

    const url =
      "https://docs.google.com/spreadsheets/d/1_TuFeRtd0JJ0MduVBIxxzdCxbSOYrP_t/gviz/tq?tqx=out:csv&sheet=V2";

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error(
        `Google Sheets respondió con estado ${respuesta.status}`,
      );
    }

    const csv = await respuesta.text();

    const filas = parseCSV(csv);

    const filaEncontrada = filas.find((fila) => fila[1] === nombre);

    if (!filaEncontrada) {
      return res.status(404).json({
        mensaje: "No existe ese cliente en Google Sheets",
      });
    }

    res.json({
      encontrado: true,
      cliente: filaEncontrada[1] ?? "",
      direccion: filaEncontrada[33] ?? "",
      telefono: filaEncontrada[21] ?? "",
      ip: filaEncontrada[2] ?? "",
      ip2: filaEncontrada[3] ?? "",
      plan: filaEncontrada[30] ?? "",
    });
  } catch (error) {
    console.error("Error consultando Google Sheets:", error);

    res.status(500).json({
      mensaje: "Error consultando Google Sheets",
      error: error.message,
    });
  }
});

/*
  BUSCAR TAREA POR _id
  GET /api/tareas/:id
*/


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        mensaje: "El _id de la tarea no es válido"
      });
    }

    const tarea = await Tarea.findById(id).populate(
      "tecnico",
      "nombre perfil"
    );

    if (!tarea) {
      return res.status(404).json({
        mensaje: "tarea no existe"
      });
    }

    res.json(tarea);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error buscando tarea",
      error: error.message
    });
  }
});

export default router;