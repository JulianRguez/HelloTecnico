import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },

    clave: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    perfil: {
      type: String,
      required: true,
      enum: ["Tecnico", "Soporte"]
    }
  },
  {
    timestamps: true
  }
);

const Usuario = mongoose.model("Usuario", usuarioSchema);

export default Usuario;