import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// ── Auth Feature ──
import Register from './features/auth/Register';
import Login from './features/auth/Login';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';

// ── Dashboard Feature ──
import UserDashboard from './features/dashboard/UserDashboard';
import AdminDashboard from './features/dashboard/AdminDashboard';

// ── Delivery Feature ──
import CreateDelivery from './features/delivery/CreateDelivery';

// ── Analytics Feature ──
import Analytics from './features/analytics/Analytics';

// ── Profile Feature ──
import Profile from './features/profile/Profile';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* User Pages */}
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/create-delivery" element={<CreateDelivery />} />
          <Route path="/user/profile" element={<Profile />} />
          
          {/* Admin Pages */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/profile" element={<Profile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
