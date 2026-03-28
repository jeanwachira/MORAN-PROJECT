import React from 'react';
import { Navigate } from 'react-router-dom';

function isTokenValid(token) {
    try {
        // Decode the payload (middle part of the JWT)
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds; Date.now() is in milliseconds
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (!token || !userData || !isTokenValid(token)) {
        // Clear stale data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        return <Navigate to="/login" replace />;
    }

    return children;
}