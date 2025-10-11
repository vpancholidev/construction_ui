import React, { useState, useEffect } from 'react';
import Navbar from '../Component/Navbar';
import './EmployeeManagement.css';
import { AddEmployee, FetchAllEmployees, UpdateEmployee, FetchUserRoles , UpdateUserStatus } from '../api/empApi';
import { useLoader } from '../Context/LoaderContext';
import { useOrg } from '../Context/OrgContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [roles, setRoles] = useState([]);

  const { showLoader, hideLoader } = useLoader();
  const {userdata,orgData} = useOrg();

  const [employeeData, setEmployeeData] = useState({
    firstname: '',
    lastName: '',
    role: '',
    contact: '',
    Wageperday: '',
    address: '',
    email: '',
    city: '',
    password: '',
    isActive: true, // add this line
    organisationId:'',
    roleid: ''
  });

  const handleChange = (e) => {
    setEmployeeData({ ...employeeData, [e.target.name]: e.target.value });
  };

  const handleOpenModal = () => {
    setEmployeeData({
      firstname: '',
      lastName: '',
      role: '',
      contact: '',
      Wageperday: '',
      address: '',
      email: '',
      city: '',
      password: '',
      isActive: true, // default value
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleEditClick = (emp) => {
    setEmployeeData({
      firstname: emp.firstname || '',
      lastName: emp.lastName || '',
      role: emp.roleid || emp.role || '', // prefer roleid if available
      contact: emp.contact || '',
      Wageperday: emp.Wageperday || emp.wageperday || '', // handle both cases
      address: emp.address || '',
      email: emp.email || '',
      city: emp.city || '',
      password: '', // never prefill password
      isActive: emp.isActive ?? true, // default to true if undefined
      roleid : emp.roleid
    });
    setSelectedEmployeeId(emp.userid);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();

    const isValid =
      employeeData.firstname &&
      employeeData.lastName &&
      employeeData.contact &&
      employeeData.Wageperday &&
      employeeData.address &&
      employeeData.email &&
      employeeData.city &&
      employeeData.password &&
      employeeData.roleid;

    if (!isValid) {
      alert('All fields are required');
      return;
    }

    showLoader();
    employeeData.organisationId = orgData.organisationId;
    try {
      if (editMode) {
        await UpdateEmployee(selectedEmployeeId,employeeData);
      } else {
        await AddEmployee(employeeData);
      }

      const response = await FetchAllEmployees(orgData.organisationId);
      if (editMode)
      {

        toast.success('successfully Updated!');
      }
      else
      {
        toast.success('successfully Added!');
      }
      
      setEmployees(response.data || []);
      setShowModal(false);
      setEmployeeData({
        firstname: '',
        lastName: '',
        role: '',
        contact: '',
        Wageperday: '',
        address: '',
        password: '',
        roleid: ''
      });
    } catch (err) {
      console.error('Error saving employee:', err);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    const loadEmployees = async () => {
      if (!orgData?.organisationId) return; // wait until orgData is available
      showLoader();
      try {
        const response = await FetchAllEmployees(orgData.organisationId);
        setEmployees(response.data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        hideLoader();
      }
    };

    loadEmployees();
  }, [orgData]);

  const filteredEmployees = employees.filter((emp) =>
    emp.firstname?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  useEffect(() => {
    const loadRoles = async () => {
      if (!showModal) return;

      try {
        showLoader();
        const response = await FetchUserRoles(orgData.organisationId);
        setRoles(response.data || []);
      } catch (err) {
        console.error('Error fetching roles:', err);
      } finally {
        hideLoader();
      }
    };

    loadRoles();
  }, [showModal]);

  const handleToggleStatus = async (emp) => {
    try {
      showLoader();
      const updatedEmp = { ...emp, isActive: !emp.isActive };
      //await UpdateEmployee(emp.userid, updatedEmp);

      const response = await UpdateUserStatus(emp.userid, updatedEmp.isActive);
      if (response.status === 200) {
        const response = await FetchAllEmployees(orgData.organisationId);
        setEmployees(response.data || []);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      hideLoader();
    }
  };
  return (
    <>
      <Navbar />
      <div className="employee-container">
      <ToastContainer position="top-center" autoClose={3000} />
        <div className="employee-header">
          <h2>Employee Management</h2>
          <button className="add-employee-btn" onClick={handleOpenModal}>
            + Add Employee
          </button>
        </div>

        <input
          className="search-box"
          type="text"
          placeholder="Search by employee name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredEmployees.length > 0 ? (
          <div className="employee-table-container">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => (
                  <tr key={index}>
                    <td>{`${emp.firstname} ${emp.lastName}`}</td>
                    <td>{emp.rolename}</td>
                    <td>{emp.contact}</td>
                    <td>{emp.email}</td>
                    <td>{emp.city}</td>
                    <td>
                    <label className="switch">
  <input
    type="checkbox"
    checked={emp.isActive}
    onChange={() => handleToggleStatus(emp)}
  />
  <span className="slider round"></span>
</label>
                    </td>
                    <td>
                      <button onClick={() => handleEditClick(emp)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-employee-msg">No employees found.</p>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editMode ? 'Edit Employee' : 'Add New Employee'}</h3>
              <form onSubmit={handleSaveEmployee} className="employee-form">
                <input
                  type="text"
                  name="firstname"
                  placeholder="First Name"
                  value={employeeData.firstname}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={employeeData.lastName}
                  onChange={handleChange}
                />
                <select name="roleid" value={employeeData.roleid} onChange={handleChange}>
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.roleid} value={role.roleid}>
                      {role.rolename}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="contact"
                  placeholder="Contact Number"
                  value={employeeData.contact}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="Wageperday"
                  placeholder="Wage per Day"
                  value={employeeData.Wageperday}
                  onChange={handleChange}
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={employeeData.email}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={employeeData.city}
                  onChange={handleChange}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={employeeData.password}
                  onChange={handleChange}
                />
                <textarea
                  name="address"
                  placeholder="Residential Address"
                  value={employeeData.address}
                  onChange={handleChange}
                ></textarea>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={employeeData.isActive}
                    onChange={(e) =>
                      setEmployeeData({ ...employeeData, isActive: e.target.checked })
                    }
                  />
                  <span className="slider round"></span>
                </label>

                <div className="modal-actions">
                  <button type="submit">{editMode ? 'Edit' : 'Add'}</button>
                  <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default EmployeeManagement;
