// src/Context/OrgContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDashboardData } from '../api/dashboardApi';
import { getUserFromToken } from '../Utils/jwtHelper';
import { useLoader } from './LoaderContext';

const OrgContext = createContext();

export const OrgProvider = ({ children }) => {
  const [orgData, setOrgData] = useState(null);
  const [userdata, setUser] = useState(null);
  const { showLoader, hideLoader } = useLoader();
  const user = getUserFromToken();
 
  
  const loadOrgData = async () => {
    if (!user?.email) return;
    setUser(user);
    try {
      showLoader();
      const response = await getDashboardData(user.email);
      setOrgData(response.data);
    } catch (err) {
      console.error('Error loading org data:', err);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    loadOrgData();
  }, [user?.email]);

  return (
    <OrgContext.Provider value={{userdata, orgData, reloadOrg: loadOrgData }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => useContext(OrgContext);
