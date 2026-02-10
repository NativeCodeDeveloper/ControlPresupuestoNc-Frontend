import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

import Dashboard from './app/Dashboard/Dashboard';
import Ingresos from './app/Ingresos/Ingresos';
import Gastos from './app/Gastos/Gastos';
import Reportes from './app/Reportes/Reportes';
import Socios from './app/Socios/Socios';
import Config from './app/Config/Config';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingresos" element={<Ingresos />} />
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/socios" element={<Socios />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/config" element={<Config />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
