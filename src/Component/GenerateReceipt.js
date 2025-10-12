import React, { useState, useEffect } from 'react';
import './GenerateReceipt.css';
import { FetchMaterialTypes, FetchSuppliers, FetchSites, SaveReceipt } from '../api/receiptApi';
import MaterialModal from './MaterialModal';
import SupplierModal from './SupplierModal';
import { useLoader } from '../Context/LoaderContext';
import Navbar from '../Component/Navbar';

function GenerateReceipt() {
  const { showLoader, hideLoader } = useLoader();

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

  useEffect(() => {
    const fetchData = async () => {
      showLoader();
      try {
        const [mats, sups, siteList] = await Promise.all([
          FetchMaterialTypes(),
          FetchSuppliers(),
          FetchSites()
        ]);

        setMaterialTypes(mats.data || []);
        setSuppliers(sups.data || []);
        setSites(siteList.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        hideLoader();
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isValid = Object.values(form).every((val) => val);
    if (!isValid) return alert('All fields are required.');

    showLoader();
    try {
     const result = await SaveReceipt(form);
      alert('Receipt saved!');
      if (result.data?.receiptUrl) {
        setReceiptLink(result.data.receiptUrl); // ← set receipt link here
      }
      setForm({ materialId: '', supplierId: '', quantity: '', rate: '', siteId: '', receiptDate: '', note: '' });
    } catch (err) {
      console.error('Error saving receipt:', err);
    } finally {
      hideLoader();
    }
  };
  const [formData, setFormData] = useState({
    materialType: '',
    supplier: '',
    quantity: '',
    ratePerUnit: '',
    site: '',
    receiptDate: '',
    note: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.materialType) newErrors.materialType = 'Material type is required';
    if (!formData.supplier) newErrors.supplier = 'Supplier is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Enter a valid quantity';
    if (!formData.ratePerUnit || formData.ratePerUnit <= 0) newErrors.ratePerUnit = 'Enter a valid rate';
    if (!formData.site) newErrors.site = 'Please select a site';
    if (!formData.receiptDate) newErrors.receiptDate = 'Receipt date is required';
    if (!formData.note || formData.note.length < 5) newErrors.note = 'Note must be at least 5 characters long';
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Call API or handle success
      console.log('Form is valid, submit data:', formData);
    }
  };
  
  const [receiptLink, setReceiptLink] = useState('');

  // Extract fetching suppliers into its own function so we can call it on demand
  const fetchSuppliers = async () => {
    showLoader();
    try {
      const sups = await FetchSuppliers();
      setSuppliers(sups.data || []);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      showLoader();
      try {
        const [mats, sups, siteList] = await Promise.all([
          FetchMaterialTypes(),
          FetchSuppliers(),
          FetchSites()
        ]);

        setMaterialTypes(mats.data || []);
        setSuppliers(sups.data || []);
        setSites(siteList.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        hideLoader();
      }
    };

    fetchData();
  }, []);

  // Called by SupplierModal when a supplier is successfully created.
  // "created" may be null if API didn't return the created object.
  const handleSupplierAdded = async (created) => {
    // simplest approach: reload the supplier list from server
    await fetchSuppliers();

    // if API returned created supplier with id, auto-select it in the form
    const createdId = created?.supplierId ?? created?.id ?? created?.SupplierId ?? created?.Id;
    const createdName = created?.supplierName ?? created?.name ?? created?.SupplierName;

    if (createdId) {
      setForm(prev => ({ ...prev, supplierId: createdId }));
    } else if (createdName) {
      // fallback: try to find by name and select first match
      const match = (suppliers || []).find(s => (s.supplierName ?? s.name ?? s.SupplierName)?.toLowerCase() === createdName.toLowerCase());
      if (match) setForm(prev => ({ ...prev, supplierId: match.id ?? match.supplierId ?? match.SupplierId }));
    }
  };

  return (
    <>
  <Navbar />
    <div className="generate-receipt-container">
      <h2>Generate Receipt</h2>
      <div className="top-buttons">
        <button onClick={() => setShowMaterialModal(true)}>+ Add Material Type</button>
         <br></br>
        <button onClick={() => setShowSupplierModal(true)}>+ Add Supplier</button>
      </div>

      <form className="receipt-form" onSubmit={handleSave}>
      <p><strong>Total: ₹{formData.quantity * formData.ratePerUnit || 0}</strong></p>

        <select name="materialId" value={form.materialId} onChange={handleChange}>
          <option value="">Select Material</option>
          {materialTypes.map((mat) => (
            <option key={mat.id} value={mat.id}>{mat.name}</option>
          ))}
        </select>

        <select name="supplierId" value={form.supplierId} onChange={handleChange}>
          <option value="">Select Supplier</option>
          {suppliers.map((sup) => (
            <option key={sup.id} value={sup.id}>{sup.name}</option>
          ))}
        </select>
        {errors.materialType && <p className="error-msg">{errors.materialType}</p>}
        <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} />
        {errors.quantity && <p className="error-msg">{errors.quantity}</p>}
        <input type="number" name="rate" placeholder="Rate per Unit" value={form.rate} onChange={handleChange} />
        {errors.ratePerUnit && <p className="error-msg">{errors.ratePerUnit}</p>}
        <select name="siteId" value={form.siteId} onChange={handleChange}>
          <option value="">Select Site</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
        </select>
        {errors.site && <p className="error-msg">{errors.site}</p>}
        <input type="date" name="receiptDate" value={form.receiptDate} onChange={handleChange} />
        {errors.receiptDate && <p className="error-msg">{errors.receiptDate}</p>}
        <textarea name="note" placeholder="Receipt Note" value={form.note} onChange={handleChange}></textarea>
        {errors.note && <p className="error-msg">{errors.note}</p>}
        <button type="submit">Generate Receipt</button>
      </form>

      {showMaterialModal && <MaterialModal onClose={() => setShowMaterialModal(false)} />}
      {showSupplierModal && <SupplierModal onClose={() => setShowSupplierModal(false)} />}
    </div>
    </>
  );
}

export default GenerateReceipt;
