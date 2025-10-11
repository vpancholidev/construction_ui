
import axios from './axiosInstance';
export const fetchUsers = () => {
  return axios.get('/role/all-users');
};

  export const AddSite = (data) => axios.post('/site/add', data);
  export const FetchAllSite = () => {
    return axios.get('/site/GetAllSite');
  }
  export const UpdateSite = (id,data) => {
    return axios.put(`/site/${id}`,data);
  }