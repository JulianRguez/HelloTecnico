let festivos = null;

// date-holidays pesa bastante, así que se carga solo cuando se necesita
async function obtenerFestivos() {
  if (!festivos) {
    const { default: Holidays } = await import("date-holidays");
    festivos = new Holidays("CO");
  }

  return festivos;
}

// Días hábiles que se suman a la fecha de hoy según la acción
export const DIAS_POR_ACCION = {
  Instalacion: 5,
  Traslado: 3,
  Revision: 1,
  Reconexion: 3,
  "Retiro equipos": 5,
  "Cableado interno": 5,
  Repetidor: 5,
  Viabilidad: 3,
  "Cambio equipo": 1,
  "Cambio cable": 1,
};

// Suma días hábiles: no cuenta sábados, domingos ni festivos de Colombia
export async function calcularVence(accion, desde = new Date()) {
  const dias = DIAS_POR_ACCION[accion];

  if (!dias) return null;

  const calendario = await obtenerFestivos();
  const fecha = new Date(desde);

  let sumados = 0;

  while (sumados < dias) {
    fecha.setDate(fecha.getDate() + 1);

    const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;

    const resultado = calendario.isHoliday(fecha);
    const esFestivo =
      Array.isArray(resultado) &&
      resultado.some((festivo) => festivo.type === "public");

    if (!esFinDeSemana && !esFestivo) {
      sumados++;
    }
  }

  // La hora no se usa en la página: se deja al mediodía
  fecha.setHours(12, 0, 0, 0);

  return fecha;
}