import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import API from '../services/api';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const Scanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, scanning, success, error

    useEffect(() => {
        const scanner = new Html5QrcodeScanner('reader', {
            qrbox: { width: 250, height: 250 },
            fps: 10,
        });

        scanner.render(onScanSuccess, onScanError);

        async function onScanSuccess(result) {
            scanner.clear(); // Stop scanning once we get a result
            setScanResult(result);
            setStatus('scanning');
            
            try {
                const res = await API.post('check-in/', { token: result });
                setScanResult(res.data);
                setStatus(res.data.status === 'success' ? 'success' : 'warning');
                if ("vibrate" in navigator) {
                if (res.data.status === 'success') {
                navigator.vibrate(100); // Quick pulse for success
                } else {
                navigator.vibrate([100, 50, 100]); // SOS-style vibration for errors
                }
                }
            } catch (err) {
                setStatus('error');
            }
        }

        function onScanError(err) { /* silent fail for constant scanning */ }
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-8">Gate Scanner</h2>
            
            <div id="reader" className="w-full max-w-sm overflow-hidden rounded-3xl bg-black"></div>

            {status !== 'idle' && (
                <div className={`mt-8 p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl ${
                    status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-amber-500'
                }`}>
                    {status === 'success' ? <CheckCircle className="mx-auto mb-2" size={48}/> : <AlertCircle className="mx-auto mb-2" size={48}/>}
                    <h3 className="text-xl font-bold">{scanResult?.name || 'Error'}</h3>
                    <p className="opacity-90">{scanResult?.message || 'Check failed'}</p>
                    
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 flex items-center gap-2 mx-auto bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition"
                    >
                        <RefreshCw size={18}/> Scan Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Scanner;