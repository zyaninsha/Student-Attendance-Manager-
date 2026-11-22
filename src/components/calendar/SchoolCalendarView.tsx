import React, { useState, useEffect } from 'react';
import { CalendarRange, Plus, Trash2, Shield, Lock, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { SchoolHoliday } from '../../types/models';

export const SchoolCalendarView: React.FC = () => {
  const { user, institution, isDemoMode } = useAuth();
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);

  // Add Holiday inputs
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [isBreak, setIsBreak] = useState(false);

  // Working Days Toggles
  const [workingDays, setWorkingDays] = useState<string[]>(
    institution?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  );
  const [isSavingDays, setIsSavingDays] = useState(false);

  const allWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadHolidays = async () => {
    if (!isSupabaseConfigured || isDemoMode) {
      setHolidays([
        { id: 'h1', institution_id: 'demo', title: 'National Teachers Day', start_date: '2026-09-05', end_date: '2026-09-05', description: 'Institutional observance', is_academic_break: false },
        { id: 'h2', institution_id: 'demo', title: 'Autumn Mid-Term Break', start_date: '2026-10-18', end_date: '2026-10-22', description: 'School closed for recess', is_academic_break: true },
        { id: 'h3', institution_id: 'demo', title: 'Winter Holiday Recess', start_date: '2026-12-23', end_date: '2027-01-04', description: 'Winter break for students and faculty', is_academic_break: true },
      ]);
      return;
    }

    try {
      const { data } = await supabase.from('school_holidays').select('*').order('start_date');
      if (data) setHolidays(data);
    } catch (err) {
      console.error('Error loading holidays:', err);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [isDemoMode]);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    if (!isSupabaseConfigured || isDemoMode) {
      const newH: SchoolHoliday = {
        id: `demo-h-${Date.now()}`,
        institution_id: 'demo',
        title: title.trim(),
        start_date: startDate,
        end_date: endDate,
        description: description.trim() || null,
        is_academic_break: isBreak,
      };
      setHolidays((prev) => [...prev, newH]);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      return;
    }

    try {
      await supabase.from('school_holidays').insert({
        institution_id: user!.institution_id,
        title: title.trim(),
        start_date: startDate,
        end_date: endDate,
        description: description.trim() || null,
        is_academic_break: isBreak,
      });
      setTitle('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      loadHolidays();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!isSupabaseConfigured || isDemoMode) {
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      return;
    }
    try {
      await supabase.from('school_holidays').delete().eq('id', id);
      loadHolidays();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveWorkingDays = async () => {
    setIsSavingDays(true);
    if (!isSupabaseConfigured || isDemoMode) {
      setTimeout(() => setIsSavingDays(false), 300);
      return;
    }
    try {
      await supabase
        .from('institutions')
        .update({ working_days: workingDays })
        .eq('id', user!.institution_id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDays(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-Column: Holiday Schedule & Working Days Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Working Days Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard School Days</h3>
              <p className="text-xs text-slate-500">Days when attendance is expected</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {allWeekDays.map((day) => {
              const isSelected = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span>{day}</span>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-blue-700 font-bold text-[11px]">
                      <Check className="w-3.5 h-3.5" /> Working Day
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Weekend / Closed</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSaveWorkingDays}
            disabled={isSavingDays}
            className="w-full py-2 font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isSavingDays ? 'Saving...' : 'Save Working Days'}
          </button>
        </div>

        {/* Right: Holidays Manager */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Official School Holidays</h3>
              <p className="text-xs text-slate-500">
                Days marked as holiday automatically lock normal register marking and are never counted as student absences
              </p>
            </div>
          </div>

          {/* Add Holiday Form */}
          <form onSubmit={handleAddHoliday} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
            <p className="font-semibold text-slate-800">Register Official School Holiday</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Holiday Title (e.g. Winter Break)"
                required
                className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description or notes (optional)"
                className="flex-1 py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
              />
              <button
                type="submit"
                className="px-4 py-1.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg flex items-center justify-center gap-1 shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Holiday</span>
              </button>
            </div>
          </form>

          {/* Holidays List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {holidays.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No holidays scheduled for this term.</p>
            ) : (
              holidays.map((h) => (
                <div key={h.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{h.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        Holiday (H)
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500">
                      {h.start_date === h.end_date ? h.start_date : `${h.start_date} → ${h.end_date}`}
                    </p>
                    {h.description && (
                      <p className="text-[11px] text-slate-600">{h.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove Holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
