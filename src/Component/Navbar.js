import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../Context/AuthContext';
//import { getUserFromToken } from '../Utils/jwtHelper';
//import { getDashboardData } from '../api/dashboardApi';
import { useOrg } from '../Context/OrgContext';

function Navbar() {
  const { logout } = useAuth();
 // const user = getUserFromToken();
  const [menuOpen, setMenuOpen] = useState(false);
  const { userdata,orgData } = useOrg();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="navbar">
      <div className="navbar-logo" id="orgName">
      🏗️ {orgData?.organisationName || 'ConstructMate'}</div>

      <div className="hamburger" onClick={toggleMenu}>
        ☰
      </div>

      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <li><Link to="/home" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
        {userdata?.role === 'Admin' && (
          <>
            <li><Link to="/rolemanagement" onClick={() => setMenuOpen(false)}>Role Management</Link></li>
            <li><Link to="/sites" onClick={() => setMenuOpen(false)}>Site Management</Link></li>
            <li><Link to="/employees" onClick={() => setMenuOpen(false)}>Employees</Link></li>
            <li><Link to="/generate-receipt" onClick={() => setMenuOpen(false)}>Generate Receipt</Link></li>
            <li><Link to="/MaterialManagement" onClick={() => setMenuOpen(false)}>Material Management</Link></li>
          </>
        )}
        {userdata?.role === 'Supervisor' && (
          <>
           <li><Link to="/rolemanagement" onClick={() => setMenuOpen(false)}>Role Management</Link></li>
            <li><Link to="/sites" onClick={() => setMenuOpen(false)}>Site Management</Link></li>
            <li><Link to="/generate-receipt" onClick={() => setMenuOpen(false)}>Generate Receipt</Link></li>
          </>
        )}
        <li><Link to="/" onClick={logout}>Logout</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
