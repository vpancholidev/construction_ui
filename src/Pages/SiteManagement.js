import React, { useState, useEffect } from 'react';
import Navbar from '../Component/Navbar';
import './SiteManagement.css';
import { fetchUsers, AddSite, FetchAllSite, UpdateSite } from '../api/siteApi'; // ✅ Make sure this exists
import { useLoader } from '../Context/LoaderContext';


function SiteManagement() {
  const [sites, setSites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newSite, setNewSite] = useState({ sitename: '', location: '', manager: '', userid: '', isActive: false });

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const { showLoader, hideLoader } = useLoader();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewSite({ ...newSite, [name]: value });

    // Only show suggestions when typing in manager field
    if (name === 'manager') {
      if (value.trim() === '') {
        setFilteredUsers([]);
      }
      else {
        const suggestions = users.filter(user => {
          // Support both 'lastname' and 'lastName' from API
          const last = user.lastName || user.lastname || '';
          return `${user.firstname} ${last}`.toLowerCase().includes(value.toLowerCase());
        });
        setFilteredUsers(suggestions);
      }
    } else {
      setFilteredUsers([]);
    }
  };

  const handleSelectUser = (user) => {
  const last = user.lastName || user.lastname || '';
  const fullName = `${user.firstname} ${last}`;
    setNewSite({ ...newSite, manager: fullName, userid: user.userid });
    setFilteredUsers([]);
  };
  const handleOpenModal = () => {
    setNewSite({ sitename: '', location: '', manager: '', userid: '', isActive: false });
    setFilteredUsers([]);
    setIsEditMode(false);
    setEditingSiteId(null);
    setShowModal(true);
  };

  const handleSubmitSite = async (e) => {
    e.preventDefault();
    if (!newSite.sitename || !newSite.location || !newSite.manager) return;

    // Find the selected user by matching the manager name
    const selectedUser = users.find(user => {
      const last = user.lastName || user.lastname || '';
      return `${user.firstname} ${last}`.toLowerCase() === newSite.manager.toLowerCase();
    });

    if (!selectedUser) {
      alert("Please select a manager from the suggestions list.");
      return;
    }

    // Always set userid from the selected user
    const siteData = { ...newSite, Userid: selectedUser.userid };

    showLoader();
    try {
      let response;
      if (isEditMode) {
        // Update existing site
        response = await UpdateSite(editingSiteId, siteData);
      } else {
        // Add new site
        response = await AddSite(siteData);
      }

      if (response.status !== 200) {
        console.error('Error saving site:', response);
        return;
      }


      // Refresh the list
      const allSites = await FetchAllSite();
      let updatedSites = allSites.data || [];

      // For each site, if userid exists, attach firstname and lastname from users
      updatedSites = updatedSites.map(site => {
        if (site.userid) {
          const user = users.find(u => u.userid === site.userid);
          if (user) {
            return {
              ...site,
              firstname: user.firstname,
              lastname: user.lastName || user.lastname || '',
            };
          }
        }
        return site;
      });
      setSites(updatedSites);

      // Reset form
      setNewSite({ sitename: '', location: '', manager: '', userid: '', isActive: false });
      setShowModal(false);
      setIsEditMode(false);
      setEditingSiteId(null);

    } catch (error) {
      console.error('Error submitting site:', error);
    } finally {
      hideLoader();
    }
  };

  const filteredSites = sites.filter((site) =>
    site.sitename.toLowerCase().includes(searchTerm.toLowerCase()) || site.location.toLowerCase().includes(searchTerm.toLowerCase()) || site.firstname.toLowerCase().includes(searchTerm.toLowerCase()) || site.lastname.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // Fetch users once when component mounts
  useEffect(() => {
    const loadUsers = async () => {
      try {
        showLoader();
        const response = await fetchUsers();
        setUsers(response.data || []);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        hideLoader();
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    let didLoad = false;
    const loadSites = async () => {
      if (didLoad) return; // prevent multiple calls
      didLoad = true;
      try {
        showLoader();
        const response = await FetchAllSite();
        console.log(response);
        if (response.data !== null && response.data != []) {
          setSites(response.data || []);
        } else {
          console.error('Error fetching sites:', response);
        }
      } catch (err) {
        console.error('Error loading sites:', err);
      } finally {
        hideLoader();
      }
    };

    loadSites();
  }, []);


  const handleEditClick = (site) => {
    setNewSite({
      sitename: site.sitename,
      location: site.location,
      manager: `${site.firstname} ${site.lastname}`,
      userid: site.userid,
      isActive: site.isactive,
    });
    setEditingSiteId(site.siteId); // or site.id depending on your API
    setIsEditMode(true);
    setFilteredUsers([]);
    setShowModal(true);
  };
  return (
    <>
      <Navbar />
      <div className="site-container">
        <div className="site-header">
          <h2>Site Management</h2>
          <button className="add-site-btn" onClick={handleOpenModal}>+ Add Site</button>
        </div>

        <input
          className="search-box"
          type="text"
          placeholder="Search by site name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredSites.length > 0 ? (
          <div className="site-table-container">
            <table className="site-table">
              <thead>
                <tr>
                  <th>Site Name</th>
                  <th>Location</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site, index) => (
                  <tr key={index}>
                    <td>{site.sitename}</td>
                    <td>{site.location}</td>
                    <td>{site.firstname + ' ' + site.lastname}</td>
                    <td>{site.isactive ? "Active" : "Inactive"}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEditClick(site)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-site-msg">No sites found.</p>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Add New Site</h3>
              <form onSubmit={handleSubmitSite} className="site-form">
                <input
                  type="text"
                  name="sitename"
                  placeholder="Site Name"
                  value={newSite.sitename}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="location"
                  placeholder="Location"
                  value={newSite.location}
                  onChange={handleChange}
                />
                <div className="manager-wrapper">
                  <input
                    type="text"
                    name="manager"
                    placeholder="Site Manager"
                    value={newSite.manager}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  {filteredUsers.length > 0 && (
                    <ul className="autocomplete-dropdown">
                      {filteredUsers.map(user => {
                        const last = user.lastName || user.lastname || '';
                        return (
                          <li key={user.userid} onClick={() => handleSelectUser(user)}>
                            {user.firstname} {last}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="toggle-wrapper">
                  <label htmlFor="isActive">Is Active:</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={newSite.isActive}
                      onChange={(e) => setNewSite({ ...newSite, isActive: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="submit">{isEditMode ? 'Update' : 'Add'}</button>
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

export default SiteManagement;
