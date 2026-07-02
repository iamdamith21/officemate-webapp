import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import CreateDelivery from './pages/CreateDelivery';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
