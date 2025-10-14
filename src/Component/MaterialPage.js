import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AddMaterialType, FetchMaterialTypes, UpdateMaterialType } from '../api/receiptApi';
import { useLoader } from '../Context/LoaderContext';
import { useOrg } from '../Context/OrgContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../Component/Navbar';

export default function MaterialPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showLoader, hideLoader } = useLoader();
  const { orgData } = useOrg();

  // Form fields
  const [materialName, setMaterialName] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Material List
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editPayload, setEditPayload] = useState({ materialName: '', defaultUnit: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '/generate-receipt';

  const handleBack = () => navigate(returnTo);

  // Normalize server response
  const normalizeMaterials = (raw = []) =>
    (raw || []).map(m => ({
      id: m.materialTypeId ?? m.id ?? m.MaterialTypeId ?? m.Id,
      name: m.materialName ?? m.name ?? m.MaterialName ?? 'Unknown',
      defaultUnit: m.defaultUnit ?? m.unit ?? m.DefaultUnit ?? '',
      createdDate: m.createdDate ?? m.CreatedDate,
      updatedDate: m.updatedDate ?? m.UpdatedDate
    }));

  // Fetch all materials
  const loadMaterials = async () => {
    showLoader();
    try {
      const res = await FetchMaterialTypes(orgData?.organisationId);
      setMaterials(normalizeMaterials(res?.data || []));
    } catch (err) {
      console.error('Error fetching materials:', err);
      toast.error('Failed to load material types');
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add new material
  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');

    if (!materialName.trim()) {
      setError('Material name is required');
      return;
    }

    const payload = {
      materialName: materialName.trim(),
      defaultUnit: defaultUnit.trim() || null,
      organisationId: orgData?.organisationId
    };

    try {
      setSaving(true);
      showLoader();
      const res = await AddMaterialType(payload);
      const created = res?.data ?? null;
      toast.success('Material type added successfully!');

      if (created) {
        const newItem = normalizeMaterials([created])[0];
        setMaterials(prev => [newItem, ...prev]);
      } else {
        await loadMaterials();
      }

      // reset form
      setMaterialName('');
      setDefaultUnit('');
    } catch (err) {
      console.error('Add material error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to add material type';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  // Edit flow
  const handleEditClick = (m) => {
    setEditingMaterial(m);
    setEditPayload({ materialName: m.name, defaultUnit: m.defaultUnit });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editingMaterial) return;
    if (!editPayload.materialName.trim()) {
      toast.error('Material name is required');
      return;
    }

    const payload = {
      materialTypeId: editingMaterial.id,
      materialName: editPayload.materialName.trim(),
      defaultUnit: editPayload.defaultUnit.trim() || null,
      organisationId: orgData?.organisationId
    };

    try {
      setEditSaving(true);
      showLoader();
      const res = await UpdateMaterialType(payload);
      const updated = res?.data ?? null;
      toast.success('Material type updated successfully!');

      if (updated) {
        const norm = normalizeMaterials([updated])[0];
        setMaterials(prev =>
          prev.map(m => (String(m.id) === String(norm.id) ? norm : m))
        );
      } else {
        await loadMaterials();
      }

      setShowEditModal(false);
      setEditingMaterial(null);
    } catch (err) {
      console.error('Update material error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to update material type';
      toast.error(msg);
    } finally {
      setEditSaving(false);
      hideLoader();
    }
  };

  // Filtered list
  const filteredMaterials = materials.filter(m => {
    const q = (searchTerm || '').toLowerCase();
    if (!q) return true;
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.defaultUnit || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Navbar />
      <div className="generate-receipt-container" style={{ maxWidth: 880 }}>
        <ToastContainer position="top-center" autoClose={2500} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Material Type Management</h2>
          <button onClick={handleBack} style={{ padding: '8px 12px' }}>← Back</button>
        </div>

        {/* ADD FORM */}
        <form className="receipt-form" onSubmit={handleSave} style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              type="text"
              placeholder="Material Name *"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              disabled={saving}
            />
            <input
              type="text"
              placeholder="Default Unit (e.g., kg, bags)"
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value)}
              disabled={saving}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Material Type'}
            </button>
          </div>
        </form>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search by material name or unit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', marginTop: 18, padding: 8 }}
        />

        {/* LIST */}
        <div style={{ marginTop: 16 }}>
          {filteredMaterials.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ padding: 8, textAlign: 'left' }}>Material Name</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Default Unit</th>
                  <th style={{ padding: 8, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #e6e6e6' }}>
                    <td style={{ padding: 8 }}>{m.name}</td>
                    <td style={{ padding: 8 }}>{m.defaultUnit}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleEditClick(m)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', marginTop: 12 }}>No materials found.</p>
          )}
        </div>

        {/* EDIT MODAL */}
        {showEditModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-material-title">
            <div className="modal">
              <h3 id="edit-material-title">Edit Material Type</h3>

              <div className="modal-form-grid">
                <input
                  type="text"
                  value={editPayload.materialName}
                  onChange={(e) => setEditPayload(prev => ({ ...prev, materialName: e.target.value }))}
                  placeholder="Material Name *"
                  autoFocus
                />
                <input
                  type="text"
                  value={editPayload.defaultUnit}
                  onChange={(e) => setEditPayload(prev => ({ ...prev, defaultUnit: e.target.value }))}
                  placeholder="Default Unit"
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setShowEditModal(false)} disabled={editSaving}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
