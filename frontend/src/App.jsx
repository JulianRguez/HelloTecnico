import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inicio from "./componentes/Inicio";
import Tecnico from "./componentes/Tecnico";
import Soporte from "./componentes/Soporte";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />

        <Route path="/tecnico" element={<Tecnico />} />

        <Route path="/soporte" element={<Soporte />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
