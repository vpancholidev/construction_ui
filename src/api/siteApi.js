import axios from './axiosInstance';
export const fetchUsers = (Roleid) => {
    return axios.get(`/user/getuserwithroleid?Roleid=${Roleid}`);
  };

  export const AddSite = (data) => axios.post('/site/add', data);
  export const FetchAllSite = () => {
    return axios.get('/site/GetAllSite');
  }
  export const UpdateSite = (id,data) => {
    return axios.put(`/site/${id}`,data);
  }