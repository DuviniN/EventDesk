import axiosInstance from '../../services/axios';

const API_BASE = '/events';

export const getSeatingLayout = async (eventId) => {
  const res = await axiosInstance.get(`${API_BASE}/${eventId}/seating/layout`);
  return res.data;
};

export const upsertSeatingLayout = async (eventId, payload) => {
  const res = await axiosInstance.put(`${API_BASE}/${eventId}/seating/layout`, payload);
  return res.data;
};

export const listSeats = async (eventId) => {
  const res = await axiosInstance.get(`${API_BASE}/${eventId}/seating/seats`);
  return res.data;
};

export const replaceSeats = async (eventId, payload) => {
  const res = await axiosInstance.put(`${API_BASE}/${eventId}/seating/seats`, payload);
  return res.data;
};

export const createSeatHold = async (eventId, payload) => {
  const res = await axiosInstance.post(`${API_BASE}/${eventId}/seating/hold`, payload);
  return res.data;
};

export const cancelSeatHold = async (eventId, holdId) => {
  const res = await axiosInstance.delete(`${API_BASE}/${eventId}/seating/hold/${holdId}`);
  return res.data;
};
