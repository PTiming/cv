import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/common/Navbar';
import Loading from './components/common/Loading';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Feed from './components/feed/Feed';
import Profile from './components/profile/Profile';
import Notifications from './components/notifications/Notifications';
import MoodleDashboard from './components/moodle/MoodleDashboard';
import CourseDetail from './components/moodle/CourseDetail';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to home if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading text="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Layout
const AppLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </>
  );
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Feed />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Feed explore />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Notifications />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/moodle"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MoodleDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/moodle/course/:courseId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CourseDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
