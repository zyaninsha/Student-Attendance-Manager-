import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';
import { Student, SchoolClass, SchoolSection } from '../../types/models';

interface StudentModalProps {
  isOpen: boolean;
  student?: Student | null;
  classes: SchoolClass[];
  sections: SchoolSection[];
  onSave: (studentData: Partial<Student>) => Promise<void>;
  onClose: () => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  student,
  classes,
  sections,
  onSave,
  onClose,
}) => {
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setFullName(student.full_name);
      setRollNumber(student.roll_number);
      setStudentId(student.student_id);
      setClassId(student.class_id);
      setSectionId(student.section_id);
      setAdmissionDate(student.admission_date || '');
      setDob(student.dob || '');
      setGender(student.gender || 'Male');
      setGuardianName(student.guardian_name || '');
      setGuardianPhone(student.guardian_phone || '');
      setStatus(student.status);
    } else {
      // Auto-generate fresh student ID
      const randomId = `STU-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
      setStudentId(randomId);
      setFullName('');
      setRollNumber('');
      if (classes.length > 0) setClassId(classes[0].id);
      setAdmissionDate(new Date().toISOString().split('T')[0]);
      setDob('');
      setGender('Male');
      setGuardianName('');
      setGuardianPhone('');
      setStatus('active');
    }
  }, [student, isOpen, classes]);

  // Keep section synced with class
  const availableSections = sections.filter((s) => s.class_id === classId);
  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.some((s) => s.id === sectionId)) {
      setSectionId(availableSections[0].id);
    }
  }, [classId, availableSections, sectionId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !rollNumber.trim() || !classId || !sectionId) {
      setError('Please fill in student name, roll number, class, and section.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        student_id: studentId,
        full_name: fullName.trim(),
        roll_number: rollNumber.trim(),
        class_id: classId,
        section_id: sectionId,
        admission_date: admissionDate,
        dob: dob || null,
        gender,
        guardian_name: guardianName.trim() || null,
        guardian_phone: guardianPhone.trim() || null,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error saving student record.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              {student ? 'Edit Student Profile' : 'Enroll New Student'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="stu-modal-id" className="block text-xs font-semibold text-slate-700 mb-1">
                Student ID (Auto)
              </label>
              <input
                id="stu-modal-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="stu-modal-roll" className="block text-xs font-semibold text-slate-700 mb-1">
                Roll Number *
              </label>
              <input
                id="stu-modal-roll"
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 01"
                required
                className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="stu-modal-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Student Full Name *
            </label>
            <input
              id="stu-modal-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ava Robinson"
              required
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="stu-modal-class" className="block text-xs font-semibold text-slate-700 mb-1">
                Class *
              </label>
              <select
                id="stu-modal-class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="stu-modal-section" className="block text-xs font-semibold text-slate-700 mb-1">
                Section *
              </label>
              <select
                id="stu-modal-section"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                required
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {availableSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="stu-modal-dob" className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth (Optional)
              </label>
              <input
                id="stu-modal-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="stu-modal-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                id="stu-modal-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="stu-modal-guardian" className="block text-xs font-semibold text-slate-700 mb-1">
                Guardian Full Name
              </label>
              <input
                id="stu-modal-guardian"
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="e.g. John Robinson"
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="stu-modal-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Guardian Phone
              </label>
              <input
                id="stu-modal-phone"
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="stu-modal-status" className="block text-xs font-semibold text-slate-700 mb-1">
              Enrollment Status
            </label>
            <select
              id="stu-modal-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="active">Active (Currently Attending)</option>
              <option value="inactive">Inactive (Transferred / Preserves History)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Inactive students are hidden from daily registers but retain full historical attendance reports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{student ? 'Save Changes' : 'Enroll Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
