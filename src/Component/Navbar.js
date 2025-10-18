import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../Context/AuthContext';
import { useOrg } from '../Context/OrgContext';
import { getUserFromToken } from '../Utils/jwtHelper';
import { getAllRolePageMappings, getAllPages, getAllRoles } from '../api/roleApi';

function Navbar() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { userdata, orgData } = useOrg();
  const [allowedPages, setAllowedPages] = useState(new Set());
  const [pages, setPages] = useState([]);

  const user = getUserFromToken();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const load = async () => {
      try {
        const orgId = orgData?.organisationId;
        if (!orgId) return;
        // fetch pages and mappings
        const [pagesResp, mapResp] = await Promise.all([
          getAllPages(orgId),
          getAllRolePageMappings()
        ]);
        const pageList = pagesResp.data || [];
        setPages(pageList);

        // normalize mappings to { roleId: Set(pageId) }
        const mappings = mapResp.data || [];
        const roleToPages = {};
        mappings.forEach(m => {
          const rid = m.roleid || m.roleId || m.role;
          const pids = m.pageIds || (m.pageid ? [m.pageid] : (m.pageId ? [m.pageId] : []));
          if (!rid) return;
          roleToPages[rid] = roleToPages[rid] || new Set();
          pids.forEach(p => roleToPages[rid].add(p));
        });

        // fetch roles to map user's role name to roleId
        const rolesResp = await getAllRoles(orgId);
        const rolesList = rolesResp.data || [];

        const roleName = (user?.role || userdata?.role || '').toString().toLowerCase();
        const matchedRole = rolesList.find(r => ((r.rolename || r.roleName || '')).toString().toLowerCase() === roleName);
        const allowed = new Set();

        // helper: map a page object to a front-end route
        const routeForPage = (p) => {
          const name = (p.pageName || p.pagename || p.name || '').toString().toLowerCase();
          if (name.includes('role')) return '/rolemanagement';
          if (name.includes('site')) return '/sites';
          if (name.includes('employee')) return '/employees';
            if (name.includes('attendance')) return '/attendance';
          if (name.includes('receipt') || name.includes('generate')) return '/generate-receipt';
          if (name.includes('dashboard') || name.includes('home')) return '/home';
          return null;
        };

        // Admins see everything
        if (roleName === 'admin') {
          // map all pages to routes
          pageList.forEach(p => {
            const route = routeForPage(p);
            if (route) allowed.add(route);
          });
        } else if (matchedRole) {
          // compute allowed routes from mapping using matchedRole.roleid
          const rid = matchedRole.roleid || matchedRole.id || matchedRole.roleId;
          const allowedPageIds = roleToPages[rid] || new Set();
          pageList.forEach(p => {
            const pid = p.pageId || p.pageid || p.id;
            if (!pid) return;
            if (allowedPageIds.has(pid)) {
              const route = routeForPage(p);
              if (route) allowed.add(route);
            }
          });
        } else {
          // no matching role found and not admin: no pages allowed (strict)
        }

        setAllowedPages(allowed);
      } catch (err) {
        console.error('Navbar load error', err);
      }
    };

    load();
  }, [orgData, userdata]);

  const isAdmin = ((user?.role || userdata?.role || '')).toString().toLowerCase() === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-logo" id="orgName">🏗️ {orgData?.organisationName || 'ConstructMate'}</div>

      <div className="hamburger" onClick={toggleMenu}>☰</div>

      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <li><Link to="/home" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
  {(isAdmin || allowedPages.has('/rolemanagement')) && <li><Link to="/rolemanagement" onClick={() => setMenuOpen(false)}>Role Management</Link></li>}
  {(isAdmin || allowedPages.has('/sites')) && <li><Link to="/sites" onClick={() => setMenuOpen(false)}>Site Management</Link></li>}
  {(isAdmin || allowedPages.has('/employees')) && <li><Link to="/employees" onClick={() => setMenuOpen(false)}>Employees</Link></li>}
  {(isAdmin || allowedPages.has('/generate-receipt')) && <li><Link to="/generate-receipt" onClick={() => setMenuOpen(false)}>Generate Receipt</Link></li>}
  {(isAdmin || allowedPages.has('/labour-payments')) && <li><Link to="/labour-payments" onClick={() => setMenuOpen(false)}>Labour Payments</Link></li>}
  {(isAdmin || allowedPages.has('/attendance')) && <li><Link to="/attendance" onClick={() => setMenuOpen(false)}>Attendance</Link></li>}
        <li><Link to="/" onClick={logout}>Logout</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
