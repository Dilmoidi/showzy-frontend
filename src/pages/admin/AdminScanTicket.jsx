import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Scan, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function AdminScanTicket() {
  const { API_BASE, adminToken } = useAuth();
  const [scannerActive, setScannerActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('IDLE'); // IDLE, SCANNING, SUCCESS, ALREADY_USED, ERROR
  const [bookingDetails, setBookingDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [previousScanTime, setPreviousScanTime] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualBookingId, setManualBookingId] = useState('');
  
  const scannerRef = useRef(null);

  const startScanner = async () => {
    setScanStatus('SCANNING');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanFailure
      );
      setScannerActive(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setScanStatus('ERROR');
      setErrorMessage('Could not access camera. Please grant permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerActive) {
      try {
        await scannerRef.current.stop();
        setScannerActive(false);
      } catch (err) {
        console.error("Error stopping scanner", err);
      }
    }
  };

  const parseDecodedText = (text) => {
    const trimmed = text.trim();
    
    // Check if it's a URL (either absolute or relative path containing /ticket/)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('/ticket/')) {
      try {
        let urlString = trimmed;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          urlString = window.location.origin + (trimmed.startsWith('/') ? '' : '/') + trimmed;
        }
        
        const url = new URL(urlString);
        const pathParts = url.pathname.split('/');
        const ticketIdx = pathParts.indexOf('ticket');
        
        let bookingId = '';
        if (ticketIdx !== -1 && ticketIdx + 1 < pathParts.length) {
          bookingId = pathParts[ticketIdx + 1];
        } else {
          bookingId = pathParts[pathParts.length - 1];
        }
        
        const token = url.searchParams.get('token') || '';
        return { booking_id: bookingId, token };
      } catch (err) {
        console.error("Failed to parse URL:", err);
      }
    }
    
    // Attempt to parse JSON payload
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      // Fall back to raw text/UUID
      return { booking_id: trimmed, token: '' };
    }
  };

  const onScanSuccess = async (decodedText) => {
    await stopScanner(); // Stop immediately so we don't scan twice
    const payload = parseDecodedText(decodedText);
    verifyTicket(payload);
  };

  const onScanFailure = (error) => {
    // Ignore frequent scan failures during search
  };

  const verifyTicket = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/theatre-admin/verify-ticket/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          booking_id: payload.booking_id,
          token: payload.token
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setBookingDetails(data.booking_details);
        setScanStatus('SUCCESS');
        
        // Auto reset after 4 seconds
        setTimeout(() => {
          resetScanner();
        }, 4000);
      } else {
        if (data.message === 'Ticket Already Used') {
          setScanStatus('ALREADY_USED');
          setPreviousScanTime(data.previous_scan_time);
        } else {
          setScanStatus('ERROR');
        }
        setErrorMessage(data.message || data.error || 'Verification Failed');
      }
    } catch (error) {
      setScanStatus('ERROR');
      setErrorMessage('Network error during verification.');
    }
  };

  const resetScanner = () => {
    setScanStatus('IDLE');
    setBookingDetails(null);
    setErrorMessage('');
    setPreviousScanTime(null);
    setManualMode(false);
    setManualBookingId('');
  };

  const handleManualVerify = () => {
    const trimmed = manualBookingId.trim();
    if (!trimmed) return;
    setManualMode(false);
    const payload = parseDecodedText(trimmed);
    verifyTicket(payload);
  };

  const fileInputRef = useRef(null);

  const scanFromImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setScanStatus('SCANNING');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }
      const decodedText = await scannerRef.current.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      console.error("Image scan failed:", err);
      setScanStatus('ERROR');
      setErrorMessage('Could not read QR code from image. Try a clearer image.');
    }
    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Scan className="text-purple-400" />
          Access Control Scanner
        </h1>
      </div>

      <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl min-h-[500px] flex flex-col items-center justify-center">
        
        {/* Hidden file input for image scan */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={scanFromImage} 
          className="hidden" 
        />

        {scanStatus === 'IDLE' && (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center border-4 border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
              <Scan size={64} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Ready to Scan</h2>
              <p className="text-gray-400 mt-2">Use camera, upload an image, or enter a booking ID manually.</p>
            </div>
            <div className="flex items-center gap-4 justify-center flex-wrap">
              <button 
                onClick={startScanner}
                className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/30 text-base flex items-center justify-center gap-3"
              >
                <Scan size={20} />
                Camera
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/30 text-base flex items-center justify-center gap-3"
              >
                📁 Image
              </button>
              <button 
                onClick={() => setManualMode(true)}
                className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/30 text-base flex items-center justify-center gap-3"
              >
                <Keyboard size={20} />
                Manual Entry
              </button>
            </div>

            {manualMode && (
              <div className="w-full max-w-md mx-auto mt-6 space-y-4 animate-fade-in">
                <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 space-y-4">
                  <label className="block text-sm text-gray-400 font-medium">Paste Booking ID or QR JSON data:</label>
                  <input
                    type="text"
                    value={manualBookingId}
                    onChange={(e) => setManualBookingId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
                    placeholder="e.g. b17d7331-fc30-4b4a-b38b-59bc838a7d50"
                    className="w-full bg-gray-900 border border-gray-600 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder-gray-500 font-mono"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleManualVerify}
                      disabled={!manualBookingId.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      Verify Ticket
                    </button>
                    <button
                      onClick={() => { setManualMode(false); setManualBookingId(''); }}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div 
          id="reader" 
          className={`w-full max-w-md mx-auto rounded-3xl overflow-hidden border-4 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)] ${scanStatus === 'SCANNING' ? 'block' : 'hidden'}`}
        ></div>

        {scanStatus === 'SCANNING' && (
          <button 
            onClick={stopScanner}
            className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors"
          >
            Cancel Scanning
          </button>
        )}

        {scanStatus === 'SUCCESS' && bookingDetails && (
          <div className="w-full max-w-md animate-fade-in text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)]">
              <CheckCircle2 size={64} className="text-green-400" />
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-green-400 tracking-wide uppercase">Entry Allowed</h2>
              <p className="text-gray-400 mt-1">Ticket successfully validated</p>
            </div>

            <div className="bg-gray-800/50 border border-green-500/30 rounded-2xl p-6 text-left space-y-3">
              <p className="flex justify-between border-b border-gray-700 pb-2"><span className="text-gray-500">Customer</span> <span className="font-bold text-white">{bookingDetails.customer}</span></p>
              <p className="flex justify-between border-b border-gray-700 pb-2"><span className="text-gray-500">Movie</span> <span className="font-bold text-blue-300">{bookingDetails.movie}</span></p>
              <p className="flex justify-between border-b border-gray-700 pb-2"><span className="text-gray-500">Screen</span> <span className="font-bold text-white">{bookingDetails.screen}</span></p>
              <p className="flex justify-between border-b border-gray-700 pb-2"><span className="text-gray-500">Seats</span> <span className="font-bold text-yellow-400">{bookingDetails.seats}</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Check-in</span> <span className="font-mono text-xs text-green-300 mt-1">{bookingDetails.checked_in_at}</span></p>
            </div>

            <p className="text-sm text-gray-500 animate-pulse">Auto-resetting scanner...</p>
          </div>
        )}

        {scanStatus === 'ALREADY_USED' && (
          <div className="w-full max-w-md animate-fade-in text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center border-4 border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.4)]">
              <AlertTriangle size={64} className="text-orange-400" />
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-orange-400 tracking-wide uppercase">Ticket Already Used</h2>
              <p className="text-gray-400 mt-1">This QR code was previously scanned.</p>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm mb-1">Previous Scan Time:</p>
              <p className="font-mono text-lg text-orange-300 font-bold">{previousScanTime}</p>
            </div>

            <button 
              onClick={resetScanner}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw size={18} /> Scan Next
            </button>
          </div>
        )}

        {scanStatus === 'ERROR' && (
          <div className="w-full max-w-md animate-fade-in text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]">
              <XCircle size={64} className="text-red-400" />
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-red-500 tracking-wide uppercase">Invalid Ticket</h2>
              <p className="text-gray-400 mt-1">Entry Denied</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <p className="font-medium text-red-300">{errorMessage}</p>
            </div>

            <button 
              onClick={resetScanner}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw size={18} /> Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
