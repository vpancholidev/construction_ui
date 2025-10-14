import React, { useState, useEffect, useCallback, useRef } from 'react';
import './GenerateReceipt.css';
import { FetchMaterialTypes, FetchSuppliers, FetchSites, SaveReceipt } from '../api/receiptApi';
import SupplierModal from './SupplierModal';
import { useLoader } from '../Context/LoaderContext';
import Navbar from '../Component/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';

function GenerateReceipt() {
  const didInitRef = useRef(false);
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

  // removed material modal states (we use separate page)
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const [receiptLink, setReceiptLink] = useState('');

  // fetch helpers
  const fetchSuppliers = useCallback(async () => {
    showLoader();
    try {
      const res = await FetchSuppliers();
      setSuppliers(res?.data || []);
      return res?.data || [];
    } catch (err) {
      console.error('Error loading suppliers:', err);
      return [];
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  const fetchMaterialTypes = useCallback(async () => {
    showLoader();
    try {
      const res = await FetchMaterialTypes();
      setMaterialTypes(res?.data || []);
      return res?.data || [];
    } catch (err) {
      console.error('Error loading material types:', err);
      return [];
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  const fetchSites = useCallback(async () => {
    showLoader();
    try {
      const res = await FetchSites();
      setSites(res?.data || []);
      return res?.data || [];
    } catch (err) {
      console.error('Error loading sites:', err);
      return [];
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  // initial load (guarded to avoid double calls in StrictMode)
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    let mounted = true;
    const fetchData = async () => {
      showLoader();
      try {
        const [matsRes, supsRes, siteListRes] = await Promise.all([
          FetchMaterialTypes(),
          FetchSuppliers(),
          FetchSites()
        ]);

        if (!mounted) return;

        setMaterialTypes(matsRes?.data || []);
        setSuppliers(supsRes?.data || []);
        setSites(siteListRes?.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        hideLoader();
      }
    };

    fetchData();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle createdMaterialId param when returning from material page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const createdMaterialId = params.get('createdMaterialId');
    if (!createdMaterialId) return;

    (async () => {
      // refresh material list and preselect
      const list = await fetchMaterialTypes();
      // attempt to find created id in the freshly fetched list
      const found = (list || []).find(m =>
        String(m.materialTypeId ?? m.id ?? m.MaterialTypeId ?? m.Id) === String(createdMaterialId)
      );
      if (found) {
        const id = found.materialTypeId ?? found.id ?? found.MaterialTypeId ?? found.Id;
        setForm(prev => ({ ...prev, materialId: String(id) }));
      } else {
        // set raw created id anyway
        setForm(prev => ({ ...prev, materialId: String(createdMaterialId) }));
      }
      // remove query param
      navigate(location.pathname, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // handle createdSupplierId param when returning from supplier page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const createdSupplierId = params.get('createdSupplierId');
    if (!createdSupplierId) return;

    (async () => {
      await fetchSuppliers();
      setForm(prev => ({ ...prev, supplierId: String(createdSupplierId) }));
      navigate(location.pathname, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Supplier modal flow callback
  const handleSupplierAdded = async (created) => {
    // If API returned created supplier, append/select it; otherwise reload list
    const createdId = created?.supplierId ?? created?.id ?? created?.SupplierId ?? created?.Id;
    const createdName = created?.supplierName ?? created?.name ?? created?.SupplierName;

    if (createdId && createdName) {
      // optimistic append
      setSuppliers(prev => [{ supplierId: createdId, supplierName: createdName, ...created }, ...prev]);
      setForm(prev => ({ ...prev, supplierId: String(createdId) }));
      return;
    }

    // fallback to full reload
    const list = await fetchSuppliers();
    if (createdName) {
      const match = (list || []).find(s => ((s.supplierName ?? s.name ?? s.SupplierName) || '').toLowerCase() === createdName.toLowerCase());
      if (match) {
        const matchId = match.supplierId ?? match.id ?? match.SupplierId ?? match.Id;
        setForm(prev => ({ ...prev, supplierId: String(matchId) }));
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

  // helper to render material options safely
  const renderMaterialOptions = () => {
    return materialTypes.map((m) => {
      const id = m.materialTypeId ?? m.id ?? m.MaterialTypeId ?? m.Id;
      const name = m.materialName ?? m.name ?? m.MaterialName ?? 'Unknown';
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
          <button
            onClick={() =>
              navigate(`/materials/create?returnTo=${encodeURIComponent(location.pathname)}`)
            }
          >
            + Add Material Type
          </button>

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
            {renderMaterialOptions()}
          </select>

          <select name="supplierId" value={form.supplierId} onChange={handleChange}>
            <option value="">Select Supplier</option>
            {renderSupplierOptions()}
          </select>

          <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} />
          <input type="number" name="rate" placeholder="Rate per Unit" value={form.rate} onChange={handleChange} />

          <select name="siteId" value={form.siteId} onChange={handleChange}>
            <option value="">Select Site</option>
            {sites.map(site => (
              <option key={site.siteId ?? site.id} value={site.siteId ?? site.id}>
                {site.sitename ?? site.name ?? site.siteName}
              </option>
            ))}
          </select>

          <input type="date" name="receiptDate" value={form.receiptDate} onChange={handleChange} />
          <textarea name="note" placeholder="Receipt Note" value={form.note} onChange={handleChange}></textarea>

          <button type="submit">Generate Receipt</button>
        </form>

        {/* Supplier modal still supported (optional modal flow) */}
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
