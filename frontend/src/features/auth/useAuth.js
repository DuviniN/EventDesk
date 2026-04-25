import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials, logout as logoutAction, selectCurrentUser, selectIsAuthenticated } from './authSlice';
import { loginUser, registerUser, logoutUser, getCurrentUser, updateProfile as updateProfileApi, changePassword as changePasswordApi } from './authApi';
import { setAccessToken } from '../../services/axios';
import { useState } from 'react';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await loginUser(credentials);
      setAccessToken(data.accessToken);
      dispatch(setCredentials(data));
      toast.success('Login successful!');
      // setTimeout(0) pushes navigate to the next event-loop tick, guaranteeing
      // React 19 has committed the Redux state before the new route renders.
      const role = data.user?.role || 'attendee';
      setTimeout(() => {
        if (role === 'organizer') navigate('/dashboard', { replace: true });
        else navigate('/attendee-dashboard', { replace: true });
      }, 0);
      return data;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await registerUser(userData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
      return data;
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setAccessToken(null);
      dispatch(logoutAction());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if server call fails
      setAccessToken(null);
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const data = await getCurrentUser();
      dispatch(setCredentials({ user: data.user, accessToken: localStorage.getItem('accessToken') }));
      return data.user;
    } catch (error) {
      console.error('Fetch user error:', error);
      logout();
      throw error;
    }
  };

  const updateProfile = async (payload) => {
    const data = await updateProfileApi(payload);
    dispatch(setCredentials({ user: data.user, accessToken: localStorage.getItem('accessToken') }));
    toast.success('Profile updated');
    return data.user;
  };

  const changePassword = async (payload) => {
    await changePasswordApi(payload);
    toast.success('Password updated');
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateProfile,
    changePassword,
  };
};

export default useAuth;