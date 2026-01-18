import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeEditor from './components/ResumeBuilder/ResumeEditor';
import ResumePreview from './pages/ResumePreview'; 
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';

export default function AppRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/resume-editor" element={
          <ProtectedRoute>
            <ResumeEditor />
          </ProtectedRoute>
        } />
        <Route path="/resume-preview" element={
          <ProtectedRoute>
            <ResumePreview />
          </ProtectedRoute>
        } />
      </Routes>
      <Footer />
    </>
  );
}
