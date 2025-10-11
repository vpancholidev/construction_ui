import React, { useState } from 'react';

const SupplierModal = ({ onSave, onClose }) => {
  const [supplierName, setSupplierName] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!supplierName.trim()) {
      setError('Supplier name is required');
      return;
    }
    onSave(supplierName);
    setSupplierName('');
    setError('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add Supplier</h3>
        <input
          type="text"
          placeholder="Enter supplier name"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
        />
        {error && <p className="error-msg">{error}</p>}
        <div className="modal-actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SupplierModal;