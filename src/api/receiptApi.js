import axios from './axiosInstance';

export const FetchSites = () => {
  return axios.get(`/site/GetAllSite`);
};

export const FetchSuppliers = () => {
  return axios.get(`/supplier/getAll`);
};

export const AddSuppliers = (data) => {
  return axios.post(`/supplier/add`,data);
};

export const FetchMaterialTypes = () => {
  return axios.get(`/materials`);
};

export const SaveReceipt = (data) => {
  return axios.post(`/receipts`, data);
};
