import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Checks if the application is currently running inside native Android/iOS
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Helper to trigger standard browser download on Web / Desktop
 */
function downloadBlobWeb(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports data to CSV with native Android file saving & sharing support
 */
export async function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<{ success: boolean; path?: string }> {
  const fullFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  const csvContent = [
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = cell === null || cell === undefined ? '' : String(cell);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  if (isNativePlatform()) {
    try {
      // Write file to Android Cache/Documents directory
      const writeResult = await Filesystem.writeFile({
        path: fullFilename,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      // Present Android native share/open intent so teacher can open in Excel or share via Drive/WhatsApp
      await Share.share({
        title: 'Export Attendance CSV',
        text: `Attendance register export: ${fullFilename}`,
        url: writeResult.uri,
        dialogTitle: 'Open or Share Attendance Report',
      });

      return { success: true, path: writeResult.uri };
    } catch (err) {
      console.warn('Native filesystem write failed, falling back to blob:', err);
    }
  }

  // Fallback for Web/Browser preview
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlobWeb(fullFilename, blob);
  return { success: true };
}

/**
 * Exports data to a formatted Excel (.xlsx) file with native Android file saving & sharing
 */
export async function exportToXLSX(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<{ success: boolean; path?: string }> {
  const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const colWidths = headers.map((header) => ({
    wch: Math.max(header.length + 3, 12),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  if (isNativePlatform()) {
    try {
      // Generate base64 binary string representation for Capacitor Filesystem
      const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

      const writeResult = await Filesystem.writeFile({
        path: fullFilename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Share intent
      await Share.share({
        title: 'Export Attendance Excel',
        text: `Attendance Register: ${fullFilename}`,
        url: writeResult.uri,
        dialogTitle: 'Open with Excel or Share',
      });

      return { success: true, path: writeResult.uri };
    } catch (err) {
      console.warn('Native xlsx export failed, falling back to blob:', err);
    }
  }

  // Web download
  XLSX.writeFile(workbook, fullFilename);
  return { success: true };
}

/**
 * Triggers browser print dialog for reports and registers
 */
export function triggerPrint() {
  window.print();
}
