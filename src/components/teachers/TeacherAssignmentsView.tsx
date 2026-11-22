import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Teacher, TeacherClassAssignment, SchoolClass, SchoolSection } from '../../types/models';

export const TeacherAssignmentsView: React.FC = () => {
  const { user, isDemoMode } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<TeacherClassAssignment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);

  // Add Teacher Inputs
  const [empId, setEmpId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [designation, setDesignation] = useState('Senior Teacher');

  // Assignment Inputs
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);

    if (!isSupabaseConfigured || isDemoMode) {
      const demoTeachers: Teacher[] = [
        { id: 't-1', institution_id: 'demo', employee_id: 'EMP-101', full_name: 'John Smith', email: 'teacher.smith@greenwood.edu', designation: 'Grade 5 Lead Teacher', status: 'active' },
        { id: 't-2', institution_id: 'demo', employee_id: 'EMP-102', full_name: 'Rachel Adams', email: 'rachel.adams@greenwood.edu', designation: 'Mathematics Specialist', status: 'active' },
        { id: 't-3', institution_id: 'demo', employee_id: 'EMP-103', full_name: 'Marcus Bell', email: 'marcus.bell@greenwood.edu', designation: 'Science Instructor', status: 'active' },
      ];
      setTeachers(demoTeachers);

      setClasses([
        { id: 'c-g5', institution_id: 'demo', name: 'Grade 5', numeric_order: 5 },
        { id: 'c-g6', institution_id: 'demo', name: 'Grade 6', numeric_order: 6 },
        { id: 'c-g10', institution_id: 'demo', name: 'Grade 10', numeric_order: 10 },
      ]);

      setSections([
        { id: 'sec-g5-a', institution_id: 'demo', class_id: 'c-g5', name: 'Section A' },
        { id: 'sec-g5-b', institution_id: 'demo', class_id: 'c-g5', name: 'Section B' },
        { id: 'sec-g6-a', institution_id: 'demo', class_id: 'c-g6', name: 'Section A' },
      ]);

      setAssignments([
        { id: 'as-1', institution_id: 'demo', teacher_id: 't-1', class_id: 'c-g5', section_id: 'sec-g5-a', academic_session_id: 'sess-1', teacher_name: 'John Smith', class_name: 'Grade 5', section_name: 'Section A' },
        { id: 'as-2', institution_id: 'demo', teacher_id: 't-2', class_id: 'c-g5', section_id: 'sec-g5-b', academic_session_id: 'sess-1', teacher_name: 'Rachel Adams', class_name: 'Grade 5', section_name: 'Section B' },
      ]);

      setSelectedTeacherId('t-1');
      setSelectedClassId('c-g5');
      setSelectedSectionId('sec-g5-a');
      setIsLoading(false);
      return;
    }

    try {
      const { data: tData } = await supabase.from('teachers').select('*').order('full_name');
      const { data: cData } = await supabase.from('classes').select('*').order('numeric_order');
      const { data: sData } = await supabase.from('sections').select('*').order('name');
      const { data: aData } = await supabase
        .from('teacher_class_assignments')
        .select('*, teacher:teachers(full_name), class:classes(name), section:sections(name)');

      if (tData) {
        setTeachers(tData);
        if (tData.length > 0) setSelectedTeacherId(tData[0].id);
      }
      if (cData) {
        setClasses(cData);
        if (cData.length > 0) setSelectedClassId(cData[0].id);
      }
      if (sData) setSections(sData);
      if (aData) {
        const mapped: TeacherClassAssignment[] = aData.map((a: any) => ({
          ...a,
          teacher_name: a.teacher?.full_name,
          class_name: a.class?.name,
          section_name: a.section?.name,
        }));
        setAssignments(mapped);
      }
    } catch (err) {
      console.error('Error loading teachers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  // Keep section synced with class
  const availableSections = sections.filter((s) => s.class_id === selectedClassId);
  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(availableSections[0].id);
    }
  }, [selectedClassId, availableSections, selectedSectionId]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherEmail.trim()) return;

    const empCode = empId.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`;

    if (!isSupabaseConfigured || isDemoMode) {
      const newT: Teacher = {
        id: `demo-t-${Date.now()}`,
        institution_id: 'demo',
        employee_id: empCode,
        full_name: teacherName.trim(),
        email: teacherEmail.trim(),
        designation,
        status: 'active',
      };
      setTeachers((prev) => [...prev, newT]);
      setTeacherName('');
      setTeacherEmail('');
      setEmpId('');
      return;
    }

    try {
      await supabase.from('teachers').insert({
        institution_id: user!.institution_id,
        employee_id: empCode,
        full_name: teacherName.trim(),
        email: teacherEmail.trim(),
        designation,
        status: 'active',
      });
      setTeacherName('');
      setTeacherEmail('');
      setEmpId('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedClassId || !selectedSectionId) return;

    if (!isSupabaseConfigured || isDemoMode) {
      const teacherObj = teachers.find((t) => t.id === selectedTeacherId);
      const classObj = classes.find((c) => c.id === selectedClassId);
      const sectionObj = sections.find((s) => s.id === selectedSectionId);

      const newAssignment: TeacherClassAssignment = {
        id: `demo-as-${Date.now()}`,
        institution_id: 'demo',
        teacher_id: selectedTeacherId,
        class_id: selectedClassId,
        section_id: selectedSectionId,
        academic_session_id: 'sess-1',
        teacher_name: teacherObj?.full_name,
        class_name: classObj?.name,
        section_name: sectionObj?.name,
      };

      setAssignments((prev) => [...prev, newAssignment]);
      return;
    }

    try {
      const { data: sess } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();

      await supabase.from('teacher_class_assignments').insert({
        institution_id: user!.institution_id,
        teacher_id: selectedTeacherId,
        class_id: selectedClassId,
        section_id: selectedSectionId,
        academic_session_id: sess?.id || '00000000-0000-0000-0000-000000000000',
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!isSupabaseConfigured || isDemoMode) {
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      return;
    }
    try {
      await supabase.from('teacher_class_assignments').delete().eq('id', assignmentId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-Column: Teachers List on Left, Assignment Engine on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Teachers Directory & Quick Add */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty Directory</h3>
              <p className="text-xs text-slate-500">Registered teachers and staff</p>
            </div>
          </div>

          {/* Add Teacher Form */}
          <form onSubmit={handleAddTeacher} className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
            <p className="font-semibold text-slate-700">Add New Teacher</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="Emp ID (e.g. EMP-104)"
                className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Full Name *"
                required
                className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="Email Address *"
                required
                className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white"
              />
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Designation"
                className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Faculty</span>
            </button>
          </form>

          {/* Teacher List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-72 overflow-y-auto">
            {teachers.map((t) => (
              <div key={t.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{t.full_name}</span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {t.employee_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span>{t.email}</span>
                    <span>·</span>
                    <span>{t.designation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Class Section Assignment Engine */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Class & Section Authorization</h3>
              <p className="text-xs text-slate-500">
                Grant teachers permission to view and mark specific classes (enforced via database RLS)
              </p>
            </div>
          </div>

          {/* Assign Form */}
          <form onSubmit={handleAssignTeacher} className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
            <p className="font-semibold text-slate-700">Assign Teacher to Section</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full py-1.5 px-2 border border-slate-300 rounded-lg bg-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full py-1.5 px-2 border border-slate-300 rounded-lg bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Section</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full py-1.5 px-2 border border-slate-300 rounded-lg bg-white"
                >
                  {availableSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 px-3 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Authorize Class Assignment</span>
            </button>
          </form>

          {/* Active Assignments List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-72 overflow-y-auto">
            {assignments.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">No active class assignments yet.</p>
            ) : (
              assignments.map((as) => (
                <div key={as.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900">{as.teacher_name}</span>
                    <span className="text-slate-400 mx-1.5">assigned to</span>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {as.class_name} · {as.section_name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAssignment(as.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Revoke Assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
