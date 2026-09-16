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
    const cuerpo = { ...req.body };

    /*
      ============================================================
      ASIGNACIÓN AUTOMÁTICA DE ORDEN AL CREAR LA TAREA
      ============================================================
    */

    const tecnicoNuevo = cuerpo.tecnico
      ? cuerpo.tecnico.toString()
      : null;

    if (tecnicoNuevo) {
      /*
        ----------------------------------------------------------
        Verificar que el _id del técnico sea válido
        ----------------------------------------------------------
      */

      if (!mongoose.Types.ObjectId.isValid(tecnicoNuevo)) {
        return res.status(400).json({
          mensaje: "El _id del técnico no es válido",
        });
      }

      /*
        ----------------------------------------------------------
        Verificar que el usuario exista y tenga perfil Tecnico
        ----------------------------------------------------------
      */

      const tecnico = await Usuario.findById(tecnicoNuevo).select(
        "nombre perfil"
      );

      if (!tecnico) {
        return res.status(404).json({
          mensaje: "El técnico no existe",
        });
      }

      if (tecnico.perfil !== "Tecnico") {
        return res.status(400).json({
          mensaje: "El usuario seleccionado no es un técnico",
        });
      }

      /*
        ----------------------------------------------------------
        Buscar la última posición del técnico
        ----------------------------------------------------------
      */

      const ultimaTarea = await Tarea.findOne({
        tecnico: tecnicoNuevo,
        ordenTecnico: {
          $ne: null,
        },
      }).sort({
        ordenTecnico: -1,
      });

      const ultimaPosicion = ultimaTarea?.ordenTecnico ?? 0;

      /*
        La nueva tarea queda al final.
      */
      cuerpo.tecnico = tecnicoNuevo;
      cuerpo.ordenTecnico = ultimaPosicion + 1;
    } else {
      /*
        ----------------------------------------------------------
        Si la tarea se crea sin técnico, no tiene posición.
        ----------------------------------------------------------
      */

      cuerpo.tecnico = null;
      cuerpo.ordenTecnico = null;
    }

    const tarea = await Tarea.create(cuerpo);

    res.status(201).json(tarea);
  } catch (error) {
    res.status(400).json({
      mensaje: "No se pudo crear la tarea",
      error: error.message,
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
        mensaje: "El _id de la tarea no es válido",
      });
    }

    const tareaActual = await Tarea.findById(id);

    if (!tareaActual) {
      return res.status(404).json({
        mensaje: "tarea no existe",
      });
    }

    const cuerpo = { ...req.body };

    /*
      ============================================================
      CAMBIO DE TÉCNICO
      ============================================================
    */

    const tecnicoAnterior = tareaActual.tecnico
      ? tareaActual.tecnico.toString()
      : null;

    const tecnicoNuevo =
      Object.prototype.hasOwnProperty.call(cuerpo, "tecnico")
        ? cuerpo.tecnico
          ? cuerpo.tecnico.toString()
          : null
        : tecnicoAnterior;

    const cambioTecnico = tecnicoAnterior !== tecnicoNuevo;

    if (cambioTecnico) {
      /*
        ----------------------------------------------------------
        Si se asigna un técnico, verificamos que exista y que
        realmente tenga perfil Tecnico.
        ----------------------------------------------------------
      */

      if (tecnicoNuevo) {
        if (!mongoose.Types.ObjectId.isValid(tecnicoNuevo)) {
          return res.status(400).json({
            mensaje: "El _id del técnico no es válido",
          });
        }

        const tecnico = await Usuario.findById(tecnicoNuevo).select(
          "nombre perfil"
        );

        if (!tecnico) {
          return res.status(404).json({
            mensaje: "El técnico no existe",
          });
        }

        if (tecnico.perfil !== "Tecnico") {
          return res.status(400).json({
            mensaje: "El usuario seleccionado no es un técnico",
          });
        }
      }

      /*
        ----------------------------------------------------------
        Si la tarea ya tenía técnico, la quitamos de su posición
        actual y corremos las posiciones siguientes hacia arriba.
        ----------------------------------------------------------
      */

      if (tecnicoAnterior && tareaActual.ordenTecnico != null) {
        await Tarea.updateMany(
          {
            tecnico: tecnicoAnterior,
            ordenTecnico: {
              $gt: tareaActual.ordenTecnico,
            },
          },
          {
            $inc: {
              ordenTecnico: -1,
            },
          }
        );
      }

      /*
        ----------------------------------------------------------
        Si se asigna un nuevo técnico, la tarea se coloca al final
        de la lista de ese técnico.
        ----------------------------------------------------------
      */

      if (tecnicoNuevo) {
        const ultimaTarea = await Tarea.findOne({
          tecnico: tecnicoNuevo,
          ordenTecnico: {
            $ne: null,
          },
        }).sort({
          ordenTecnico: -1,
        });

        const ultimaPosicion = ultimaTarea?.ordenTecnico ?? 0;

        cuerpo.tecnico = tecnicoNuevo;
        cuerpo.ordenTecnico = ultimaPosicion + 1;
      } else {
        /*
          --------------------------------------------------------
          Si se quita el técnico, la tarea queda sin posición.
          --------------------------------------------------------
        */

        cuerpo.tecnico = null;
        cuerpo.ordenTecnico = null;
      }
    } else {
      /*
        ----------------------------------------------------------
        Si NO cambió el técnico, ignoramos cualquier ordenTecnico
        enviado accidentalmente desde el frontend.

        La posición será modificada posteriormente mediante
        nuestra ruta específica de orden.
        ----------------------------------------------------------
      */

      delete cuerpo.ordenTecnico;
    }

    const tarea = await Tarea.findByIdAndUpdate(
      id,
      cuerpo,
      {
        new: true,
        runValidators: true,
      }
    ).populate("tecnico", "nombre perfil");

    res.json(tarea);
  } catch (error) {
    res.status(400).json({
      mensaje: "No se pudo modificar la tarea",
      error: error.message,
    });
  }
});

/*
  CAMBIAR ORDEN DE UNA TAREA
  PUT /api/tareas/:id/orden
*/
router.put("/:id/orden", async (req, res) => {
  try {
    const { id } = req.params;
    const { ordenTecnico } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        mensaje: "El _id de la tarea no es válido",
      });
    }

    if (
      !Number.isInteger(ordenTecnico) ||
      ordenTecnico < 1
    ) {
      return res.status(400).json({
        mensaje: "ordenTecnico debe ser un número entero mayor o igual a 1",
      });
    }

    const tarea = await Tarea.findById(id);

    if (!tarea) {
      return res.status(404).json({
        mensaje: "tarea no existe",
      });
    }

    if (!tarea.tecnico) {
      return res.status(400).json({
        mensaje: "La tarea no tiene un técnico asignado",
      });
    }

    if (tarea.ordenTecnico == null) {
      return res.status(400).json({
        mensaje: "La tarea no tiene una posición asignada",
      });
    }

    const tecnicoId = tarea.tecnico.toString();
    const posicionActual = tarea.ordenTecnico;

    /*
      Obtener todas las tareas del mismo técnico que
      tienen una posición válida.
    */
    const tareasDelTecnico = await Tarea.find({
      tecnico: tecnicoId,
      ordenTecnico: {
        $ne: null,
      },
    }).sort({
      ordenTecnico: 1,
    });

    const cantidadTareas = tareasDelTecnico.length;

    /*
      La nueva posición no puede ser mayor que la cantidad
      de tareas que tiene actualmente el técnico.
    */
    if (ordenTecnico > cantidadTareas) {
      return res.status(400).json({
        mensaje: `La posición máxima disponible es ${cantidadTareas}`,
      });
    }

    /*
      Si la posición no cambia, no hacemos nada.
    */
    if (ordenTecnico === posicionActual) {
      const tareaActualizada = await Tarea.findById(id).populate(
        "tecnico",
        "nombre perfil"
      );

      return res.json(tareaActualizada);
    }

    /*
      ----------------------------------------------------------
      MOVER HACIA UNA POSICIÓN MENOR
      ----------------------------------------------------------

      Ejemplo:
      1 Pedro
      2 Pablo
      3 Jacinto
      4 José

      José (4) -> posición 2

      Resultado:
      1 Pedro
      2 José
      3 Pablo
      4 Jacinto
    */
    if (ordenTecnico < posicionActual) {
      await Tarea.updateMany(
        {
          tecnico: tecnicoId,
          ordenTecnico: {
            $gte: ordenTecnico,
            $lt: posicionActual,
          },
        },
        {
          $inc: {
            ordenTecnico: 1,
          },
        }
      );
    }

    /*
      ----------------------------------------------------------
      MOVER HACIA UNA POSICIÓN MAYOR
      ----------------------------------------------------------

      Ejemplo:
      1 Pedro
      2 Pablo
      3 Jacinto
      4 José
      5 Juan

      Pedro (1) -> posición 5

      Resultado:
      1 Pablo
      2 Jacinto
      3 José
      4 Juan
      5 Pedro
    */
    if (ordenTecnico > posicionActual) {
      await Tarea.updateMany(
        {
          tecnico: tecnicoId,
          ordenTecnico: {
            $gt: posicionActual,
            $lte: ordenTecnico,
          },
        },
        {
          $inc: {
            ordenTecnico: -1,
          },
        }
      );
    }

    /*
      Finalmente colocamos la tarea en su nueva posición.
    */
    tarea.ordenTecnico = ordenTecnico;

    await tarea.save();

    const tareaActualizada = await Tarea.findById(id).populate(
      "tecnico",
      "nombre perfil"
    );

    res.json(tareaActualizada);
  } catch (error) {
    res.status(400).json({
      mensaje: "No se pudo cambiar el orden de la tarea",
      error: error.message,
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
      /*
        PRIORIDAD DENTRO DE CADA ZONA

        1. Revision / Cambio equipo / Cambio cable
        2. Instalacion / Traslado / Reconexion
        3. Cableado interno / Repetidor / Retiro equipos / Viabilidad
        4. Realizado
        5. Cancelado
        6. Cerrado
      */
      {
        $addFields: {
          prioridad: {
            $switch: {
              branches: [
                // Grupo 1 — Revision, Cambio equipo, Cambio cable
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
                  then: 1
                },

                // Grupo 2 — Instalacion, Traslado, Reconexion
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

                // Grupo 4 — Realizado
                {
                  case: {
                    $eq: ["$estado", "Realizado"]
                  },
                  then: 4
                },

                // Grupo 5 — Cancelado
                {
                  case: {
                    $eq: ["$estado", "Cancelado"]
                  },
                  then: 5
                },

                // Grupo 6 — Cerrado
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

      /*
        ORDEN DE LAS ZONAS
      */
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

      /*
        FECHA DE ORDEN

        Para los grupos 1, 2 y 3:
        se ordena por "vence".

        Para Realizado, Cancelado y Cerrado:
        se conserva el orden de creación de las tareas
        mediante "createdAt".
      */
      {
        $addFields: {
          fechaOrden: {
            $cond: [
              { $lte: ["$prioridad", 3] },
              "$vence",
              "$createdAt"
            ]
          }
        }
      },

      /*
        ORDEN FINAL

        1. Zona
        2. Grupo dentro de la zona
        3. Fecha correspondiente al grupo
      */
      {
        $sort: {
          zonaPrioridad: 1,
          prioridad: 1,
          fechaOrden: 1
        }
      },

      /*
        OBTENER INFORMACIÓN DEL TÉCNICO
      */
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

      /*
        CAMPOS QUE NO NECESITAMOS EN LA RESPUESTA
      */
      {
        $project: {
          prioridad: 0,
          zonaPrioridad: 0,
          fechaOrden: 0,
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
      .sort({ ordenTecnico: 1 })
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
      .sort({ ordenTecnico: 1 })
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