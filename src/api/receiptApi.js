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

export const SaveReceipt = (data) => {
  return axios.post(`/receipts`, data);
};

export const FetchMaterialTypes = () =>
  axios.get(`/Material/GetAll`);

export const AddMaterialType = (payload) =>
  axios.post(`/Material/Add`, payload);

export const UpdateMaterialType = (payload) =>
  axios.put(`/Material/Update`, payload);

export const FetchReceipts = () =>
  axios.get(`/Receipt/GetAll`);

export const AddReceipt = (payload) =>
  axios.post(`/Receipt/Add`, payload);

export const UpdateReceipt = (payload) =>
  axios.put(`/Receipt/Update`, payload);

// Upload invoice file (image/pdf). Returns { url: 'https://...' }
export const UploadInvoiceFile = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return axios.post(`/Receipt/UploadInvoice`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
