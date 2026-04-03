import axios from "axios";

const API = "http://localhost:3000/api/auth";

export const loginUser = (data) =>
  axios.post(`${API}/citizen/login`, data, { withCredentials: true });

export const loginAmbulance = (data) =>
  axios.post(`${API}/ambulance/login`, data, { withCredentials: true });

export const loginHospital = (data) =>
  axios.post(`${API}/hospital/login`, data, { withCredentials: true });