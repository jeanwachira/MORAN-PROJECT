import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cohort from "./pages/Cohort";
import Mentees from "./pages/Mentees";
import Mentors from "./pages/Mentor";
import Events from "./pages/Events";
import Parents from "./pages/Parents";
import ServiceProviders from "./pages/ServiceProviders";
import Signup from "./pages/Signup";
import AdminPages from "./pages/AdminPages";
import ProtectedRoute from "./pages/ProtectedRoute";
import Index from "./pages/Index";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Individual protected routes */}
        <Route path="/mentors" element={
          <ProtectedRoute>
            <Mentors />
          </ProtectedRoute>
        } />
        <Route path="/mentees" element={
          <ProtectedRoute>
            <Mentees />
          </ProtectedRoute>
        } />
        <Route path="/cohort" element={
          <ProtectedRoute>
            <Cohort />
          </ProtectedRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute>
            <Events />
          </ProtectedRoute>
        } />
        <Route path="/parents" element={
          <ProtectedRoute>
            <Parents />
          </ProtectedRoute>
        } />
        <Route path="/service-providers" element={
          <ProtectedRoute>
            <ServiceProviders />
          </ProtectedRoute>
        } />
        
        {/* Admin nested routes */}
        <Route path="/admin/*" element={<AdminPages />} />
        
        {/* Dashboard route */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Home route */}
        <Route path="/" element={<Index />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;