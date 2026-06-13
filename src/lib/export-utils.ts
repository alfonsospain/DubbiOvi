import type { Take } from './types';
import { formatTimeForDisplay } from './utils';
import * as XLSX from 'xlsx';

export const exportToExcel = (takes: Take[], projectName: string) => {
  const data = takes.map(t => ({
    'Take ID': t.id,
    'Character': t.character,
    'Start Time': formatTimeForDisplay(t.startSeconds),
    'End Time': formatTimeForDisplay(t.endSeconds),
    'Source Text': t.original,
    'Target Text': t.translation,
    'Status': t.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Takes');

  // Set column widths for a clean look
  worksheet['!cols'] = [
    { wch: 36 }, // Take ID
    { wch: 18 }, // Character
    { wch: 12 }, // Start Time
    { wch: 12 }, // End Time
    { wch: 45 }, // Source Text
    { wch: 45 }, // Target Text
    { wch: 12 }  // Status
  ];

  XLSX.writeFile(workbook, `${projectName || 'Project'}.xlsx`);
};

export const exportToCSV = (takes: Take[], projectName: string) => {
  const headers = ['Take ID', 'Character', 'Start Time', 'End Time', 'Source Text', 'Target Text', 'Status'];
  const escapeCSV = (val: string) => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = takes.map(t => [
    t.id,
    t.character,
    formatTimeForDisplay(t.startSeconds),
    formatTimeForDisplay(t.endSeconds),
    t.original,
    t.translation,
    t.status
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${projectName || 'Project'}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
