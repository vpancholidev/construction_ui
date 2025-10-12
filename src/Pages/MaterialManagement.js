import React, { useState, useEffect } from 'react';
import Navbar from '../Component/Navbar';
// Dummy data for initial state (replace with API calls)
const initialMaterialTypes = [];
const initialSuppliers = [];
const initialReceipts = [];

function MaterialTypeManagement({ onBack, onSave, materialTypes, onEdit, onDelete }) {
  const [form, setForm] = useState({ name: '', unit: '', id: null });
  useEffect(() => {
    if (form.id !== null) {
      // If editing, prefill form
      const mt = materialTypes.find(m => m.id === form.id);
      if (mt) setForm(mt);
    }
  }, [form.id, materialTypes]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.unit) return;
    onSave(form);
    setForm({ name: '', unit: '', id: null });
  };

  return (
    <div className="card">
      <h3 className="section-title">Material Type Management</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="e.g., Cement OPC 53" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input type="text" placeholder="e.g., bags, kg, m³" className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
        <button className="btn" type="submit">{form.id ? 'Update' : 'Add'} Material Type</button>
        {form.id && <button className="btn-secondary" type="button" onClick={() => setForm({ name: '', unit: '', id: null })}>Cancel Edit</button>}
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Unit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {materialTypes.map(mt => (
            <tr key={mt.id}>
              <td>{mt.name}</td>
              <td>{mt.unit}</td>
              <td>
                <button className="btn" onClick={() => setForm(mt)}>Edit</button>
                <button className="btn-secondary" onClick={() => onDelete(mt.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn-secondary" onClick={onBack}>Back to Material Receipt</button>
    </div>
  );
}

function SupplierManagement({ onBack, onSave, suppliers, onEdit, onDelete }) {
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', notes: '', id: null });
  useEffect(() => {
    if (form.id !== null) {
      const s = suppliers.find(s => s.id === form.id);
      if (s) setForm(s);
    }
  }, [form.id, suppliers]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name) return;
    onSave(form);
    setForm({ name: '', contact: '', phone: '', email: '', notes: '', id: null });
  };

  return (
    <div className="card">
      <h3 className="section-title">Supplier Management</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Supplier Company Name" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input type="text" placeholder="Contact Person (Optional)" className="input" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
        <input type="text" placeholder="Phone (Optional)" className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        <input type="email" placeholder="Email (Optional)" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <textarea placeholder="Notes (e.g., GSTIN, Specialization)" className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button className="btn" type="submit">{form.id ? 'Update' : 'Add'} Supplier</button>
        {form.id && <button className="btn-secondary" type="button" onClick={() => setForm({ name: '', contact: '', phone: '', email: '', notes: '', id: null })}>Cancel Edit</button>}
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Name/Company</th>
            <th>Contact Person</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.contact}</td>
              <td>{s.phone}</td>
              <td>{s.email}</td>
              <td>{s.notes}</td>
              <td>
                <button className="btn" onClick={() => setForm(s)}>Edit</button>
                <button className="btn-secondary" onClick={() => onDelete(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn-secondary" onClick={onBack}>Back to Material Receipt</button>
    </div>
  );
}

function MaterialReceiptForm({ onManageSuppliers, onManageTypes, onSave, materialTypes, suppliers, receipts, onDelete }) {
  const [form, setForm] = useState({ materialType: '', supplier: '', quantity: '', rate: '', site: '', date: '', notes: '', id: null });

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.materialType || !form.supplier || !form.quantity || !form.rate || !form.site || !form.date) return;
    onSave(form);
    setForm({ materialType: '', supplier: '', quantity: '', rate: '', site: '', date: '', notes: '', id: null });
  };

  return (
    <div className="card">
      <h2 className="main-title">Material Management</h2>
      <p>Log materials received at sites. Payment is handled via <i>Supplier Payments</i>.</p>
      <div className="btn-group">
        <button className="btn" type="button" onClick={onManageSuppliers}>Manage Suppliers</button>
        <button className="btn" type="button" onClick={onManageTypes}>Manage Material Types</button>
      </div>
      <h3>Log New Material Receipt</h3>
      <form onSubmit={handleSubmit}>
        <select className="input" value={form.materialType} onChange={e => setForm(f => ({ ...f, materialType: e.target.value }))}>
          <option value="">-- Select Material Type --</option>
          {materialTypes.map(mt => <option key={mt.id} value={mt.id}>{mt.name}</option>)}
        </select>
        <select className="input" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}>
          <option value="">-- Select Supplier --</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" placeholder="Quantity" className="input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
        <input type="number" placeholder="Rate" className="input" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
        <input type="text" placeholder="Site" className="input" value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} />
        <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <textarea placeholder="Any specific notes" className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button className="btn" type="submit">Log Material Receipt</button>
      </form>
      <h4>Material Ledger (Receipts/Issues)</h4>
      <table className="table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Supplier</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Site</th>
            <th>Date</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map(r => (
            <tr key={r.id}>
              <td>{materialTypes.find(mt => mt.id === r.materialType)?.name || ''}</td>
              <td>{suppliers.find(s => s.id === r.supplier)?.name || ''}</td>
              <td>{r.quantity}</td>
              <td>{r.rate}</td>
              <td>{r.site}</td>
              <td>{r.date}</td>
              <td>{r.notes}</td>
              <td><button className="btn-secondary" onClick={() => onDelete(r.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MaterialManagement() {
  const [view, setView] = useState('main');
  const [materialTypes, setMaterialTypes] = useState(initialMaterialTypes);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [receipts, setReceipts] = useState(initialReceipts);

  // CRUD for Material Types
  const handleSaveMaterialType = mt => {
    if (mt.id) {
      setMaterialTypes(types => types.map(t => t.id === mt.id ? mt : t));
    } else {
      setMaterialTypes(types => [...types, { ...mt, id: Date.now() }]);
    }
  };
  const handleDeleteMaterialType = id => setMaterialTypes(types => types.filter(t => t.id !== id));

  // CRUD for Suppliers
  const handleSaveSupplier = s => {
    if (s.id) {
      setSuppliers(sups => sups.map(sup => sup.id === s.id ? s : sup));
    } else {
      setSuppliers(sups => [...sups, { ...s, id: Date.now() }]);
    }
  };
  const handleDeleteSupplier = id => setSuppliers(sups => sups.filter(s => s.id !== id));

  // CRUD for Receipts
  const handleSaveReceipt = r => {
    setReceipts(rs => [...rs, { ...r, id: Date.now() }]);
  };
  const handleDeleteReceipt = id => setReceipts(rs => rs.filter(r => r.id !== id));

  return (
    <div className="material-management-page">
      {view === 'main' && (
        <MaterialReceiptForm
          onManageSuppliers={() => setView('suppliers')}
          onManageTypes={() => setView('types')}
          onSave={handleSaveReceipt}
          materialTypes={materialTypes}
          suppliers={suppliers}
          receipts={receipts}
          onDelete={handleDeleteReceipt}
        />
      )}
      {view === 'types' && (
        <MaterialTypeManagement
          onBack={() => setView('main')}
          onSave={handleSaveMaterialType}
          materialTypes={materialTypes}
          onDelete={handleDeleteMaterialType}
        />
      )}
      {view === 'suppliers' && (
        <SupplierManagement
          onBack={() => setView('main')}
          onSave={handleSaveSupplier}
          suppliers={suppliers}
          onDelete={handleDeleteSupplier}
        />
      )}
    </div>
  );
}
