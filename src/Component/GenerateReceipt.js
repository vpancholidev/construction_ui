import React, { useState, useEffect, useCallback, useRef } from 'react';
import './GenerateReceipt.css';
import {
  FetchMaterialTypes,
  FetchSuppliers,
  FetchSites,
  FetchReceipts,
  AddReceipt,
  UpdateReceipt,
} from '../api/receiptApi';
import { useLoader } from '../Context/LoaderContext';
import Navbar from '../Component/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useOrg } from '../Context/OrgContext';

const PAYMENT_OPTIONS = ['Pending', 'Done'];

export default function GenerateReceipt() {
  const didInitRef = useRef(false);
  const { showLoader, hideLoader } = useLoader();
  const navigate = useNavigate();
  const location = useLocation();

  const [materialTypes, setMaterialTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sites, setSites] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const { orgData } = useOrg();

  const [form, setForm] = useState({
    receiptDate: new Date().toISOString().slice(0, 10),
    materialId: '',
    quantity: '',
    rate: '',
    amount: '',
    supplierId: '',
    siteId: '',
    paymentStatus: 'Pending',
    notes: '',
  });

  const [editing, setEditing] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetchers
  const fetchMaterialTypes = useCallback(async () => {
    showLoader();
    try {
      const res = await FetchMaterialTypes();
      setMaterialTypes(res?.data || []);
    } catch (err) {
      console.error('FetchMaterialTypes error', err);
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  const fetchSuppliers = useCallback(async () => {
    showLoader();
    try {
      const res = await FetchSuppliers();
      setSuppliers(res?.data || []);
    } catch (err) {
      console.error('FetchSuppliers error', err);
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  const fetchSites = useCallback(async () => {
    showLoader();
    try {
      const res = await FetchSites();
      setSites(res?.data || []);
    } catch (err) {
      console.error('FetchSites error', err);
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  const fetchReceiptsList = useCallback(async () => {
    showLoader();
    try {
      const res = await FetchReceipts();
      setReceipts(res?.data || []);
    } catch (err) {
      console.error('FetchReceipts error', err);
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    (async () => {
      await Promise.all([fetchMaterialTypes(), fetchSuppliers(), fetchSites(), fetchReceiptsList()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMaterialName = (id) => {
    const m = materialTypes.find(
      (mt) => String(mt.materialTypeId ?? mt.id ?? mt.MaterialTypeId ?? mt.Id) === String(id)
    );
    return m ? (m.materialName ?? m.name ?? m.MaterialName ?? 'Unknown') : id;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'quantity' || name === 'rate') {
        const q = Number(name === 'quantity' ? value : prev.quantity) || 0;
        const r = Number(name === 'rate' ? value : prev.rate) || 0;
        next.amount = (q * r).toFixed(2);
      }
      return next;
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.materialId) return toast.error('Select material');
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error('Enter quantity > 0');

    try {
      showLoader();
      const payload = {
        receiptDate: form.receiptDate,
        materialId: form.materialId,
        quantity: Number(form.quantity),
        rate: Number(form.rate),
        amount: Number(form.amount),
        supplierId: form.supplierId || null,
        siteId: form.siteId || null,
        paymentStatus: form.paymentStatus,
        notes: form.notes || null,
      };
      await AddReceipt(payload);
      toast.success('Receipt added');
      await fetchReceiptsList();
      setForm({
        receiptDate: new Date().toISOString().slice(0, 10),
        materialId: '',
        quantity: '',
        rate: '',
        amount: '',
        supplierId: '',
        siteId: '',
        paymentStatus: 'Pending',
        notes: '',
      });
    } catch (err) {
      console.error('AddReceipt error', err);
      toast.error('Failed to add receipt');
    } finally {
      hideLoader();
    }
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      receiptDate: (r.receiptDate || '').split('T')[0] || new Date().toISOString().slice(0, 10),
      materialId: r.materialId,
      quantity: r.quantity,
      rate: r.rate,
      amount: r.amount,
      supplierId: r.supplierId || '',
      siteId: r.siteId || '',
      paymentStatus: r.paymentStatus || 'Pending',
      notes: r.notes || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    try {
      showLoader();
      const payload = {
        receiptId: editing.receiptId,
        receiptDate: form.receiptDate,
        materialId: form.materialId,
        quantity: Number(form.quantity),
        rate: Number(form.rate),
        amount: Number(form.amount),
        supplierId: form.supplierId || null,
        siteId: form.siteId || null,
        paymentStatus: form.paymentStatus,
        notes: form.notes || null,
        organisationId: orgData?.organisationId,
      };
      await UpdateReceipt(payload);
      toast.success('Receipt updated');
      setEditModalOpen(false);
      setEditing(null);
      await fetchReceiptsList();
      setForm({
        receiptDate: new Date().toISOString().slice(0, 10),
        materialId: '',
        quantity: '',
        rate: '',
        amount: '',
        supplierId: '',
        siteId: '',
        paymentStatus: 'Pending',
        notes: '',
      });
    } catch (err) {
      console.error('UpdateReceipt error', err);
      toast.error('Failed to update receipt');
    } finally {
      hideLoader();
    }
  };

  const renderMaterialOptions = () =>
    materialTypes.map((m) => (
      <option
        key={String(m.materialTypeId ?? m.id ?? m.MaterialTypeId ?? m.Id)}
        value={String(m.materialTypeId ?? m.id ?? m.MaterialTypeId ?? m.Id)}
      >
        {m.materialName ?? m.name ?? m.MaterialName}
      </option>
    ));

  const renderSupplierOptions = () =>
    suppliers.map((s) => (
      <option
        key={String(s.supplierId ?? s.id ?? s.SupplierId ?? s.Id)}
        value={String(s.supplierId ?? s.id ?? s.SupplierId ?? s.Id)}
      >
        {s.supplierName ?? s.name ?? s.SupplierName}
      </option>
    ));

  const renderSiteOptions = () =>
    sites.map((s) => (
      <option
        key={String(s.siteId ?? s.id ?? s.SiteId ?? s.Id)}
        value={String(s.siteId ?? s.id ?? s.SiteId ?? s.Id)}
      >
        {s.siteName ?? s.sitename ?? s.name ?? s.SiteName}
      </option>
    ));

  return (
    <>
      <Navbar />
      <div className="generate-receipt-container">
        <ToastContainer position="top-center" autoClose={2500} />
        <h2>Generate Receipt</h2>

        <div className="top-buttons" style={{ gap: 10 }}>
          <button onClick={() => navigate(`/materials/create?returnTo=${encodeURIComponent(location.pathname)}`)}>+ Add Material Type</button>
          <button onClick={() => navigate(`/suppliers/create?returnTo=${encodeURIComponent(location.pathname)}`)}>+ Add Supplier</button>
        </div>

        <form className="receipt-form" onSubmit={handleAdd}>
          <p><strong>Total: ₹{(Number(form.quantity) * Number(form.rate)).toFixed(2) || '0.00'}</strong></p>

          <label>Receipt Date</label>
          <input type="date" name="receiptDate" value={form.receiptDate} onChange={handleChange} />

          <select name="materialId" value={form.materialId} onChange={handleChange}>
            <option value="">Select Material</option>
            {renderMaterialOptions()}
          </select>

          <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} step="0.01" />
          <input type="number" name="rate" placeholder="Rate per Unit" value={form.rate} onChange={handleChange} step="0.01" />

          <input type="number" name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} step="0.01" />

          <select name="supplierId" value={form.supplierId} onChange={handleChange}>
            <option value="">Select Supplier</option>
            {renderSupplierOptions()}
          </select>

          <select name="siteId" value={form.siteId} onChange={handleChange}>
            <option value="">Select Site</option>
            {renderSiteOptions()}
          </select>

          <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
            {PAYMENT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange}></textarea>

          <button type="submit">Add Receipt</button>
        </form>

        {/* Receipts list */}
        <div style={{ marginTop: 20 }}>
          <h3>Existing Receipts</h3>
          <table className="employee-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Material</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.receiptId}>
                  <td>{(r.receiptDate || '').split('T')[0]}</td>
                  <td>{getMaterialName(r.materialId)}</td>
                  <td>{r.quantity ?? r.qty ?? r.Quntity}</td>
                  <td>{r.rate}</td>
                  <td>{r.amount}</td>
                  <td>{r.paymentStatus}</td>
                  <td>
                    <button onClick={() => openEdit(r)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

       {/* Edit modal */}
{editModalOpen && (
  <div className="modal-overlay">
    <div className="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="edit-receipt-title">
      <h3 id="edit-receipt-title">Edit Receipt</h3>

      <form className="modal-form-grid" onSubmit={(e) => { e.preventDefault(); handleEditSave(); }}>
        <label className="field">
          <span className="field-label">Receipt Date</span>
          <input type="date" name="receiptDate" value={form.receiptDate} onChange={handleChange} />
        </label>

        <label className="field">
          <span className="field-label">Material</span>
          <select name="materialId" value={form.materialId} onChange={handleChange}>
            <option value="">Select Material</option>
            {renderMaterialOptions()}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Quantity</span>
          <input type="number" name="quantity" placeholder="Quantity" value={form.quantity} onChange={handleChange} />
        </label>

        <label className="field">
          <span className="field-label">Rate</span>
          <input type="number" name="rate" placeholder="Rate" value={form.rate} onChange={handleChange} />
        </label>

        <label className="field">
          <span className="field-label">Amount</span>
          <input type="number" name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} />
        </label>

        <label className="field">
          <span className="field-label">Payment Status</span>
          <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
            {PAYMENT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Supplier</span>
          <select name="supplierId" value={form.supplierId} onChange={handleChange}>
            <option value="">Select Supplier</option>
            {renderSupplierOptions()}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Site</span>
          <select name="siteId" value={form.siteId} onChange={handleChange}>
            <option value="">Select Site</option>
            {renderSiteOptions()}
          </select>
        </label>

        <label className="field textarea-field" style={{ gridColumn: '1 / -1' }}>
          <span className="field-label">Notes</span>
          <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
        </label>

        <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn btn-primary">Save</button>
          <button type="button" className="btn btn-secondary" onClick={() => { setEditModalOpen(false); setEditing(null); }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      </div>
    </>
  );
}
