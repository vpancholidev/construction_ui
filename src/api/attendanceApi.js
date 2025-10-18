import axios from './axiosInstance';

const base = '/EmployeeAttendance';

export const getAllAttendance = () => {
  // GET api/EmployeeAttendance/GetAllEmployeeAttendace
  return axios.get(`${base}/GetAllEmployeeAttendace`);
};

export const addAttendance = (payload) => {
  // POST api/EmployeeAttendance/AddAttendace
  return axios.post(`${base}/AddAttendace`, payload);
};

export const updateAttendance = (payload) => {
  // PUT api/EmployeeAttendance/UpdateAttendace
  return axios.put(`${base}/UpdateAttendace`, payload);
};

export default {
  getAllAttendance,
  addAttendance,
  updateAttendance,
};
