import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Upload,
  Download,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { StudentModal } from './StudentModal';
import { StudentImportModal } from './StudentImportModal';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Student, SchoolClass, SchoolSection } from '../../types/models';
import { exportToCSV } from '../../lib/exportUtils';

export const StudentDirectoryView: React.FC = () => {
  const { user, role, isDemoMode } = useAuth();
  const isAdmin = role === 'admin';

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedSectionId, setSelectedSectionId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Load Classes & Sections
  useEffect(() => {
    const loadClasses = async () => {
      if (!isSupabaseConfigured || isDemoMode) {
        setClasses([
          { id: 'c-g5', institution_id: 'demo', name: 'Grade 5', numeric_order: 5 },
          { id: 'c-g6', institution_id: 'demo', name: 'Grade 6', numeric_order: 6 },
          { id: 'c-g10', institution_id: 'demo', name: 'Grade 10', numeric_order: 10 },
        ]);
        setSections([
          { id: 'sec-g5-a', institution_id: 'demo', class_id: 'c-g5', name: 'Section A' },
          { id: 'sec-g5-b', institution_id: 'demo', class_id: 'c-g5', name: 'Section B' },
          { id: 'sec-g6-a', institution_id: 'demo', class_id: 'c-g6', name: 'Section A' },
          { id: 'sec-g10-a', institution_id: 'demo', class_id: 'c-g10', name: 'Section A' },
        ]);
        return;
      }

      try {
        const { data: cls } = await supabase.from('classes').select('*').order('numeric_order');
        const { data: sec } = await supabase.from('sections').select('*').order('name');
        if (cls) setClasses(cls);
        if (sec) setSections(sec);
      } catch (err) {
        console.error('Error loading student classes:', err);
      }
    };
    loadClasses();
  }, [isDemoMode]);

  // Load Students
  const fetchStudents = async () => {
    setIsLoading(true);

    if (!isSupabaseConfigured || isDemoMode) {
      // 12 realistic starter students across classes
      const demoStudents: Student[] = [
        { id: 's1', institution_id: 'demo', student_id: 'STU-2026-0001', full_name: 'Ava Robinson', roll_number: '01', class_id: 'c-g5', section_id: 'sec-g5-a', class_name: 'Grade 5', section_name: 'Section A', admission_date: '2026-08-01', dob: '2016-04-12', gender: 'Female', guardian_name: 'David Robinson', guardian_phone: '+1 (555) 123-4567', status: 'active' },
        { id: 's2', institution_id: 'demo', student_id: 'STU-2026-0002', full_name: 'Benjamin Hayes', roll_number: '02', class_id: 'c-g5', section_id: 'sec-g5-a', class_name: 'Grade 5', section_name: 'Section A', admission_date: '2026-08-01', dob: '2016-02-19', gender: 'Male', guardian_name: 'Robert Hayes', guardian_phone: '+1 (555) 234-5678', status: 'active' },
        { id: 's3', institution_id: 'demo', student_id: 'STU-2026-0003', full_name: 'Charlotte Chen', roll_number: '03', class_id: 'c-g5', section_id: 'sec-g5-a', class_name: 'Grade 5', section_name: 'Section A', admission_date: '2026-08-01', dob: '2016-09-03', gender: 'Female', guardian_name: 'Wei Chen', guardian_phone: '+1 (555) 345-6789', status: 'active' },
        { id: 's4', institution_id: 'demo', student_id: 'STU-2026-0004', full_name: 'Daniel Miller', roll_number: '04', class_id: 'c-g5', section_id: 'sec-g5-a', class_name: 'Grade 5', section_name: 'Section A', admission_date: '2026-08-01', dob: '2016-11-20', gender: 'Male', guardian_name: 'Sarah Miller', guardian_phone: '+1 (555) 456-7890', status: 'active' },
        { id: 's5', institution_id: 'demo', student_id: 'STU-2026-0005', full_name: 'Emma Wilson', roll_number: '05', class_id: 'c-g5', section_id: 'sec-g5-b', class_name: 'Grade 5', section_name: 'Section B', admission_date: '2026-08-01', dob: '2016-01-15', gender: 'Female', guardian_name: 'James Wilson', guardian_phone: '+1 (555) 567-8901', status: 'active' },
        { id: 's6', institution_id: 'demo', student_id: 'STU-2026-0006', full_name: 'Finn O’Connor', roll_number: '06', class_id: 'c-g5', section_id: 'sec-g5-b', class_name: 'Grade 5', section_name: 'Section B', admission_date: '2026-08-01', dob: '2016-06-25', gender: 'Male', guardian_name: 'Patrick O’Connor', guardian_phone: '+1 (555) 678-9012', status: 'active' },
        { id: 's7', institution_id: 'demo', student_id: 'STU-2026-0007', full_name: 'Grace Patel', roll_number: '01', class_id: 'c-g6', section_id: 'sec-g6-a', class_name: 'Grade 6', section_name: 'Section A', admission_date: '2026-08-01', dob: '2015-08-11', gender: 'Female', guardian_name: 'Aarav Patel', guardian_phone: '+1 (555) 789-0123', status: 'active' },
        { id: 's8', institution_id: 'demo', student_id: 'STU-2026-0008', full_name: 'Henry Brooks', roll_number: '02', class_id: 'c-g6', section_id: 'sec-g6-a', class_name: 'Grade 6', section_name: 'Section A', admission_date: '2026-08-01', dob: '2015-05-18', gender: 'Male', guardian_name: 'Edward Brooks', guardian_phone: '+1 (555) 890-1234', status: 'active' },
        { id: 's9', institution_id: 'demo', student_id: 'STU-2026-0009', full_name: 'Isabella Diaz', roll_number: '01', class_id: 'c-g10', section_id: 'sec-g10-a', class_name: 'Grade 10', section_name: 'Section A', admission_date: '2026-08-01', dob: '2011-10-09', gender: 'Female', guardian_name: 'Carlos Diaz', guardian_phone: '+1 (555) 901-2345', status: 'active' },
        { id: 's10', institution_id: 'demo', student_id: 'STU-2026-0010', full_name: 'Jack Thompson', roll_number: '02', class_id: 'c-g10', section_id: 'sec-g10-a', class_name: 'Grade 10', section_name: 'Section A', admission_date: '2026-08-01', dob: '2011-03-30', gender: 'Male', guardian_name: 'Matthew Thompson', guardian_phone: '+1 (555) 012-3456', status: 'active' },
        { id: 's11', institution_id: 'demo', student_id: 'STU-2026-0011', full_name: 'Lucas Wright (Transferred)', roll_number: '99', class_id: 'c-g5', section_id: 'sec-g5-a', class_name: 'Grade 5', section_name: 'Section A', admission_date: '2026-08-01', dob: '2016-07-07', gender: 'Male', guardian_name: 'George Wright', guardian_phone: '+1 (555) 111-2222', status: 'inactive' },
      ];
      setStudents(demoStudents);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, class:classes(name), section:sections(name)')
        .order('roll_number');

      if (error) throw error;
      if (data) {
        const mapped: Student[] = data.map((d: any) => ({
          ...d,
          class_name: d.class?.name,
          section_name: d.section?.name,
        }));
        setStudents(mapped);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [isDemoMode]);

  // Client-side filtering & searching
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      if (selectedClassId !== 'all' && s.class_id !== selectedClassId) return false;
      if (selectedSectionId !== 'all' && s.section_id !== selectedSectionId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.full_name.toLowerCase().includes(q);
        const matchesId = s.student_id.toLowerCase().includes(q);
        const matchesRoll = s.roll_number.toLowerCase().includes(q);
        const matchesGuardian = s.guardian_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesRoll && !matchesGuardian) return false;
      }
      return true;
    });
  }, [students, searchQuery, selectedClassId, selectedSectionId, selectedStatus]);

  // Pagination calculation
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Student ID',
      'Roll Number',
      'Full Name',
      'Class',
      'Section',
      'Status',
      'Admission Date',
      'Guardian Name',
      'Guardian Phone',
    ];
    const rows = filteredStudents.map((s) => [
      s.student_id,
      s.roll_number,
      s.full_name,
      s.class_name || '',
      s.section_name || '',
      s.status,
      s.admission_date,
      s.guardian_name || '',
      s.guardian_phone || '',
    ]);
    exportToCSV(`Student_Directory_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // Add / Edit Save Handler
  const handleSaveStudent = async (studentData: Partial<Student>) => {
    if (!isSupabaseConfigured || isDemoMode) {
      if (editingStudent) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === editingStudent.id ? ({ ...s, ...studentData } as Student) : s
          )
        );
      } else {
        const newStu: Student = {
          id: `demo-s-${Date.now()}`,
          institution_id: 'demo',
          student_id: studentData.student_id!,
          full_name: studentData.full_name!,
          roll_number: studentData.roll_number!,
          class_id: studentData.class_id!,
          section_id: studentData.section_id!,
          admission_date: studentData.admission_date!,
          dob: studentData.dob,
          gender: studentData.gender,
          guardian_name: studentData.guardian_name,
          guardian_phone: studentData.guardian_phone,
          status: studentData.status || 'active',
          class_name: classes.find((c) => c.id === studentData.class_id)?.name,
          section_name: sections.find((s) => s.id === studentData.section_id)?.name,
        };
        setStudents((prev) => [...prev, newStu]);
      }
      return;
    }

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editingStudent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('students')
          .insert({
            ...studentData,
            institution_id: user!.institution_id,
          } as any);
        if (error) throw error;
      }
      fetchStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      throw err;
    }
  };

  // Import batch handler
  const handleBatchImport = async (newStudents: Partial<Student>[]) => {
    if (!isSupabaseConfigured || isDemoMode) {
      const formatted: Student[] = newStudents.map((s, i) => ({
        id: `demo-import-${Date.now()}-${i}`,
        institution_id: 'demo',
        student_id: s.student_id!,
        full_name: s.full_name!,
        roll_number: s.roll_number!,
        class_id: s.class_id!,
        section_id: s.section_id!,
        admission_date: s.admission_date!,
        guardian_name: s.guardian_name,
        guardian_phone: s.guardian_phone,
        status: 'active',
        class_name: classes.find((c) => c.id === s.class_id)?.name,
        section_name: sections.find((sec) => sec.id === s.section_id)?.name,
      }));
      setStudents((prev) => [...prev, ...formatted]);
      return;
    }

    try {
      const payload = newStudents.map((s) => ({
        ...s,
        institution_id: user!.institution_id,
      }));
      const { error } = await supabase.from('students').insert(payload as any);
      if (error) throw error;
      fetchStudents();
    } catch (err) {
      console.error('Batch import failed:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative min-w-[240px] max-w-md w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, roll number, or student ID..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Spreadsheet</span>
              </button>

              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsStudentModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Enroll Student</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-1">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filters:</span>
        </div>

        {/* Class Filter */}
        <select
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value);
            setSelectedSectionId('all');
            setCurrentPage(1);
          }}
          className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-slate-700"
        >
          <option value="all">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Section Filter */}
        <select
          value={selectedSectionId}
          onChange={(e) => {
            setSelectedSectionId(e.target.value);
            setCurrentPage(1);
          }}
          className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-slate-700"
        >
          <option value="all">All Sections</option>
          {sections
            .filter((s) => selectedClassId === 'all' || s.class_id === selectedClassId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as any);
            setCurrentPage(1);
          }}
          className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-slate-700"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <span className="ml-auto text-slate-500 font-mono">
          Showing <strong>{filteredStudents.length}</strong> enrolled records
        </span>
      </div>

      {/* 1,000+ Paginated Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4 w-16">Roll</th>
                <th className="py-3 px-4 w-32 font-mono">Student ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Class & Sec</th>
                <th className="py-3 px-4">Guardian Contact</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-slate-500 text-xs">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 tabular-nums">
                      {s.roll_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-xs">
                      {s.student_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {s.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.class_name || 'Grade 5'} · {s.section_name || 'Section A'}
                    </td>
                    <td className="py-3 px-4">
                      {s.guardian_phone ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{s.guardian_name}</span>
                          <a
                            href={`tel:${s.guardian_phone}`}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-mono"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span>{s.guardian_phone}</span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">None listed</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingStudent(s);
                            setIsStudentModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Student Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="py-1 px-2 border border-slate-300 rounded bg-white text-xs"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page · Page {currentPage} of {totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono tabular-nums px-2 font-semibold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        student={editingStudent}
        classes={classes}
        sections={sections}
        onSave={handleSaveStudent}
        onClose={() => setIsStudentModalOpen(false)}
      />

      {/* Spreadsheet Roster Import Modal */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        classes={classes}
        sections={sections}
        existingStudents={students}
        onImport={handleBatchImport}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
