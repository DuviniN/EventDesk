import axiosInstance from '../../services/axios';

export const getAnalyticsOverview = async () => {
  const response = await axiosInstance.get('/analytics/overview');
  return response.data;
};

export const getEventAnalytics = async (eventId) => {
  const response = await axiosInstance.get(`/analytics/events/${eventId}`);
  return response.data;
};
