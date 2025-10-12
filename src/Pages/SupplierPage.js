// src/Pages/SupplierPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AddSuppliers, FetchSuppliers, UpdateSupplier } from '../api/receiptApi';
import { useLoader } from '../Context/LoaderContext';
import { useOrg } from '../Context/OrgContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../Component/Navbar';

export default function SupplierPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showLoader, hideLoader } = useLoader();
  const { orgData } = useOrg();

  const [supplierName, setSupplierName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editName, setEditName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '/generate-receipt';

  const handleBack = () => navigate(returnTo);

  // load supplier list
  const loadSuppliers = async () => {
    showLoader();
    try {
      const res = await FetchSuppliers();
      const list = (res?.data || []).map(s => ({
        id: s.supplierId ?? s.id ?? s.SupplierId ?? s.Id,
        name: s.supplierName ?? s.name ?? s.SupplierName ?? 'Unknown'
      }));
      setSuppliers(list);
    } catch (err) {
      console.error('Error loading suppliers:', err);
      toast.error('Failed to fetch suppliers');
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // ADD SUPPLIER
  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');

    if (!supplierName.trim()) {
      setError('Supplier name is required');
      return;
    }

    const payload = {
      supplierName: supplierName.trim(),
      organisationId: orgData?.organisationId
    };

    try {
      setSaving(true);
      showLoader();
      const res = await AddSuppliers(payload);
      toast.success('Supplier added successfully!');
      setSupplierName('');
      await loadSuppliers();
      await sleep(3000);
      hideLoader();
    } catch (err) {
      console.error('Add supplier error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        'Failed to add supplier';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  // EDIT SUPPLIER - open modal
  const handleEditClick = (supplier) => {
    setEditingSupplier(supplier);
    setEditName(supplier.name);
    setShowEditModal(true);
  };

  // SAVE EDIT
  const handleEditSave = async () => {
    if (!editName.trim()) {
      toast.error('Supplier name cannot be empty');
      return;
    }

    try {
      showLoader();
      const payload = {
        supplierId: editingSupplier.id,
        supplierName: editName.trim(),
        organisationId: orgData?.organisationId
      };
      await UpdateSupplier(payload);
      toast.success('Supplier updated successfully!');
      setShowEditModal(false);
      await loadSuppliers();
    } catch (err) {
      console.error('Update supplier error:', err);
      toast.error('Failed to update supplier');
    } finally {
      hideLoader();
    }
  };

  // FILTERED SUPPLIERS
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="generate-receipt-container" style={{ maxWidth: 720 }}>
        <ToastContainer position="top-center" autoClose={2500} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Supplier Management</h2>
          <button onClick={handleBack} style={{ padding: '8px 12px' }}>
            ← Back
          </button>
        </div>

        {/* ADD SUPPLIER FORM */}
        <form className="receipt-form" onSubmit={handleSave} style={{ marginTop: 16 }}>
          <input
            type="text"
            placeholder="Enter supplier name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            disabled={saving}
          />
          {error && <p className="error-msg">{error}</p>}

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Supplier'}
            </button>
          </div>
        </form>

        {/* SEARCH BOX */}
        <input
          type="text"
          placeholder="Search supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', marginTop: 20, padding: 8 }}
        />

        {/* SUPPLIER LIST */}
        <div style={{ marginTop: 20 }}>
          {filteredSuppliers.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ padding: 8, textAlign: 'left' }}>Supplier Name</th>
                  <th style={{ padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: 8 }}>{s.name}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleEditClick(s)}
                        style={{
                          padding: '4px 8px',
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
            <p style={{ textAlign: 'center', marginTop: 12 }}>No suppliers found.</p>
          )}
        </div>

        {/* EDIT MODAL */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Edit Supplier</h3>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button onClick={handleEditSave}>Save</button>
                <button onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
