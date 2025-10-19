import React, { useEffect, useState } from 'react';
import Navbar from '../Component/Navbar';
import { useLoader } from '../Context/LoaderContext';
import { useOrg } from '../Context/OrgContext';
import { addRole, getAllRoles, updateRole, updateRoleRanks } from '../api/roleApi';
import { useNavigate } from 'react-router-dom';
import './ManagePages.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable role item component
function SortableRoleItem({ role, onEdit, isAdmin }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.roleid || role.id, disabled: isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className={`role-item-draggable ${isAdmin ? 'role-admin-locked' : ''}`}>
      <div className={`drag-handle ${isAdmin ? 'drag-disabled' : ''}`} {...attributes} {...listeners}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </div>
      <span className="role-name">
        {role.rolename}
        <small className="role-rank">Rank: {role.rank ?? 'N/A'}</small>
      </span>
      <div>
        {!isAdmin && <button onClick={onEdit} className="btn small">Edit</button>}
        {isAdmin && <span className="role-locked-badge">Protected</span>}
      </div>
    </li>
  );
}

export default function ManageRoles() {
  const [roleName, setRoleName] = useState('');
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(null);
  const { showLoader, hideLoader } = useLoader();
  const { orgData } = useOrg();
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchRoles = async () => {
    showLoader();
    try {
      const resp = await getAllRoles(orgData?.organisationId);
      // Sort roles by rank (lowest first)
      const sorted = (resp.data || []).sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
      setRoles(sorted);
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
        // Find the role being edited to preserve its rank
        const currentRole = roles.find(r => (r.roleid || r.id) === editing);
        await updateRole({ 
          roleid: editing, 
          RoleName: roleName, 
          Organisationid: orgData?.organisationId,
          Rank: currentRole?.rank // Preserve current rank
        });
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

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = roles.findIndex(r => (r.roleid || r.id) === active.id);
    const newIndex = roles.findIndex(r => (r.roleid || r.id) === over.id);

    const reordered = arrayMove(roles, oldIndex, newIndex);

    // Compute new ranks based on position (1-indexed)
    const updatedRoles = reordered.map((role, idx) => ({
      ...role,
      rank: idx + 1,
    }));

    setRoles(updatedRoles);

    // Call API to update ranks
    showLoader();
    try {
      const payload = updatedRoles.map(r => ({
        Roleid: r.roleid || r.id,
        Rolename: r.rolename,
        Organisationid: orgData?.organisationId,
        Rank: r.rank,
      }));
      await updateRoleRanks(payload);
      toast.success('Role ranks updated');
    } catch (err) {
      toast.error('Failed to update role ranks');
      // Revert on error
      await fetchRoles();
    } finally {
      hideLoader();
    }
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
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={roles.map(r => r.roleid || r.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="role-list">
              {roles.map(r => {
                const isAdmin = (r.rolename || '').toLowerCase() === 'admin';
                return (
                  <SortableRoleItem
                    key={r.roleid || r.id}
                    role={r}
                    isAdmin={isAdmin}
                    onEdit={() => { setEditing(r.roleid || r.id); setRoleName(r.rolename); }}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>

        <div style={{ marginTop: 12 }}>
          <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
        </div>
      </div>
    </>
  );
}
