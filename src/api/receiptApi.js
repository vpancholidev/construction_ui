import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Update this URL as needed

export const FetchSites = () => {
  return axios.get(`${API_BASE_URL}/sites`);
};

export const FetchSuppliers = () => {
  return axios.get(`${API_BASE_URL}/suppliers`);
};

export const FetchMaterialTypes = () => {
  return axios.get(`${API_BASE_URL}/materials`);
};

export const SaveReceipt = (data) => {
  return axios.post(`${API_BASE_URL}/receipts`, data);
};
