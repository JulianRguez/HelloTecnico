import mongoose from "mongoose";

const tareaSchema = new mongoose.Schema(
  {
    doc: {
      type: Number,
      required: false
    },

    cliente: {
      type: String,
      required: true,
      trim: true
    },

    estado: {
      type: String,
      required: true,
      enum: [
        "Pendiente",
        "Realizado",
        "Cancelado",
        "Pospuesto",
        "Cerrado"
      ],
      default: "Pendiente"
    },

    accion: {
      type: String,
      required: true,
      enum: [
        "Instalacion",
        "Traslado",
        "Revision",
        "Reconexion",
        "Retiro equipos",
        "Cableado interno",
        "Repetidor",
        "Viabilidad",
        "Cambio equipo",
        "Cambio cable"
      ]
    },

    direccion: {
      type: String,
      required: true,
      trim: true
    },

    zona: {
  type: String,
  required: true,
  enum: [
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
    "Liborina"
  ]
},

    telefono: {
  type: String,
  required: true,
  minlength: 7,
  maxlength: 15
},

telefono2: {
  type: String,
  required: false,
  minlength: 7,
  maxlength: 15
},

    ip: {
  type: String,
  required: false,
  default: null,
  trim: true,
  match: [
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/,
    "La IP debe tener un formato IPv4 válido"
  ]
},

ip2: {
  type: String,
  required: false,
  default: null,
  trim: true,
  match: [
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/,
    "La IP2 debe tener un formato IPv4 válido"
  ]
},

    instalacion: {
      type: String,
      required: true,
      enum: [
        "Utp",
        "Fibra óptica",
        "Radio enlace"
      ]
    },

    plan: {
      type: String,
      required: true,
      trim: true
    },

    solicitud: {
      type: Date,
      required: true
    },

    vence: {
      type: Date,
      required: true
    },

    debe: {
      type: Boolean,
      default: false
    },

    valor: {
      type: Number,
      default: 0
    },

    detalle: {
      type: String,
      default: "",
      trim: true
    },

    historial: {
      type: [String],
      default: []
    },

    tecnico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      default: null
    }
  },
  {
    timestamps: true
  }
);

/*
  Índice para las consultas del técnico.

  Permite buscar rápidamente:
  - tareas de un técnico
  - solamente pendientes
  - ordenadas por vence
*/
tareaSchema.index({
  tecnico: 1,
  estado: 1,
  vence: 1
});

/*
  Índice para el listado general de tareas.
*/
tareaSchema.index({
  estado: 1,
  accion: 1,
  vence: 1
});

const Tarea = mongoose.model("Tarea", tareaSchema);

export default Tarea;