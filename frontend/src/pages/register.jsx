import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const RegisterForm = () => {
    const [formData, setFormData] = useState({ name: '', email: '', phone_number: '' });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Helper to trigger toast and auto-hide
    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('https://event-rd6t.onrender.com/api/register/', formData);
            
            showToast("Success! Your ticket will be emailed shortly.", "success");
            setFormData({ name: '', email: '', phone_number: '' });
        } catch (error) {
            console.error("Registration Error:", error.response?.data);
            const errorMsg = error.response?.data?.email ? "Email already registered" : "Registration failed";
            showToast(errorMsg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[400px] flex items-center justify-center p-4">
            {/* TOAST NOTIFICATION */}
            {toast.show && (
                <div className={`fixed top-5 right-5 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl transition-all animate-bounce z-50 ${
                    toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                } text-white`}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium">{toast.message}</span>
                    <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:opacity-70">
                        <X size={16} />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6 border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Event Entry</h2>
                    <p className="text-gray-500 text-sm">Register to receive your QR ticket.</p>
                </div>

                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Full Name"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                    <input 
                        type="email" 
                        placeholder="Email Address"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Phone Number"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white font-bold p-3 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Get My Ticket"}
                </button>
            </form>
        </div>
    );
};

export default RegisterForm;