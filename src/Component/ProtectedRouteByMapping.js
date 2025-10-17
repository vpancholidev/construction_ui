import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getUserFromToken } from '../Utils/jwtHelper';
import { useOrg } from '../Context/OrgContext';
import { getAllRolePageMappings, getAllPages, getAllRoles } from '../api/roleApi';

// Protects a route based on server role->page mappings.
// Props:
// - pageKeyword: string used to match pages (case-insensitive substring match against pageName)
// Usage: <ProtectedRouteByMapping pageKeyword="employee"><EmployeeManagement/></ProtectedRouteByMapping>
export default function ProtectedRouteByMapping({ children, pageKeyword }) {
  const user = getUserFromToken();
  const { userdata, orgData } = useOrg();
  const [allowed, setAllowed] = useState(null); // null=pending, true/false resolved

  useEffect(() => {
    const check = async () => {
      try {
        if (!user && !userdata) {
          setAllowed(false);
          return;
        }
        const orgId = orgData?.organisationId;
        if (!orgId) {
          // orgData not available yet (page reload / direct URL).
          // Don't deny immediately; wait for orgData to populate and effect to re-run.
          return;
        }

        // admin bypass
        const roleName = (user?.role || userdata?.role || '').toString().toLowerCase();
        if (roleName === 'admin') {
          setAllowed(true);
          return;
        }

        const [pagesResp, mapsResp, rolesResp] = await Promise.all([
          getAllPages(orgId),
          getAllRolePageMappings(),
          getAllRoles(orgId)
        ]);

        const pageList = pagesResp.data || [];
        const mappings = mapsResp.data || [];
        const rolesList = rolesResp.data || [];

        // normalize role->pageIds
        const roleToPages = {};
        mappings.forEach(m => {
          const rid = m.roleid || m.roleId || m.role;
          const pids = m.pageIds || (m.pageid ? [m.pageid] : (m.pageId ? [m.pageId] : []));
          if (!rid) return;
          roleToPages[rid] = roleToPages[rid] || new Set();
          pids.forEach(p => roleToPages[rid].add(p));
        });

        // find matched role object
        const matchedRole = rolesList.find(r => ((r.rolename || r.roleName || '')).toString().toLowerCase() === roleName);
        if (!matchedRole) {
          setAllowed(false);
          return;
        }

        const rid = matchedRole.roleid || matchedRole.id || matchedRole.roleId;
        const allowedPageIds = roleToPages[rid] || new Set();

        // find page ids matching pageKeyword
        const keyword = (pageKeyword || '').toString().toLowerCase();
        const matchingPageIds = new Set();
        pageList.forEach(p => {
          const pname = (p.pageName || p.pagename || p.name || '').toString().toLowerCase();
          if (!keyword) return;
          if (pname.includes(keyword)) {
            const pid = p.pageId || p.pageid || p.id;
            if (pid) matchingPageIds.add(pid);
          }
        });

        // if no pages matched keyword, deny by strict policy
        if (matchingPageIds.size === 0) {
          setAllowed(false);
          return;
        }

        // check intersection
        let ok = false;
        matchingPageIds.forEach(pid => {
          if (allowedPageIds.has(pid)) ok = true;
        });

        setAllowed(ok);
      } catch (err) {
        console.error('ProtectedRouteByMapping error', err);
        setAllowed(false);
      }
    };

    check();
  }, [orgData, userdata, user, pageKeyword]);

  if (!user && !userdata) return <Navigate to="/" />;
  if (allowed === null) return null; // or a loader
  if (allowed === true) return <Outlet />;
  return <Navigate to="/unauthorized" />;
}
