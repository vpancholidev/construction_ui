import React, { useState } from 'react';

const MaterialModal = ({ onSave, onClose }) => {
  const [materialName, setMaterialName] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!materialName.trim()) {
      setError('Material name is required');
      return;
    }
    onSave(materialName);
    setMaterialName('');
    setError('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add Material Type</h3>
        <input
          type="text"
          placeholder="Enter material name"
          value={materialName}
          onChange={(e) => setMaterialName(e.target.value)}
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

export default MaterialModal;