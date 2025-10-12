
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Component/Login';
import Register from './Component/Register';
import Home from './Pages/Home';
import './App.css';
import SiteManagement from './Pages/SiteManagement';
import EmployeeManagement from './Pages/EmployeeManagement';
import ProtectedRoute from './Component/ProtectedRoute';
import ProtectedRouteByRole from './Component/ProtectedRouteByRole';
import Unauthorized from './Pages/Unauthorized';
import GenerateReceipt from './Component/GenerateReceipt'; // Assuming you have a GenerateReceipt component
import RoleManagement from './Component/RoleManagement'; // Assuming you have a RoleManagement component
import MaterialManagement from './Pages/MaterialManagement';
function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/unauthorized" element={<Unauthorized />} />
            {/* 🔐 Only Admin can access Employee Management */}
        <Route element={<ProtectedRouteByRole allowedRoles={['Admin']} />}>
          <Route path="/employees" element={<EmployeeManagement />} />
        </Route>
          {/* 🔐 Supervisor or Admin can access Site Management */}
          <Route element={<ProtectedRouteByRole allowedRoles={['Admin', 'Supervisor']} />}>
          <Route path="/sites" element={<SiteManagement />} />
          <Route path="/generate-receipt" element={<GenerateReceipt />} />
          <Route path="/RoleManagement" element={<RoleManagement />} />
          <Route path='/MaterialManagement' element={<MaterialManagement/>}/>
        </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
