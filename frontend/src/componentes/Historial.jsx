import "./Historial.css";

function Historial({ tarea, onCerrar }) {
  return (
    <div className="historial">
      <h1>Historial de Procedimientos</h1>

      <div className="historial-lista">
        {tarea?.historial?.length > 0 ? (
          tarea.historial.map((registro, index) => (
            <div className="historial-registro" key={index}>
              {registro}
            </div>
          ))
        ) : (
          <div className="historial-vacio">
            No hay registros en el historial.
          </div>
        )}
      </div>

      <button type="button" className="historial-cerrar" onClick={onCerrar}>
        Cerrar
      </button>
    </div>
  );
}

export default Historial;
