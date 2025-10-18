// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import Navbar from '../Component/Navbar';
import DashboardCard from '../Component/DashboardCard';
import './Home.css';
import { useOrg } from '../Context/OrgContext';
import { getDashboardCounts } from '../api/dashboardApi';

function Home() {
  const { userdata, orgData } = useOrg();
  const [counts, setCounts] = useState({ totalActiveSites: 0, totalCompletedSites: 0, totalEmployees: 0 });

  useEffect(() => {
    const load = async () => {
      if (!orgData?.organisationId) return;
      try {
        const resp = await getDashboardCounts(orgData.organisationId);
        setCounts(resp.data || {});
      } catch (err) {
        console.error('Failed to load dashboard counts', err);
      }
    };
    load();
  }, [orgData?.organisationId]);

  return (
    <>
      <Navbar />
      <div className="home-container">
        <h2>Welcome, {userdata?.name}</h2>
        <div className="card-grid">
          <DashboardCard title="Ongoing Projects" count={counts.totalActiveSites ?? 0} color="#388e3c" />
          <DashboardCard title="Completed" count={counts.totalCompletedSites ?? 0} color="#1976d2" />
        {/*  <DashboardCard title="Pending Approvals" count="3" color="#f57c00" /> */}
          <DashboardCard title="Team Members" count={counts.totalEmployees ?? 0} color="#7b1fa2" />
        </div>
      </div>
    </>
  );
}

export default Home;
