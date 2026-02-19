import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './components/Scanner';
import Attendees from './pages/Attendees';
import RegisterForm from './pages/register';

// Helper to check if admin is logged in
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('admin_token');
    return token ? children : <Navigate to="/" />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/attendees" element={<Attendees />} />
                <Route path="/register" element={<RegisterForm />} />


                <Route path="/scan" element={
                    <ProtectedRoute>
                        <Scanner />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;