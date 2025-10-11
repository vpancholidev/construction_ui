import React, { useEffect, useState } from 'react';
import Navbar from '../Component/Navbar';
import { useOrg } from '../Context/OrgContext';
import { addRole, getAllRoles } from '../api/roleApi';
import { useLoader } from '../Context/LoaderContext';
import './RoleManagement.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
function RoleManagement() {
  const [roleName, setRoleName] = useState('');
  const [roles, setRoles] = useState([]);
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

  useEffect(() => {
    let didLoad = false;
   
    const fetchRoles = async () => {
      if (didLoad) return; // prevent multiple calls
      didLoad = true;
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

    fetchRoles();
  }, []);

  return (
    <>
      <Navbar />
      <div className="role-container">
      <ToastContainer position="top-center" autoClose={3000} />
        <h2>Role Management</h2>
        <form className="role-form" onSubmit={handleAddRole}>
          <input
            type="text"
            placeholder="Enter Role Name"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
          <button type="submit">Add Role</button>
        </form>
        {error && <p className="error-msg">{error}</p>}

        <h3>Existing Roles</h3>
        <ul className="role-list">
          {roles.map((role, idx) => (
            <li key={idx}>{role.rolename}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default RoleManagement;
