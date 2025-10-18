
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
import ProtectedRouteByMapping from './Component/ProtectedRouteByMapping';
import Unauthorized from './Pages/Unauthorized';
import GenerateReceipt from './Component/GenerateReceipt'; // Assuming you have a GenerateReceipt component
import RoleManagement from './Component/RoleManagement'; // Assuming you have a RoleManagement component
import SupplierPage from './Pages/SupplierPage'; // path to file
import MaterialPage from './Component/MaterialPage';
import ManageRoles from './Pages/ManageRoles';
import ManagePages from './Pages/ManagePages';
import LabourPayment from './Pages/LabourPayment';
import EmployeeAttendance from './Pages/EmployeeAttendance';
import SiteTransaction from './Pages/SiteTransaction';
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
           
        <Route element={<ProtectedRouteByMapping pageKeyword="employee" />}>
          <Route path="/employees" element={<EmployeeManagement />} />
        </Route>
          
          <Route element={<ProtectedRouteByMapping pageKeyword="site" />}>
            <Route path="/sites" element={<SiteManagement />} />
          </Route>
          <Route element={<ProtectedRouteByMapping pageKeyword="receipt" />}>
            <Route path="/generate-receipt" element={<GenerateReceipt />} />
          </Route>
          <Route element={<ProtectedRouteByMapping pageKeyword="role" />}>
            <Route path="/RoleManagement" element={<RoleManagement />} />
            <Route path="/ManageRoles" element={<ManageRoles />} />
            <Route path="/ManagePages" element={<ManagePages />} />
          </Route>
          <Route element={<ProtectedRouteByMapping pageKeyword="labour" />}>
            <Route path="/labour-payments" element={<LabourPayment />} />
          </Route>
          <Route element={<ProtectedRouteByMapping pageKeyword="site" />}>
            <Route path="/site-transactions" element={<SiteTransaction />} />
          </Route>
          <Route element={<ProtectedRouteByMapping pageKeyword="attendance" />}>
            <Route path="/attendance" element={<EmployeeAttendance />} />
          </Route>
          <Route element={<ProtectedRouteByMapping pageKeyword="supplier" />}>
            <Route path="/suppliers/create" element={<SupplierPage />} />
          </Route>
          <Route element={<ProtectedRouteByMapping pageKeyword="material" />}>
            <Route path="/materials/create" element={<MaterialPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
