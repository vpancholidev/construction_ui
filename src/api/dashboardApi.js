import axios from './axiosInstance';

export const getDashboardData = (emailId) =>
    axios.get('/Dashboard/GetDashboardData', {
      params: { emailId }
    });

// New: fetch dashboard counts by organisationId (returns { totalActiveSites, totalCompletedSites, totalEmployees })
export const getDashboardCounts = (organisationId, siteId) => {
  // send siteId explicitly; server may accept null to indicate organisation-wide totals
  const params = { organisationId, siteId: siteId ?? null };
  return axios.get('/dashboard/GetDashboardDataForDashboard', { params });
};