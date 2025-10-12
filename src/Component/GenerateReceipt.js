import React, { useState, useEffect, useCallback } from 'react';
import './GenerateReceipt.css';
import { FetchMaterialTypes, FetchSuppliers, FetchSites, SaveReceipt } from '../api/receiptApi';
import MaterialModal from './MaterialModal';
import SupplierModal from './SupplierModal';
import { useLoader } from '../Context/LoaderContext';
import Navbar from '../Component/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';

function GenerateReceipt() {
  const { showLoader, hideLoader } = useLoader();
  const navigate = useNavigate();
  const location = useLocation();

  const [materialTypes, setMaterialTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sites, setSites] = useState([]);

  const [form, setForm] = useState({
    materialId: '',
    supplierId: '',
    quantity: '',
    rate: '',
    siteId: '',
    receiptDate: '',
    note: ''
  });

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const [receiptLink, setReceiptLink] = useState('');

  // Reusable supplier fetcher (can be called from other places)
  const fetchSuppliers = useCallback(async () => {
    showLoader();
    try {
      const res = await FetchSuppliers();
      setSuppliers(res?.data || []);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  // Initial load: materials, suppliers, sites
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      showLoader();
      try {
        const [mats, sups, siteList] = await Promise.all([
          FetchMaterialTypes(),
          FetchSuppliers(),
          FetchSites()
        ]);

        if (!mounted) return;
        setMaterialTypes(mats?.data || []);
        setSuppliers(sups?.data || []);
        setSites(siteList?.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        hideLoader();
      }
    };

    fetchData();

    return () => { mounted = false; };
  }, [showLoader, hideLoader]);

  // Handle createdSupplierId param (when coming back from supplier page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const createdSupplierId = params.get('createdSupplierId');
    if (!createdSupplierId) return;

    (async () => {
      await fetchSuppliers();
      // set the supplier id (string) in form
      setForm(prev => ({ ...prev, supplierId: createdSupplierId }));
      // remove query param without reloading
      navigate(location.pathname, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Called when a supplier is added (modal flow)
  const handleSupplierAdded = async (created) => {
    // reload suppliers to get the authoritative list
    await fetchSuppliers();

    // try to determine id from created response
    const createdId = created?.supplierId ?? created?.id ?? created?.SupplierId ?? created?.Id;
    const createdName = created?.supplierName ?? created?.name ?? created?.SupplierName;

    if (createdId) {
      setForm(prev => ({ ...prev, supplierId: createdId }));
      return;
    }

    if (createdName) {
      // try to find by name in latest suppliers list
      const match = (suppliers || []).find(s =>
        ((s.supplierName ?? s.name ?? s.SupplierName) || '').toLowerCase() === createdName.toLowerCase()
      );
      if (match) {
        const matchId = match.supplierId ?? match.id ?? match.SupplierId ?? match.Id;
        setForm(prev => ({ ...prev, supplierId: matchId }));
      }
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const isValid = Object.values(form).every((val) => val !== '' && val !== null && val !== undefined);
    if (!isValid) {
      return alert('All fields are required.');
    }

    showLoader();
    try {
      const result = await SaveReceipt(form);
      alert('Receipt saved!');
      if (result?.data?.receiptUrl) {
        setReceiptLink(result.data.receiptUrl);
      }
      setForm({
        materialId: '',
        supplierId: '',
        quantity: '',
        rate: '',
        siteId: '',
        receiptDate: '',
        note: ''
      });
    } catch (err) {
      console.error('Error saving receipt:', err);
    } finally {
      hideLoader();
    }
  };

  // Helper to render supplier option values safely
  const renderSupplierOptions = () => {
    return suppliers.map((s) => {
      const id = s.supplierId ?? s.id ?? s.SupplierId ?? s.Id;
      const name = s.supplierName ?? s.name ?? s.SupplierName ?? 'Unknown';
      return (
        <option key={String(id)} value={String(id)}>
          {name}
        </option>
      );
    });
  };

  return (
    <>
      <Navbar />
      <div className="generate-receipt-container">
        <h2>Generate Receipt</h2>

        <div className="top-buttons">
          <button onClick={() => setShowMaterialModal(true)}>+ Add Material Type</button>
          <button
            onClick={() =>
              navigate(`/suppliers/create?returnTo=${encodeURIComponent(location.pathname)}`)
            }
          >
            + Add Supplier
          </button>
        </div>

        <form className="receipt-form" onSubmit={handleSave}>
          <p><strong>Total: ₹{(Number(form.quantity) * Number(form.rate)) || 0}</strong></p>

          <select name="materialId" value={form.materialId} onChange={handleChange}>
            <option value="">Select Material</option>
            {materialTypes.map((mat) => (
              <option key={mat.id ?? mat.materialId} value={mat.id ?? mat.materialId}>
                {mat.name ?? mat.materialName}
              </option>
            ))}
          </select>

          <select name="supplierId" value={form.supplierId} onChange={handleChange}>
            <option value="">Select Supplier</option>
            {renderSupplierOptions()}
          </select>

          <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} />
          <input type="number" name="rate" placeholder="Rate per Unit" value={form.rate} onChange={handleChange} />

          <select name="siteId" value={form.siteId} onChange={handleChange}>
            <option value="">Select Site</option>
            {sites.map((site) => (
              <option key={site.id ?? site.siteId} value={site.id ?? site.siteId}>
                {site.name ?? site.siteName}
              </option>
            ))}
          </select>

          <input type="date" name="receiptDate" value={form.receiptDate} onChange={handleChange} />
          <textarea name="note" placeholder="Receipt Note" value={form.note} onChange={handleChange}></textarea>

          <button type="submit">Generate Receipt</button>
        </form>

        {showMaterialModal && <MaterialModal onClose={() => setShowMaterialModal(false)} />}
        {showSupplierModal &&
          <SupplierModal
            onSave={handleSupplierAdded}
            onClose={() => setShowSupplierModal(false)}
          />
        }
      </div>
    </>
  );
}

export default GenerateReceipt;
