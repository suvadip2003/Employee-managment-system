import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/HRDashboard';
import Attendance from './pages/Attendance';
import LeaveRequest from './pages/LeaveRequest';
import LeaveManagement from './pages/LeaveManagement';
import EmployeeDirectory from './pages/EmployeeDirectory';
import Profile from './pages/Profile';

// Layout wrapper for authenticated pages
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Root redirect based on auth state
const RootRedirect = () => {
  const { isAuthenticated, isHR, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isHR ? '/hr/dashboard' : '/dashboard'} replace />;
};

// Redirect authenticated users away from auth pages
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, isHR, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (isAuthenticated) {
    return <Navigate to={isHR ? '/hr/dashboard' : '/dashboard'} replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public auth routes */}
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRedirect>
            <Register />
          </AuthRedirect>
        }
      />

      {/* Employee routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="employee">
            <AppLayout>
              <EmployeeDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute role="employee">
            <AppLayout>
              <Attendance />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedRoute role="employee">
            <AppLayout>
              <LeaveRequest />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* HR routes */}
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute role="hr">
            <AppLayout>
              <HRDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/leaves"
        element={
          <ProtectedRoute role="hr">
            <AppLayout>
              <LeaveManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/employees"
        element={
          <ProtectedRoute role="hr">
            <AppLayout>
              <EmployeeDirectory />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Shared routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
