import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Lock, User, AlertCircle } from 'lucide-react';
import API from '../services/api';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await API.post('https://event-rd6t.onrender.com/api-token-auth/', credentials);
            localStorage.setItem('admin_token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-500 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Glass Card */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                    <div className="text-center mb-10">
                        <div className="inline-flex p-4 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-200">
                            <LogIn size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
                        <p className="text-gray-500 mt-2 font-medium">Event Administration Portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input 
                                type="text" 
                                required
                                placeholder="Username"
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium"
                                onChange={e => setCredentials({...credentials, username: e.target.value})}
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input 
                                type="password" 
                                required
                                placeholder="Password"
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium"
                                onChange={e => setCredentials({...credentials, password: e.target.value})}
                            />
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border border-red-100"
                            >
                                <AlertCircle size={18} />
                                {error}
                            </motion.div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-lg"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Sign In'}
                        </button>
                    </form>
                </div>
                
                <p className="text-center text-white/80 mt-8 text-sm font-medium">
                    &copy; 2026 Secured Event Management System
                </p>
            </motion.div>
        </div>
    );
};

export default Login;