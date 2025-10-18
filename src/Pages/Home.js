// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import Navbar from '../Component/Navbar';
import DashboardCard from '../Component/DashboardCard';
import './Home.css';
import { useOrg } from '../Context/OrgContext';
import { getDashboardCounts } from '../api/dashboardApi';
import { FetchAllSite } from '../api/siteApi';

function Home() {
  const { userdata, orgData } = useOrg();
  const [counts, setCounts] = useState({ totalActiveSites: 0, totalCompletedSites: 0, totalEmployees: 0 });
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!orgData?.organisationId) return;
      try {
        // pass null explicitly when All selected
        const resp = await getDashboardCounts(orgData.organisationId, selectedSite || null);
        setCounts(resp.data || {});
      } catch (err) {
        console.error('Failed to load dashboard counts', err);
      }
    };
    load();
  }, [orgData?.organisationId, selectedSite]);

  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = await FetchAllSite();
        const raw = (res && res.data) || [];
  const norm = raw.map(s => ({ id: (s.siteId || s.SiteId || s.id || '').toString(), name: (s.siteName || s.Sitename || s.sitename || '') }));
  setSites(norm);
      } catch (err) { console.error('Failed to load sites', err); }
    };
    loadSites();
  }, []);

  return (
    <>
      <Navbar />
      <div className="home-container">
        <h2>Welcome, {userdata?.name}</h2>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Select Site</label>
          <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)} style={{ width: '100%', padding: '12px 16px', fontSize: 16, borderRadius: 6 }}>
            <option value="">-- All Sites --</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="card-grid">
          <DashboardCard title="Ongoing Projects" count={counts.totalActiveSites ?? 0} color="#388e3c" />
          {/* <DashboardCard title="Completed" count={counts.totalCompletedSites ?? 0} color="#1976d2" /> */}
        {/*  <DashboardCard title="Pending Approvals" count="3" color="#f57c00" /> */}
          <DashboardCard title="Team Employee" count={counts.totalEmployees ?? 0} color="#7b1fa2" />
          <DashboardCard title="Total Income" count={(counts.totalIncome ?? 0).toFixed(2)} color="#43a047" />
          <DashboardCard title="Total Expense" count={(counts.totalExpense ?? 0).toFixed(2)} color="#e53935" />
          <DashboardCard title="Labour Paid" count={(counts.totalLabourPaymentPaid ?? 0).toFixed(2)} color="#6d4c41" />
          <DashboardCard title="Supplier Pending" count={(counts.totalSupplierPaymentPending ?? 0).toFixed(2)} color="#fdd835" />
          <DashboardCard title="Supplier Paid" count={(counts.totalSupplierPaymentDone ?? 0).toFixed(2)} color="#1e88e5" />
        </div>
      </div>
    </>
  );
}

export default Home;
