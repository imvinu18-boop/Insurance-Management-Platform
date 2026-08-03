// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    const token = localStorage.getItem('token');

    // 1. Check Login Authentication Token
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // 2. Check Allowed Role Restriction
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Dynamic fallback based on actual role
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'agent') return <Navigate to="/agent/dashboard" replace />;
        return <Navigate to="/customer/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;