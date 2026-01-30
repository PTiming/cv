import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

const initialState = {
  user: authService.getStoredUser(),
  token: authService.getToken(),
  isAuthenticated: authService.isAuthenticated(),
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const response = await authService.getMe();
          if (response.success) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: response.data, token: state.token }
            });
          }
        } catch (error) {
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadUser();
  }, [state.token]);

  const login = async (credentials) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: response.data
        });
        return { success: true };
      } else {
        // Handle unsuccessful response
        const message = response.message || 'Login failed';
        dispatch({ type: 'AUTH_FAILURE', payload: message });
        return { success: false, error: message };
      }
    } catch (error) {
      // Handle both message string and errors array from validation
      let message = 'Login failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.errors?.length > 0) {
        message = error.response.data.errors[0].message;
      }
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const response = await authService.register(userData);
      if (response.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: response.data
        });
        return { success: true };
      } else {
        // Handle unsuccessful response
        const message = response.message || 'Registration failed';
        dispatch({ type: 'AUTH_FAILURE', payload: message });
        return { success: false, error: message };
      }
    } catch (error) {
      // Handle both message string and errors array from validation
      let message = 'Registration failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.errors?.length > 0) {
        message = error.response.data.errors[0].message;
      }
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    localStorage.setItem('user', JSON.stringify({ ...state.user, ...userData }));
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
