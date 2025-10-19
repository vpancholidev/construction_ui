import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerOrg } from '../api/authApi';
import './Register.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLoader } from '../Context/LoaderContext';

function OrgRegister() {
  const [OrganisationName, setOrgName] = useState('');
  const [Firstname, setOwnerFirstName] = useState('');
  const [Lastname, setOwnerLastName] = useState('');
  const [Email, setEmail] = useState('');
  const [City, setCity] = useState('');
  const [Password, setPassword] = useState('');
  const navigate = useNavigate();
  const { showLoader, hideLoader, loading } = useLoader();

  const handleRegister = async (e) => {
    e.preventDefault();

    const payload = {
      OrganisationName,
      Firstname,
      Lastname,
      Email,
      City,
      Password
    };

    try {
      showLoader();
      const response = await registerOrg(payload);
      if (response.data.success === false) {
        toast.error(response.data.errorMessage || 'Registration failed.');
      } else {
        toast.success('Organization registered successfully!');
        setTimeout(() => navigate('/'), 5000); // slight delay for toast visibility
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error.');
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="org-register-container">
      <ToastContainer position="top-center" autoClose={3000} />
      <h2>Organization Registration</h2>
      <form onSubmit={handleRegister} className="org-form">
        <input
          type="text"
          placeholder="Organization Name"
          value={OrganisationName}
          onChange={(e) => setOrgName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="First Name"
          value={Firstname}
          onChange={(e) => setOwnerFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={Lastname}
          onChange={(e) => setOwnerLastName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email Address"
          value={Email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="City"
          value={City}
          onChange={(e) => setCity(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={Password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength="6"
        />
  <button type="submit" disabled={loading}>Register Organization</button>
      </form>
      <p>
        Already registered? <Link to="/">Login here</Link>
      </p>
    </div>
  );
}

export default OrgRegister;
