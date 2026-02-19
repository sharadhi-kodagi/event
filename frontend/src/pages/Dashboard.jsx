import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    UserPlus, QrCode, Users, Calendar, Clock, LogOut, 
    RefreshCw, Search, X, UserCheck, Loader2 
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast'; // Run 'npm install react-hot-toast' if not installed
import API from '../services/api';

const Dashboard = () => {
    const navigate = useNavigate();
    
    // States
    const [eventData, setEventData] = useState({ name: 'Loading...', windows: [] });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [windowDetails, setWindowDetails] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Main Dashboard Stats
    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setIsRefreshing(true);
        try {
            const res = await API.get('event-info/'); 
            setEventData(res.data);
            if (!silent) toast.success("Dashboard synced");
        } catch (err) { 
            toast.error("Failed to sync dashboard stats");
        } finally {
            setTimeout(() => setIsRefreshing(false), 600);
        }
    }, []);

    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadingToast = toast.loading("Importing guests...");
    try {
        const res = await API.post('import-guests/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(res.data.message, { id: loadingToast });
        fetchData(); // Refresh dashboard counts
    } catch (err) {
        toast.error("Import failed. Check CSV format.", { id: loadingToast });
    }
};

    // Fetch Specific Window Details (Who is checked in)
    const fetchWindowDetails = async (windowId) => {
        setLoadingDetails(true);
        setSearchQuery(''); // Reset search when opening new window
        try {
            const res = await API.get(`window-stats/${windowId}/`);
            setWindowDetails(res.data);
            setIsDetailsOpen(true);
        } catch (err) {
            toast.error("Could not load guest status for this window");
        } finally {
            setLoadingDetails(false);
        }
    };

    // Manual Check-in from Modal
    const handleModalCheckIn = async (attendeeId) => {
        try {
            await API.post(`manual-checkin/${attendeeId}/`);
            
            // Update Modal UI locally
            setWindowDetails(prev => ({
                ...prev,
                attendees: prev.attendees.map(a => 
                    a.id === attendeeId ? { ...a, scanned: true, timestamp: "Just now" } : a
                )
            }));
            
            toast.success("Guest checked in manually");
            fetchData(true); // Sync dashboard counts silently
        } catch (err) {
            toast.error(err.response?.data?.error || "Check-in failed");
        }
    };

    // Filter attendees based on search
    const filteredAttendees = windowDetails?.attendees?.filter(guest =>
        guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
            <Toaster position="top-right" reverseOrder={false} />

            {/* Top Navigation */}
            <nav className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Calendar className="text-white" size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">{eventData.name}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => fetchData()} 
                            disabled={isRefreshing}
                            className="p-2 text-slate-400 hover:text-indigo-400 transition-all active:scale-90"
                        >
                            <RefreshCw size={22} className={`${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                        </button>
                        <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-red-400 transition">
                            <LogOut size={22}/>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Dashboard Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {eventData.windows.map((window, idx) => (
                        <motion.div 
                            key={idx}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => fetchWindowDetails(window.id)}
                            className="bg-slate-800/50 border border-slate-700 p-8 rounded-[2rem] relative overflow-hidden group cursor-pointer"
                        >
                            <div className="relative z-10">
                                <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-xs">{window.name}</p>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-5xl font-black text-white">{window.current_count}</h2>
                                    <span className="text-slate-500 font-bold text-xl">/ {window.capacity}</span>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm text-indigo-400 font-medium">
                                    <Clock size={16}/> {window.start_time} - {window.end_time}
                                </div>
                            </div>
                            <QrCode className="absolute -right-4 -bottom-4 text-slate-700/20 group-hover:text-indigo-500/10 transition-colors" size={160} />
                        </motion.div>
                    ))}
                </div>

                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Management Console</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <ActionButton onClick={() => navigate('/register')} icon={<UserPlus/>} label="Register" color="bg-indigo-600 hover:bg-indigo-500" />
                    <ActionButton onClick={() => navigate('/scan')} icon={<QrCode/>} label="Scan QR" color="bg-slate-800 hover:bg-slate-700 border border-slate-700" />
                    <ActionButton onClick={() => navigate('/attendees')} icon={<Users/>} label="Guest List" color="bg-slate-800 hover:bg-slate-700 border border-slate-700" />
                    <label className="bg-emerald-600 hover:bg-emerald-500 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all active:scale-95 shadow-xl">
        <span className="p-3 bg-white/10 rounded-xl"><Users /></span>
        <span className="font-bold tracking-wide text-white text-center">Import CSV</span>
        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
    </label>
                </div>
            </main>

            {/* Window Details Modal */}
            <AnimatePresence>
                {isDetailsOpen && windowDetails && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-800 bg-slate-900/50">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{windowDetails.window_name}</h3>
                                        <p className="text-slate-400 text-sm">Real-time attendance tracking</p>
                                    </div>
                                    <button onClick={() => setIsDetailsOpen(false)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition">
                                        <X size={20}/>
                                    </button>
                                </div>
                                
                                {/* Search Bar inside Modal */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                    <input 
                                        type="text"
                                        placeholder="Search by name or email..."
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Guest List in Modal */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {filteredAttendees?.length > 0 ? (
                                    filteredAttendees.map(guest => (
                                        <div key={guest.id} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30 hover:bg-slate-800/50 transition">
                                            <div>
                                                <p className="font-bold text-white">{guest.name}</p>
                                                <p className="text-xs text-slate-500">{guest.email}</p>
                                            </div>
                                            
                                            <div>
                                                {guest.scanned ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                                                            <UserCheck size={16}/> Checked In
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">{guest.timestamp}</span>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleModalCheckIn(guest.id)}
                                                        className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-bold rounded-xl border border-indigo-600/20 transition-all active:scale-95"
                                                    >
                                                        Manual Check-in
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-slate-500">No guests found matching your search.</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Loading Overlay for details */}
            {loadingDetails && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/40 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                </div>
            )}
        </div>
    );
};

const ActionButton = ({ icon, label, onClick, color }) => (
    <button onClick={onClick} className={`${color} p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-xl`}>
        <span className="p-3 bg-white/10 rounded-xl">{icon}</span>
        <span className="font-bold tracking-wide text-white">{label}</span>
    </button>
);

export default Dashboard;