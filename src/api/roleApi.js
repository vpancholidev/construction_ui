import axios from './axiosInstance';
export const addRole = (data) => axios.post('/Role/add', data);

export const getAllRoles = (organisationId) =>
  axios.get('/Role/all', {
    params: { organisationId }
  });
