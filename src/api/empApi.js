import axios from './axiosInstance';

export const AddEmployee = async (data) => {
    return await axios.post('/employee/add', data);
  };
  export const FetchAllEmployees = (organisationId) =>
    axios.get('/employee/all', {
      params: { organisationId }
    });
  
  export const UpdateEmployee = async (id, data) => {
    return await axios.put(`employee/edit/${id}`, data);
  };
  export const FetchUserRoles = (organisationId) =>
    axios.get('/employee/roles', {
      params: { organisationId }
    });

  export const UpdateUserStatus = async (id,isActive) => {
    return await axios.put(`Employee/update-isactive/${id}`,isActive);
  };