import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FormTreino from './pages/FormTreino';
import BuscarExercicios from './pages/BuscarExercicios';

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/novo" element={<FormTreino />} />
          <Route path="/editar/:id" element={<FormTreino />} />
          <Route path="/exercicios" element={<BuscarExercicios />} />
        </Routes>
      </main>
    </div>
  );
}
