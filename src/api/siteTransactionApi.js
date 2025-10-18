import axios from './axiosInstance';

const base = '/sitetransaction';

export const getAllTransactions = () => axios.get(`${base}/GetAll`);

export const addTransaction = (payload) => {
  try {
    console.debug('siteTransactionApi.addTransaction - sending', JSON.stringify(payload));
  } catch (e) {
    console.debug('siteTransactionApi.addTransaction - payload', payload);
  }
  return axios.post(`${base}/Add`, payload);
};

export const updateTransaction = (payload) => {
  try {
    console.debug('siteTransactionApi.updateTransaction - sending', JSON.stringify(payload));
  } catch (e) {
    console.debug('siteTransactionApi.updateTransaction - payload', payload);
  }
  return axios.put(`${base}/Update`, payload);
};

export const getExpenseCategories = () => axios.get(`${base}/ExpenseCategories`);

export const addExpenseCategory = (payload) => axios.post(`${base}/AddExpenseCategory`, payload);

export const updateExpenseCategory = (payload) => axios.put(`${base}/UpdateExpenseCategory`, payload);

export default {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  getExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
};
