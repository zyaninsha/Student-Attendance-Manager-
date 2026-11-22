import React, { useState } from 'react';
import { Settings, Shield, Building, Percent, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const InstitutionSettingsView: React.FC = () => {
  const { user, institution, refreshUserData, isDemoMode } = useAuth();

  const [schoolName, setSchoolName] = useState(institution?.name || 'Greenwood Academy');
  const [schoolCode, setSchoolCode] = useState(institution?.code || 'GW-2026');
  const [address, setAddress] = useState(institution?.address || '100 Education Blvd, Academic District');
  const [phone, setPhone] = useState(institution?.phone || '+1 (555) 019-2834');
  const [email, setEmail] = useState(institution?.email || 'office@greenwood.edu');
  const [goodThreshold, setGoodThreshold] = useState(institution?.good_threshold || 90.0);
  const [warningThreshold, setWarningThreshold] = useState(institution?.warning_threshold || 75.0);

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSuccess(false);

    if (!isSupabaseConfigured || isDemoMode) {
      setTimeout(() => {
        setIsSaving(false);
        setIsSuccess(true);
      }, 400);
      return;
    }

    try {
      const { error } = await supabase
        .from('institutions')
        .update({
          name: schoolName.trim(),
          code: schoolCode.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          good_threshold: Number(goodThreshold),
          warning_threshold: Number(warningThreshold),
        })
        .eq('id', user!.institution_id);

      if (error) throw error;
      await refreshUserData();
      setIsSuccess(true);
    } catch (err) {
      console.error('Error saving institution settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Institution Profile & Attendance Policy</h3>
            <p className="text-xs text-slate-500">Configure school branding and attendance threshold ratings</p>
          </div>
        </div>

        {isSuccess && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Institution profile and attendance thresholds updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-6 text-xs">
          {/* School Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              General Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Name *</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional Code *</label>
                <input
                  type="text"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  required
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrative Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Attendance Thresholds */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              <span>Attendance Thresholds & Ratings</span>
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              These percentages define the automatic status labels and colors displayed across the dashboard, registers, and student reports.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-emerald-900">
                  Good Attendance Minimum (%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="50"
                  max="100"
                  value={goodThreshold}
                  onChange={(e) => setGoodThreshold(parseFloat(e.target.value))}
                  required
                  className="w-full py-1.5 px-3 border border-emerald-300 rounded-lg font-mono font-bold bg-white"
                />
                <p className="text-[10px] text-emerald-700">
                  Students at or above this percentage receive the green "Good" badge.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-amber-900">
                  Warning Threshold Minimum (%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="40"
                  max="99"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(parseFloat(e.target.value))}
                  required
                  className="w-full py-1.5 px-3 border border-amber-300 rounded-lg font-mono font-bold bg-white"
                />
                <p className="text-[10px] text-amber-700">
                  Students below this value receive the red "Low Attendance" badge and appear on the watchlist.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Institutional Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
