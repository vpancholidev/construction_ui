import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../Component/Navbar';
import { useOrg } from '../Context/OrgContext';
import { addRole, getAllRoles, getAllPages, addPage, getAllRolePageMappings, updateRolePageMapping } from '../api/roleApi';
import { useLoader } from '../Context/LoaderContext';
import './RoleManagement.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
function RoleManagement() {
  const [roleName, setRoleName] = useState('');
  const [roles, setRoles] = useState([]);
  const [pages, setPages] = useState([]);
  const [pageName, setPageName] = useState('');
  const [mappings, setMappings] = useState({}); // { roleid: Set(pageId) }
  const [error, setError] = useState('');
  const { showLoader, hideLoader } = useLoader();
  const { orgData } = useOrg();
  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!roleName) return setError("Role name is required");

    showLoader();
    try {
      const payload = {
        RoleName: roleName,
        Organisationid: orgData?.organisationId
      };

      await addRole(payload);
      setRoleName('');
      fetchRoles(); // reload
    } catch (err) {
      toast.error('Failed to add role');
    } finally {
      hideLoader();
    }
  };

  const fetchRoles = async () => {
    showLoader();
    try {
      const response = await getAllRoles(orgData?.organisationId);
      setRoles(response.data || []);
    } catch {
      toast.error('Failed to fetch roles');
    } finally {
      hideLoader();
    }
  };
  const lastFetchedOrgRef = useRef(null);

  useEffect(() => {
    const loadAll = async () => {
      const orgId = orgData?.organisationId;
      if (!orgId) return;
      if (lastFetchedOrgRef.current === orgId) return;
      lastFetchedOrgRef.current = orgId;
      showLoader();
      try {
        // roles
        const rolesResp = await getAllRoles(orgId);
        setRoles(rolesResp.data || []);
        // pages
        const pagesResp = await getAllPages(orgId);
        setPages(pagesResp.data || []);
        // mappings
        const mapResp = await getAllRolePageMappings();
        // normalize mappings to { roleid: Set(pageId) }
        const mapObj = {};
        (mapResp.data || []).forEach(m => {
          // expect m to have roleid and pageid or pageIds
          const rid = m.roleid || m.roleId || m.roleID || m.role;
          const pid = m.pageid || m.pageId || m.pageID || m.page;
          if (rid && pid) {
            mapObj[rid] = mapObj[rid] || new Set();
            mapObj[rid].add(pid);
          }
          // if mapping contains array
          if (rid && Array.isArray(m.pageIds)) {
            mapObj[rid] = mapObj[rid] || new Set();
            m.pageIds.forEach(p => mapObj[rid].add(p));
          }
        });
        setMappings(mapObj);
      } catch (err) {
        console.error('RoleManagement load error', err);
        toast.error('Failed to load role/page data');
      } finally {
        hideLoader();
      }
    };

    loadAll();
  }, [orgData]);

  // helper to check mapping
  const isMapped = (roleid, pageid) => {
    return mappings[roleid] && mappings[roleid].has(pageid);
  };

  const toggleMapping = (roleid, pageid) => {
    setMappings(prev => {
      const next = { ...prev };
      next[roleid] = new Set(next[roleid] ? Array.from(next[roleid]) : []);
      if (next[roleid].has(pageid)) next[roleid].delete(pageid);
      else next[roleid].add(pageid);
      return next;
    });
  };

  const handleSaveMappings = async () => {
    showLoader();
    try {
      // build payload: [{ roleid, pageIds: [] }, ...]
      // exclude admin-like roles from payload
      const isAdminLike = (role) => {
        const name = (role?.rolename || role?.roleName || '').toString().toLowerCase();
        return name === 'admin' || name === 'administrator' || name === 'super-admin' || name === 'superadmin';
      };
      const payload = Object.keys(mappings)
        .filter(rid => {
          const role = roles.find(rr => (rr.roleid || rr.id || '').toString() === rid.toString());
          return !isAdminLike(role);
        })
        .map(rid => ({ roleid: rid, pageIds: Array.from(mappings[rid]) }));
      const body = { organisationId: orgData?.organisationId, mappings: payload };
      await updateRolePageMapping(body);
      toast.success('Mappings saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save mappings');
    } finally {
      hideLoader();
    }
  };

  const handleAddPage = async (e) => {
    e.preventDefault();
    if (!pageName) return toast.error('Page name required');
    showLoader();
    try {
      const payload = { pagename: pageName, organisationId: orgData?.organisationId };
      await addPage(payload);
      setPageName('');
      // reload pages
      const pagesResp = await getAllPages(orgData?.organisationId);
      setPages(pagesResp.data || []);
      toast.success('Page added');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add page');
    } finally {
      hideLoader();
    }
  };

  return (
    <>
      <Navbar />
      <div className="role-container">
      <ToastContainer position="top-center" autoClose={3000} />
        <div className="role-header">
          <h2>Role Management</h2>
          <div>
            <button onClick={() => window.location.href = '/ManageRoles'} style={{ marginRight: 8 }}>Manage Roles</button>
            <button onClick={() => window.location.href = '/ManagePages'}>Manage Pages</button>
          </div>
        </div>
        {error && <p className="error-msg">{error}</p>}

  <h3>Role - Page Mapping</h3>
        <div className="mapping-grid">
          <table className="mapping-table">
            <thead>
              <tr>
                <th>Role \ Page</th>
        {pages.map(p => <th key={p.pageId || p.pageid || p.id}>{p.pageName || p.pagename || p.name}</th>)}
              </tr>
            </thead>
              <tbody>
                {roles.filter(r => {
                  const name = (r.rolename || r.roleName || '').toString().toLowerCase();
                  return !(name === 'admin' || name === 'administrator' || name === 'super-admin' || name === 'superadmin');
                }).map(r => (
                  <tr key={r.roleid || r.id}>
                    <td>{r.rolename}</td>
                    {pages.map(p => {
                      const pid = p.pageId || p.pageid || p.id;
                      const rid = r.roleid || r.id;
                      return (
                        <td key={pid}>
                          <input type="checkbox" checked={isMapped(rid, pid)} onChange={() => toggleMapping(rid, pid)} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
          </table>
          <div style={{ marginTop: 8 }}>
            <button onClick={handleSaveMappings}>Save Mappings</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default RoleManagement;
