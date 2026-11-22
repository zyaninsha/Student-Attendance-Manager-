import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SchoolClass, SchoolSection, Student } from '../../types/models';
import { exportToCSV } from '../../lib/exportUtils';

interface ParsedStudentRow {
  student_id: string;
  full_name: string;
  roll_number: string;
  class_name: string;
  section_name: string;
  class_id?: string;
  section_id?: string;
  guardian_name?: string;
  guardian_phone?: string;
  isValid: boolean;
  errors: string[];
}

interface StudentImportModalProps {
  isOpen: boolean;
  classes: SchoolClass[];
  sections: SchoolSection[];
  existingStudents: Student[];
  onImport: (newStudents: Partial<Student>[]) => Promise<void>;
  onClose: () => void;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  classes,
  sections,
  existingStudents,
  onImport,
  onClose,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Download Sample CSV template
  const handleDownloadTemplate = () => {
    const headers = [
      'Student ID',
      'Full Name',
      'Roll Number',
      'Class Name',
      'Section Name',
      'Guardian Name',
      'Guardian Phone',
    ];
    const sampleRows = [
      ['STU-2026-0101', 'Oliver Vance', '01', 'Grade 5', 'Section A', 'Arthur Vance', '+1 (555) 234-5678'],
      ['STU-2026-0102', 'Amelia Ward', '02', 'Grade 5', 'Section A', 'Evelyn Ward', '+1 (555) 876-5432'],
    ];
    exportToCSV('Student_Import_Template', headers, sampleRows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length < 2) {
          setError('The uploaded file appears to be empty or has no data rows.');
          return;
        }

        const headers: string[] = json[0].map((h: any) => String(h || '').trim().toLowerCase());
        const idCol = headers.findIndex((h) => h.includes('student') || h.includes('id'));
        const nameCol = headers.findIndex((h) => h.includes('name'));
        const rollCol = headers.findIndex((h) => h.includes('roll'));
        const classCol = headers.findIndex((h) => h.includes('class'));
        const secCol = headers.findIndex((h) => h.includes('sec'));
        const gNameCol = headers.findIndex((h) => h.includes('guardian') && !h.includes('phone'));
        const gPhoneCol = headers.findIndex((h) => h.includes('phone') || h.includes('contact'));

        const rows: ParsedStudentRow[] = [];

        for (let i = 1; i < json.length; i++) {
          const r = json[i];
          if (!r || r.length === 0 || !r[nameCol]) continue;

          const rawName = String(r[nameCol] || '').trim();
          const rawRoll = String(r[rollCol] || '').trim();
          let rawId = idCol !== -1 && r[idCol] ? String(r[idCol]).trim() : '';
          const rawClass = classCol !== -1 && r[classCol] ? String(r[classCol]).trim() : '';
          const rawSec = secCol !== -1 && r[secCol] ? String(r[secCol]).trim() : '';
          const rawGName = gNameCol !== -1 && r[gNameCol] ? String(r[gNameCol]).trim() : '';
          const rawGPhone = gPhoneCol !== -1 && r[gPhoneCol] ? String(r[gPhoneCol]).trim() : '';

          if (!rawId) {
            rawId = `STU-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
          }

          const rowErrors: string[] = [];

          if (!rawName) rowErrors.push('Missing Name');
          if (!rawRoll) rowErrors.push('Missing Roll Number');

          // Match class
          const matchedClass = classes.find(
            (c) => c.name.toLowerCase() === rawClass.toLowerCase()
          );
          if (!matchedClass) {
            rowErrors.push(`Class "${rawClass}" not found`);
          }

          // Match section
          let matchedSec: SchoolSection | undefined;
          if (matchedClass) {
            matchedSec = sections.find(
              (s) =>
                s.class_id === matchedClass.id &&
                s.name.toLowerCase() === rawSec.toLowerCase()
            );
            if (!matchedSec) {
              rowErrors.push(`Section "${rawSec}" not found in ${matchedClass.name}`);
            }
          }

          // Duplicate checks
          if (existingStudents.some((s) => s.student_id === rawId)) {
            rowErrors.push(`Duplicate ID ${rawId}`);
          }

          rows.push({
            student_id: rawId,
            full_name: rawName,
            roll_number: rawRoll,
            class_name: rawClass,
            section_name: rawSec,
            class_id: matchedClass?.id,
            section_id: matchedSec?.id,
            guardian_name: rawGName,
            guardian_phone: rawGPhone,
            isValid: rowErrors.length === 0,
            errors: rowErrors,
          });
        }

        setParsedRows(rows);
      } catch (err: any) {
        setError('Failed to parse file. Please upload a valid CSV or XLSX spreadsheet.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid && r.class_id && r.section_id);
    if (validRows.length === 0) return;

    setIsLoading(true);
    try {
      const recordsToInsert: Partial<Student>[] = validRows.map((r) => ({
        student_id: r.student_id,
        full_name: r.full_name,
        roll_number: r.roll_number,
        class_id: r.class_id!,
        section_id: r.section_id!,
        admission_date: new Date().toISOString().split('T')[0],
        guardian_name: r.guardian_name || null,
        guardian_phone: r.guardian_phone || null,
        status: 'active',
      }));

      await onImport(recordsToInsert);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error saving imported students.');
    } finally {
      setIsLoading(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Import Student Roster from Spreadsheet
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Instructions & Template Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
            <div>
              <p className="font-semibold">Import Guidelines</p>
              <p className="text-blue-700 mt-0.5">
                Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file. Each student requires a Full Name, Roll Number, Class Name, and Section Name.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-blue-700 font-semibold hover:bg-blue-100 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Excel / CSV File
            </label>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-lg"
            />
          </div>

          {/* Validation Summary */}
          {parsedRows.length > 0 && (
            <div className="flex items-center justify-between text-xs font-medium pt-2">
              <span className="text-slate-600">
                Found <strong>{parsedRows.length}</strong> rows in {fileName}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} Valid
                </span>
                {invalidCount > 0 && (
                  <span className="text-red-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {invalidCount} Invalid (Skipped)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Roll</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Class</th>
                    <th className="py-2 px-3">Section</th>
                    <th className="py-2 px-3">Guardian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((r, idx) => (
                    <tr key={idx} className={r.isValid ? 'hover:bg-slate-50' : 'bg-red-50/40'}>
                      <td className="py-2 px-3">
                        {r.isValid ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                            Ready
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-semibold" title={r.errors.join(', ')}>
                            {r.errors[0]}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono">{r.roll_number}</td>
                      <td className="py-2 px-3 font-semibold">{r.full_name}</td>
                      <td className="py-2 px-3">{r.class_name}</td>
                      <td className="py-2 px-3">{r.section_name}</td>
                      <td className="py-2 px-3 text-slate-500">{r.guardian_phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCommitImport}
            disabled={isLoading || validCount === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <Upload className="w-4 h-4" />
            <span>Import {validCount} Valid Students</span>
          </button>
        </div>
      </div>
    </div>
  );
};
