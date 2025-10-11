import axios from './axiosInstance';

export const getDashboardData = (emailId) =>
    axios.get('/Dashboard/GetDashboardData', {
      params: { emailId }
    });