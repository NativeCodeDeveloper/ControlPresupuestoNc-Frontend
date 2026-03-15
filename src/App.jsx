import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';


import Dashboard from './app/Dashboard/Dashboard';
import Ingresos from './app/Ingresos/Ingresos';
import Gastos from './app/Gastos/Gastos';
import Reportes from './app/Reportes/Reportes';
import Socios from './app/Socios/Socios';
import Config from './app/Config/Config';
import Inversiones from './app/Inversiones/Inversiones';
import FlujoCaja from './app/FlujoCaja/FlujoCaja';
import Contabilidad from './app/Contabilidad/Contabilidad';
import Landing from './app/Landing/Landing';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ingresos" element={<Ingresos />} />
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/socios" element={<Socios />} />
          <Route path="/inversiones" element={<Inversiones />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/flujo-caja" element={<FlujoCaja />} />
          <Route path="/contabilidad" element={<Contabilidad />} />
          <Route path="/config" element={<Config />} />
          <Route path="/" element={<Landing />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
