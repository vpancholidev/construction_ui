// src/pages/Home.js
import React from 'react';
import Navbar from '../Component/Navbar';
import DashboardCard from '../Component/DashboardCard';
import './Home.css';
import { getUserFromToken } from '../Utils/jwtHelper';
import { useOrg } from '../Context/OrgContext';
function Home() {
  const { userdata } = useOrg();
  return (
    <>
      <Navbar />
      <div className="home-container">
        <h2>Welcome, {userdata?.name}</h2>
        <div className="card-grid">
          <DashboardCard title="Ongoing Projects" count="5" color="#388e3c" />
          <DashboardCard title="Completed" count="12" color="#1976d2" />
          <DashboardCard title="Pending Approvals" count="3" color="#f57c00" />
          <DashboardCard title="Team Members" count="8" color="#7b1fa2" />
        </div>
      </div>
    </>
  );
}

export default Home;
