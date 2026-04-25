import axiosInstance from '../../services/axios';

const API_BASE = '/events';

export const createEvent = async (eventData) => {
  const response = await axiosInstance.post(`${API_BASE}`, eventData);
  return response.data;
};

export const getOrganizerEvents = async () => {
  const response = await axiosInstance.get(`${API_BASE}/organizer/list`);
  return response.data;
};

export const getOrganizerOverview = async () => {
  const response = await axiosInstance.get(`${API_BASE}/organizer/overview`);
  return response.data;
};

export const getMyTickets = async () => {
  const response = await axiosInstance.get(`${API_BASE}/me/tickets`);
  return response.data;
};

export const getPublishedEvents = async () => {
  const response = await axiosInstance.get(`${API_BASE}/published`);
  return response.data;
};

export const getPlatformStats = async () => {
  const response = await axiosInstance.get(`${API_BASE}/stats`);
  return response.data;
};

export const getEvent = async (id) => {
  const response = await axiosInstance.get(`${API_BASE}/${id}`);
  return response.data;
};

export const setEventCheckInCode = async (eventId, code) => {
  const response = await axiosInstance.post(`${API_BASE}/${eventId}/checkin/code`, { code });
  return response.data;
};

export const verifyCheckInCode = async (eventId, code) => {
  const response = await axiosInstance.post(`${API_BASE}/${eventId}/checkin/verify`, { code });
  return response.data;
};

export const verifyCheckInCodeAny = async (code) => {
  const response = await axiosInstance.post(`${API_BASE}/checkin/verify`, { code });
  return response.data;
};

export const scanCheckInQr = async (eventId, qr, token) => {
  const response = await axiosInstance.post(
    `${API_BASE}/${eventId}/checkin/scan`,
    { qr },
    token
      ? {
          headers: { Authorization: `Bearer ${token}` },
        }
      : undefined
  );
  return response.data;
};

export const updateEvent = async (id, eventData) => {
  const response = await axiosInstance.put(`${API_BASE}/${id}`, eventData);
  return response.data;
};

export const publishEvent = async (id) => {
  const response = await axiosInstance.post(`${API_BASE}/${id}/publish`);
  return response.data;
};

export const cancelEvent = async (id) => {
  const response = await axiosInstance.post(`${API_BASE}/${id}/cancel`);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await axiosInstance.delete(`${API_BASE}/${id}`);
  return response.data;
};
