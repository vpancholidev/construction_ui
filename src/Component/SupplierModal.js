import React, { useState } from 'react';
import { AddSuppliers } from '../api/receiptApi';
import { useLoader } from '../Context/LoaderContext';
import { ToastContainer, toast } from 'react-toastify';
import { useOrg } from '../Context/OrgContext';

const SupplierModal = ({ onSave, onClose }) => {
  const [supplierName, setSupplierName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showLoader, hideLoader } = useLoader();
  const { orgData } = useOrg();

  const handleSave = async () => {
    setError('');
    if (!supplierName.trim()) {
      setError('Supplier name is required');
      return;
    }

    const organisationId = orgData?.organisationId;
    if (!organisationId) {
      setError('Organisation context not available');
      return;
    }

    const payload = {
      supplierName: supplierName.trim(),
      organisationId
    };

    try {
      setSaving(true);
      showLoader();
      const res = await AddSuppliers(payload); // call to API
      const created = res?.data ?? null;

      toast.success('Supplier added successfully!');

      // notify parent to refresh (pass created supplier if available)
      if (typeof onSave === 'function') {
        try { onSave(created); } catch (e) { console.warn('onSave callback error', e); }
      }

      // reset and close modal
      setSupplierName('');
      setError('');
      if (typeof onClose === 'function') onClose();
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

  return (
    <>
      <ToastContainer position="top-center" autoClose={2500} />
      <div className="modal-overlay">
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-supplier-title">
          <h3 id="add-supplier-title">Add Supplier</h3>

          <input
            type="text"
            placeholder="Enter supplier name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            disabled={saving}
            autoFocus
          />
          {error && <p className="error-msg">{error}</p>}

          <div className="modal-actions">
            <button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierModal;
