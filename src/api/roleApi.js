import axios from './axiosInstance';
export const addRole = (data) => axios.post('/Role/add', data);

export const getAllRoles = (organisationId) =>
  axios.get('/Role/all', {
    params: { organisationId }
  });

// Pages
export const getAllPages = (orgId) => axios.get(`/Page/GetAllPages`, { params: { orgId } });
export const addPage = (data) => axios.post(`/Page/AddPage`, data);

// Edit/Update
export const updateRole = (data) => axios.put(`/Role/update`, data)
export const updatePage = (data) => axios.put(`/Page/UpdatePage`, data);

// Role-Page mappings
export const getAllRolePageMappings = () => axios.get(`/RolePageMapping/GetAllMapping`);
export const updateRolePageMapping = (data) => axios.put(`/RolePageMapping/BulkUpdate`, data);
