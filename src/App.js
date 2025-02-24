import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Canevas from "./pages/Canevas";

function App() {
  return (
    <Router>
      <nav className="bg-blue-600 p-4 text-white flex justify-between">
        <div className="font-bold text-lg">Lemieux Assurances</div>
        <div className="space-x-4">
          <Link to="/dashboard" className="hover:underline">Accueil</Link>
          <Link to="/canevas" className="hover:underline">Répertoire de Canevas</Link>
          {/* On a retiré les liens Login et Register */}
        </div>
      </nav>

      <Routes>
        {/* Redirection par défaut vers le répertoire */}
        <Route path="/" element={<Navigate to="/canevas" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/canevas" element={<Canevas />} />
        {/* On a retiré les routes pour Login, Register, et Profile */}
      </Routes>
    </Router>
  );
}

export default App;
