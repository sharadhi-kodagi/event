import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, ChevronLeft, UserCheck, UserX, X,Mail, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';

const Attendees = () => {
    const [attendees, setAttendees] = useState([]);
    const [sendingId, setSendingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAttendee, setSelectedAttendee] = useState(null);
    const [toast, setToast] = useState({ message: '', type: '', visible: false });
    const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ ...toast, visible: false }), 3000);
};
    const navigate = useNavigate();

    useEffect(() => {
        fetchAttendees();
    }, []);

    const handleResend = async (id) => {
    setSendingId(id); // Show loading for this specific row
    try {
        await API.post(`send-ticket/${id}/`);
        showToast("Ticket sent successfully!", "success");
    } catch (err) {
        showToast("Failed to send email", "error");
    } finally {
        setSendingId(null);
    }
};

    const fetchAttendees = async () => {
        try {
            const res = await API.get('list/');
            setAttendees(res.data);
        } catch (err) {
            console.error("Failed to fetch attendees");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this attendee?")) {
            try {
                await API.delete(`list/${id}/`); 
                setAttendees(attendees.filter(a => a.id !== id));
            } catch (err) {
                showToast("Delete Failed"); // REPLACED ALERT
            }
        }
    };

    const openEditModal = (attendee) => {
        setSelectedAttendee({ ...attendee });
        setIsEditModalOpen(true);
    };
    const handleManualCheckIn = async (id) => {
    // Optional: Add a confirmation so you don't accidentally check someone in
    if (!window.confirm("Manually check in this guest?")) return;

    try {
        // We call the same check-in endpoint your scanner uses
        // Or a dedicated manual endpoint if you prefer
        const res = await API.post(`manual-checkin/${id}/`);
        
        if (res.status === 200) {
            // Update the local list so the UI reflects the change
            setAttendees(attendees.map(a => 
                a.id === id ? { ...a, is_checked_in: true } : a
            ));
            showToast("Guest checked in successfully!", "success");
        }
    } catch (err) {
        const errorMsg = err.response?.data?.error || "Check-in failed";
        showToast(errorMsg, "error");
    }
};

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await API.patch(`list/${selectedAttendee.id}/`, {
                name: selectedAttendee.name,
                email: selectedAttendee.email,
                phone_number: selectedAttendee.phone_number
            });
            setAttendees(attendees.map(a => a.id === selectedAttendee.id ? res.data : a));
            setIsEditModalOpen(false);
            showToast("Attendee updated successfully!", "success"); // REPLACED ALERT
        } catch (err) {
            showToast("Update failed. Please try again.", "error"); // REPLACED ALERT
        }
    };

    const filteredAttendees = attendees.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition">
                        <ChevronLeft size={20} /> Back to Dashboard
                    </button>
                    
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search attendees..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-5 font-bold text-gray-600 text-sm">ATTENDEE</th>
                                <th className="p-5 font-bold text-gray-600 text-sm">STATUS</th>
                                <th className="p-5 font-bold text-gray-600 text-sm">PHONE</th>
                                <th className="p-5 font-bold text-gray-600 text-sm text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredAttendees.map((person) => (
                                <tr key={person.id} className="hover:bg-indigo-50/30 transition">
                                    <td className="p-5">
                                        <div className="font-bold text-gray-900">{person.name}</div>
                                        <div className="text-sm text-gray-500">{person.email}</div>
                                    </td>
                                    <td className="p-5">
                                        {person.is_checked_in ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                <UserCheck size={14} /> Checked In
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                                                <UserX size={14} /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-5 text-gray-600 font-medium">{person.phone_number || 'N/A'}</td>
                                    <td className="p-5 text-right space-x-2">
                                        <button onClick={() => openEditModal(person)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(person.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                                            <Trash2 size={18} />
                                        </button>
  <button 
    onClick={() => handleManualCheckIn(person.id)} 
    disabled={person.is_checked_in}
    className={`p-2 rounded-lg transition-all ${
        person.is_checked_in 
        ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
        : 'text-emerald-600 hover:bg-emerald-50 active:scale-90'
    }`}
    title={person.is_checked_in ? "Already Checked In" : "Manual Check-in"}
>
    <UserCheck size={18} />
</button>
                                        <button 
        onClick={() => handleResend(person.id)} 
        disabled={sendingId === person.id}
        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50"
        title="Send Ticket Email"
    >
        {sendingId === person.id ? (
            <Loader2 className="animate-spin" size={18} />
        ) : (
            <Mail size={18} />
        )}
    </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>

            {/* Edit Modal Overlay */}
            <AnimatePresence>
                {isEditModalOpen && selectedAttendee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Name</label>
                                    <input 
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        value={selectedAttendee.name}
                                        onChange={(e) => setSelectedAttendee({...selectedAttendee, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
                                    <input 
                                        type="email"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        value={selectedAttendee.email}
                                        onChange={(e) => setSelectedAttendee({...selectedAttendee, email: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Phone</label>
                                    <input 
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        value={selectedAttendee.phone_number || ''}
                                        onChange={(e) => setSelectedAttendee({...selectedAttendee, phone_number: e.target.value})}
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Modern Notification Toast */}
<AnimatePresence>
    {toast.visible && (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white ${
                toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
        >
            {toast.type === 'success' ? <UserCheck size={20} /> : <UserX size={20} />}
            {toast.message}
        </motion.div>
    )}
</AnimatePresence>
        </div>
    );
};

export default Attendees;