import axios from './axiosInstance';

export const loginUser = (data) => axios.post('/auth/login', data);

export const registerOrg = (data) => axios.post('/User/registerorg', data);
