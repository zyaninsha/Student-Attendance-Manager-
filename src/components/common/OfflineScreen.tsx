import React from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface OfflineScreenProps {
  onRetry: () => void;
  isChecking?: boolean;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({
  onRetry,
  isChecking = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-6 select-none animate-in fade-in duration-200">
      <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-center justify-center text-rose-400 mb-6 shadow-xl">
        <WifiOff className="w-10 h-10 animate-pulse" />
      </div>

      <div className="text-center max-w-sm space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white">
          No Internet Connection
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Student Attendance Manager requires an active internet connection to securely synchronize records with your school's database.
        </p>
      </div>

      <div className="mt-4 p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-left max-w-xs w-full text-xs text-slate-300 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-amber-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Troubleshooting Tips:</span>
        </div>
        <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-0.5">
          <li>Check if Wi-Fi or Mobile Data is turned on</li>
          <li>Turn Airplane Mode on and off</li>
          <li>Move to an area with stronger signal</li>
        </ul>
      </div>

      <button
        onClick={onRetry}
        disabled={isChecking}
        className="mt-6 flex items-center justify-center gap-2 w-full max-w-xs py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
        <span>{isChecking ? 'Checking Connection...' : 'Retry Connection'}</span>
      </button>

      <p className="mt-6 text-[10px] text-slate-500 font-mono">
        Student Attendance Manager · Android Client
      </p>
    </div>
  );
};
