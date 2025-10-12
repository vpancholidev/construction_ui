// src/Pages/SupplierPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AddSuppliers } from '../api/receiptApi';
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

  // returnTo is the page to go back to (e.g. /generate-receipt)
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '/generate-receipt';

  const handleBack = () => {
    // go back to the provided return path, keeping no extra query params
    navigate(returnTo);
  };
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const handleSave = async (e) => {
    e?.preventDefault();
    setError('');
    if (!supplierName.trim()) {
      setError('Supplier name is required');
      return;
    }
    // if (!orgData?.organisationId) {
    //   setError('Organisation context not available');
    //   return;
    // }

    const payload = {
      supplierName: supplierName.trim()
      //organisationId: orgData.organisationId
    };

    try {
      setSaving(true);
      showLoader();
      const res = await AddSuppliers(payload);
      const created = res?.data ?? null;

      toast.success('Supplier added successfully!');
      hideLoader();
     // wait 3 seconds to let user see the toast
      await sleep(3000);
      // If created id is available, navigate back and add it as query param so parent can auto-select
      const createdId = created?.supplierId ?? created?.id ?? created?.SupplierId ?? created?.Id;
      // Build return URL with createdSupplierId if we have it
      const separator = returnTo.includes('?') ? '&' : '?';
      const navigateUrl = createdId ? `${returnTo}${separator}createdSupplierId=${encodeURIComponent(createdId)}` : returnTo;

      // navigate back
      navigate(navigateUrl, { replace: true });
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
      <Navbar />
      <div className="generate-receipt-container" style={{ maxWidth: 720 }}>
        <ToastContainer position="top-center" autoClose={2500} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Add Supplier</h2>
          <button onClick={handleBack} style={{ padding: '8px 12px' }}>
            ← Back
          </button>
        </div>

        <form className="receipt-form" onSubmit={handleSave} style={{ marginTop: 16 }}>
          <input
            type="text"
            placeholder="Supplier name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            disabled={saving}
            autoFocus
          />
          {error && <p className="error-msg">{error}</p>}

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Supplier'}
            </button>
            <button type="button" onClick={handleBack} disabled={saving} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
