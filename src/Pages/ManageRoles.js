import React, { useEffect, useState } from 'react';
import Navbar from '../Component/Navbar';
import { useLoader } from '../Context/LoaderContext';
import { useOrg } from '../Context/OrgContext';
import { addRole, getAllRoles, updateRole } from '../api/roleApi';
import { useNavigate } from 'react-router-dom';
import './ManagePages.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ManageRoles() {
  const [roleName, setRoleName] = useState('');
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(null);
  const { showLoader, hideLoader } = useLoader();
  const { orgData } = useOrg();
  const navigate = useNavigate();

  const fetchRoles = async () => {
    showLoader();
    try {
      const resp = await getAllRoles(orgData?.organisationId);
      setRoles(resp.data || []);
    } catch (err) {
      toast.error('Failed to fetch roles');
    } finally {
      hideLoader();
    }
  };

  useEffect(() => { fetchRoles(); }, [orgData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!roleName) return toast.error('Role name required');
    showLoader();
    try {
      if (editing) {
        await updateRole({ roleid: editing, RoleName: roleName, Organisationid: orgData?.organisationId });
        toast.success('Role updated');
        setEditing(null);
      } else {
        await addRole({ RoleName: roleName, Organisationid: orgData?.organisationId });
        toast.success('Role added');
      }
      setRoleName('');
      await fetchRoles();
    } catch (err) {
      toast.error(editing ? 'Failed to update role' : 'Failed to add role');
    } finally { hideLoader(); }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <ToastContainer position="top-center" autoClose={3000} />
        <h2>Manage Roles</h2>
        <form onSubmit={handleAdd} className="simple-form">
          <input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="Role name" />
          <button type="submit">{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setRoleName(''); }}>Cancel</button>}
        </form>
        <ul className="role-list">
          {roles.map(r => (
            <li key={r.roleid || r.id}>
              <span>{r.rolename}</span>
              <div>
                <button onClick={() => { setEditing(r.roleid || r.id); setRoleName(r.rolename); }} className="btn small">Edit</button>
              </div>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
        </div>
      </div>
    </>
  );
}
