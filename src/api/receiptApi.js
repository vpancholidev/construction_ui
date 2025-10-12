import axios from './axiosInstance';

export const FetchSites = () => {
  return axios.get(`/site/GetAllSite`);
};

export const FetchSuppliers = () => {
  return axios.get(`/supplier/getAllSupplier`);
};

export const AddSuppliers = (data) => {
  return axios.post(`/supplier/add`,data);
};

export const UpdateSupplier = async (payload) => {
  return await axios.put('/Supplier/UpdateSupplier', payload);
};

export const FetchMaterialTypes = () => {
  return axios.get(`/materials`);
};

export const SaveReceipt = (data) => {
  return axios.post(`/receipts`, data);
};
