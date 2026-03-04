import axiosInstance from '../../services/axios';

const API_BASE = '/events';

export const getTicketTypes = async (eventId) => {
  const res = await axiosInstance.get(`${API_BASE}/${eventId}/ticket-types`);
  return res.data;
};

export const getTicketsForEvent = async (eventId) => {
  const res = await axiosInstance.get(`${API_BASE}/${eventId}/tickets`);
  return res.data;
};

export const createTicketType = async (eventId, payload) => {
  const res = await axiosInstance.post(`${API_BASE}/${eventId}/ticket-types`, payload);
  return res.data;
};

export const updateTicketType = async (eventId, id, payload) => {
  const res = await axiosInstance.patch(`${API_BASE}/${eventId}/ticket-types/${id}`, payload);
  return res.data;
};

export const deleteTicketType = async (eventId, id) => {
  const res = await axiosInstance.delete(`${API_BASE}/${eventId}/ticket-types/${id}`);
  return res.data;
};

export const purchaseTickets = async (eventId, payload) => {
  const res = await axiosInstance.post(`${API_BASE}/${eventId}/tickets/purchase`, payload);
  return res.data;
};

export const scanTicketQr = async (qr) => {
  const res = await axiosInstance.post(`${API_BASE}/tickets/scan`, { qr });
  return res.data;
};
