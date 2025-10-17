import axios from './axiosInstance';

export const addLabourPayment = (data) => axios.post('/LabourPayment/Add', data);
export const getAllLabourPayments = (organisationId) => axios.get('/LabourPayment/GetAllLabour', { params: { organisationId } });
export const updateLabourPayment = (data) => axios.put(`/LabourPayment/Update/`, data);
export const getLabourPaymentById = (id) => axios.get(`/LabourPayment/${id}`);
export const getLabourData = (organisationId) => axios.get('/LabourPayment/GetLabourData', { params: { organisationId } });
