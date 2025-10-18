import axios from './axiosInstance';

export const getDashboardData = (emailId) =>
    axios.get('/Dashboard/GetDashboardData', {
      params: { emailId }
    });

// New: fetch dashboard counts by organisationId (returns { totalActiveSites, totalCompletedSites, totalEmployees })
export const getDashboardCounts = (organisationId) =>
  axios.get('/dashboard/GetDashboardDataForDashboard', {
    params: { organisationId }
  });