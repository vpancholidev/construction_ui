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

  // Add form state (new fields included)
  const [supplierName, setSupplierName] = useState('');
  const [supplierContactPerson, setSupplierContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // list + search
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // edit modal state
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editPayload, setEditPayload] = useState({
    supplierName: '',
    supplierContactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    notes: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '/generate-receipt';

  const handleBack = () => navigate(returnTo);

  // Normalize supplier objects for consistent rendering
  const normalizeSuppliers = (raw = []) =>
    (raw || []).map(s => ({
      id: s.supplierId ?? s.id ?? s.SupplierId ?? s.Id,
      name: s.supplierName ?? s.name ?? s.SupplierName ?? 'Unknown',
      supplierContactPerson: s.supplierContactPerson ?? s.contactPerson ?? s.SupplierContactPerson ?? '',
      phoneNumber: s.phoneNumber ?? s.PhoneNumber ?? s.mobile ?? '',
      email: s.email ?? s.Email ?? '',
      address: s.address ?? s.Address ?? '',
      notes: s.notes ?? s.Notes ?? '',
      raw: s
    }));

  // load supplier list
  const loadSuppliers = async () => {
    showLoader();
    try {
      const res = await FetchSuppliers(orgData?.organisationId);
      const list = normalizeSuppliers(res?.data || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      organisationId: orgData?.organisationId,
      supplierContactPerson: supplierContactPerson?.trim() || null,
      phoneNumber: phoneNumber?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null
    };

    try {
      setSaving(true);
      showLoader();
      const res = await AddSuppliers(payload);
      const created = res?.data ?? null;

      toast.success('Supplier added successfully!');
      // Optimistically append the created supplier if returned by API
      if (created) {
        const added = normalizeSuppliers([created])[0];
        setSuppliers(prev => [added, ...prev]);
      } else {
        // fallback: reload full list
        await loadSuppliers();
      }

      // reset add form
      setSupplierName('');
      setSupplierContactPerson('');
      setPhoneNumber('');
      setEmail('');
      setAddress('');
      setNotes('');
    } catch (err) {
      console.error('Add supplier error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to add supplier';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      hideLoader();
    }
  };

  // EDIT: open modal with existing values
  const handleEditClick = (supplier) => {
    setEditingSupplier(supplier);
    setEditPayload({
      supplierName: supplier.name || '',
      supplierContactPerson: supplier.supplierContactPerson || '',
      phoneNumber: supplier.phoneNumber || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || ''
    });
    setShowEditModal(true);
  };

  // EDIT: save changes
  const handleEditSave = async () => {
    if (!editingSupplier) return;
    if (!editPayload.supplierName.trim()) {
      toast.error('Supplier name cannot be empty');
      return;
    }

    const payload = {
      supplierId: editingSupplier.id,
      supplierName: editPayload.supplierName.trim(),
      organisationId: orgData?.organisationId,
      supplierContactPerson: editPayload.supplierContactPerson?.trim() || null,
      phoneNumber: editPayload.phoneNumber?.trim() || null,
      email: editPayload.email?.trim() || null,
      address: editPayload.address?.trim() || null,
      notes: editPayload.notes?.trim() || null
    };

    try {
      setEditSaving(true);
      showLoader();
      const res = await UpdateSupplier(payload);
      const updated = res?.data ?? null;

      toast.success('Supplier updated successfully!');

      if (updated) {
        // update local suppliers list with the returned object
        const normalized = normalizeSuppliers([updated])[0];
        setSuppliers(prev => prev.map(s => (String(s.id) === String(normalized.id) ? normalized : s)));
      } else {
        // fallback: reload list
        await loadSuppliers();
      }

      setShowEditModal(false);
      setEditingSupplier(null);
    } catch (err) {
      console.error('Update supplier error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to update supplier';
      toast.error(msg);
    } finally {
      setEditSaving(false);
      hideLoader();
    }
  };

  // Filter suppliers by name, contact person, or email
  const filteredSuppliers = suppliers.filter(s => {
    const q = (searchTerm || '').toLowerCase();
    if (!q) return true;
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.supplierContactPerson || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Navbar />
      <div className="generate-receipt-container" style={{ maxWidth: 880 }}>
        <ToastContainer position="top-center" autoClose={2500} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Supplier Management</h2>
          <button onClick={handleBack} style={{ padding: '8px 12px' }}>
            ← Back
          </button>
        </div>

        {/* ADD SUPPLIER FORM */}
        <form className="receipt-form" onSubmit={handleSave} style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              type="text"
              placeholder="Supplier name *"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              disabled={saving}
            />
            <input
              type="text"
              placeholder="Contact person"
              value={supplierContactPerson}
              onChange={(e) => setSupplierContactPerson(e.target.value)}
              disabled={saving}
            />
            <input
              type="text"
              placeholder="Phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={saving}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
            />
            <input
              type="text"
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
            />
          </div>

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
          placeholder="Search supplier by name, contact, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', marginTop: 18, padding: 8 }}
        />

        {/* SUPPLIER LIST */}
        <div style={{ marginTop: 16 }}>
          {filteredSuppliers.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Contact Person</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Phone / Email</th>
                  <th style={{ padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #e6e6e6' }}>
                    <td style={{ padding: 8 }}>{s.name}</td>
                    <td style={{ padding: 8 }}>{s.supplierContactPerson}</td>
                    <td style={{ padding: 8 }}>
                      <div>{s.phoneNumber}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{s.email}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleEditClick(s)}
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
            <p style={{ textAlign: 'center', marginTop: 12 }}>No suppliers found.</p>
          )}
        </div>

        {showEditModal && (
  <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-supplier-title">
    <div className="modal">
      <h3 id="edit-supplier-title">Edit Supplier</h3>

      <div className="modal-form-grid">
        {/* Name */}
        <input
          type="text"
          value={editPayload.supplierName}
          onChange={(e) => setEditPayload(prev => ({ ...prev, supplierName: e.target.value }))}
          placeholder="Supplier name *"
          autoFocus
        />

        {/* Contact Person */}
        <input
          type="text"
          value={editPayload.supplierContactPerson}
          onChange={(e) => setEditPayload(prev => ({ ...prev, supplierContactPerson: e.target.value }))}
          placeholder="Contact person"
        />

        {/* Phone */}
        <input
          type="tel"
          value={editPayload.phoneNumber}
          onChange={(e) => setEditPayload(prev => ({ ...prev, phoneNumber: e.target.value }))}
          placeholder="Phone number"
        />

        {/* Email */}
        <input
          type="email"
          value={editPayload.email}
          onChange={(e) => setEditPayload(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
        />

        {/* Address full width */}
        <input
          className="grid-full"
          type="text"
          value={editPayload.address}
          onChange={(e) => setEditPayload(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Address"
        />

        {/* Notes full width */}
        <input
          className="grid-full"
          type="text"
          value={editPayload.notes}
          onChange={(e) => setEditPayload(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Notes"
        />
      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="save"
          onClick={handleEditSave}
          disabled={editSaving}
        >
          {editSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="cancel"
          onClick={() => { setShowEditModal(false); setEditingSupplier(null); }}
          disabled={editSaving}
        >
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
