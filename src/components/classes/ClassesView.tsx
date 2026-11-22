import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Trash2, Calendar, Layers, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { SchoolClass, SchoolSection, AcademicSession } from '../../types/models';

export const ClassesView: React.FC = () => {
  const { user, isDemoMode } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  // Inputs
  const [newClassName, setNewClassName] = useState('');
  const [newClassOrder, setNewClassOrder] = useState('1');
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedClassForSection, setSelectedClassForSection] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [sessionStartDate, setSessionStartDate] = useState('');
  const [sessionEndDate, setSessionEndDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured || isDemoMode) {
      setClasses([
        { id: 'c-g5', institution_id: 'demo', name: 'Grade 5', numeric_order: 5 },
        { id: 'c-g6', institution_id: 'demo', name: 'Grade 6', numeric_order: 6 },
        { id: 'c-g10', institution_id: 'demo', name: 'Grade 10', numeric_order: 10 },
      ]);
      setSections([
        { id: 'sec-1', institution_id: 'demo', class_id: 'c-g5', name: 'Section A' },
        { id: 'sec-2', institution_id: 'demo', class_id: 'c-g5', name: 'Section B' },
        { id: 'sec-3', institution_id: 'demo', class_id: 'c-g6', name: 'Section A' },
        { id: 'sec-4', institution_id: 'demo', class_id: 'c-g10', name: 'Section A' },
      ]);
      setSessions([
        { id: 'sess-1', institution_id: 'demo', name: '2026-2027 Academic Year', start_date: '2026-08-01', end_date: '2027-06-30', is_current: true },
      ]);
      setSelectedClassForSection('c-g5');
      setIsLoading(false);
      return;
    }

    try {
      const { data: cls } = await supabase.from('classes').select('*').order('numeric_order');
      const { data: sec } = await supabase.from('sections').select('*').order('name');
      const { data: sess } = await supabase.from('academic_sessions').select('*').order('start_date');

      if (cls) {
        setClasses(cls);
        if (cls.length > 0) setSelectedClassForSection(cls[0].id);
      }
      if (sec) setSections(sec);
      if (sess) setSessions(sess);
    } catch (err) {
      console.error('Error loading class settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    if (!isSupabaseConfigured || isDemoMode) {
      const newCls: SchoolClass = {
        id: `demo-c-${Date.now()}`,
        institution_id: 'demo',
        name: newClassName.trim(),
        numeric_order: parseInt(newClassOrder, 10) || 1,
      };
      setClasses((prev) => [...prev, newCls]);
      setNewClassName('');
      return;
    }

    try {
      await supabase.from('classes').insert({
        institution_id: user!.institution_id,
        name: newClassName.trim(),
        numeric_order: parseInt(newClassOrder, 10) || 1,
      });
      setNewClassName('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim() || !selectedClassForSection) return;

    if (!isSupabaseConfigured || isDemoMode) {
      const newSec: SchoolSection = {
        id: `demo-sec-${Date.now()}`,
        institution_id: 'demo',
        class_id: selectedClassForSection,
        name: newSectionName.trim(),
      };
      setSections((prev) => [...prev, newSec]);
      setNewSectionName('');
      return;
    }

    try {
      await supabase.from('sections').insert({
        institution_id: user!.institution_id,
        class_id: selectedClassForSection,
        name: newSectionName.trim(),
      });
      setNewSectionName('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Grid: Classes on Left, Sections on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Classes Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">School Classes / Grade Levels</h3>
              <p className="text-xs text-slate-500">Configure institutional grades (e.g. Grade 5, Grade 10)</p>
            </div>
          </div>

          {/* Add Class Form */}
          <form onSubmit={handleAddClass} className="flex gap-2 text-xs">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="e.g. Grade 7"
              required
              className="flex-1 py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newClassOrder}
              onChange={(e) => setNewClassOrder(e.target.value)}
              placeholder="Order"
              className="w-16 py-2 px-2 border border-slate-300 rounded-lg text-center"
              title="Numeric sort order"
            />
            <button
              type="submit"
              className="px-3.5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Classes List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {classes.map((cls) => (
              <div key={cls.id} className="py-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-bold">
                    {cls.numeric_order}
                  </span>
                  <span className="font-bold text-slate-900">{cls.name}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {sections.filter((s) => s.class_id === cls.id).length} Sections
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sections Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Layers className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Class Sections</h3>
              <p className="text-xs text-slate-500">Sub-divisions under each class (e.g. Section A, Section B)</p>
            </div>
          </div>

          {/* Add Section Form */}
          <form onSubmit={handleAddSection} className="flex gap-2 text-xs">
            <select
              value={selectedClassForSection}
              onChange={(e) => setSelectedClassForSection(e.target.value)}
              className="py-2 px-3 border border-slate-300 rounded-lg bg-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="e.g. Section C"
              required
              className="flex-1 py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Sections List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
            {sections.map((sec) => {
              const parentClass = classes.find((c) => c.id === sec.class_id);
              return (
                <div key={sec.id} className="py-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{sec.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{parentClass?.name || 'Class'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Academic Sessions Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Academic Sessions</h3>
            <p className="text-xs text-slate-500">Define academic terms and designate the current operating session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`p-4 rounded-xl border ${
                sess.is_current
                  ? 'bg-blue-50/50 border-blue-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm">{sess.name}</span>
                {sess.is_current && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                    <CheckCircle2 className="w-3 h-3" /> Current
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {sess.start_date} → {sess.end_date}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
