import type { Take } from './types';
import { formatTimeForDisplay } from './utils';
import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';

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

// Word export helper to handle newlines within document fields
function createTextRunsForText(text: string): TextRun[] {
  const lines = (text || '').split('\n');
  const runs: TextRun[] = [];
  lines.forEach((line, index) => {
    if (index > 0) {
      runs.push(new TextRun({ break: 1 }));
    }
    runs.push(new TextRun({ text: line }));
  });
  return runs;
}

export const exportToWordSource = (
  takes: Take[],
  projectName: string,
  sourceLang: string,
  targetLang: string
) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: projectName || 'Untitled Project',
                bold: true,
                size: 36, // 18pt
              }),
            ],
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Source Language: ${sourceLang}`, bold: true }),
              new TextRun({ break: 1 }),
              new TextRun({ text: `Target Language: ${targetLang}`, bold: true }),
              new TextRun({ break: 1 }),
              new TextRun({ text: `Export Date: ${new Date().toLocaleDateString()}`, bold: true }),
            ],
            spacing: { after: 480 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'SOURCE TEXT EXPORT', bold: true, size: 28 })],
            spacing: { after: 360 },
          }),
          ...takes.flatMap((t, idx) => [
            new Paragraph({
              children: [
                new TextRun({ text: `Take #${idx + 1}`, bold: true, size: 24 }),
                new TextRun({ text: `  |  Character: ${t.character || 'Unknown'}`, bold: true }),
                new TextRun({
                  text: `  |  Timecode: ${formatTimeForDisplay(t.startSeconds)} - ${formatTimeForDisplay(
                    t.endSeconds
                  )}`,
                  bold: true,
                }),
              ],
              spacing: { before: 240, after: 120 },
            }),
            new Paragraph({
              children: createTextRunsForText(t.original || ''),
              spacing: { after: 240 },
            }),
          ]),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'Project'}_Source.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};

export const exportToWordTarget = (
  takes: Take[],
  projectName: string,
  sourceLang: string,
  targetLang: string
) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: projectName || 'Untitled Project',
                bold: true,
                size: 36, // 18pt
              }),
            ],
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Source Language: ${sourceLang}`, bold: true }),
              new TextRun({ break: 1 }),
              new TextRun({ text: `Target Language: ${targetLang}`, bold: true }),
              new TextRun({ break: 1 }),
              new TextRun({ text: `Export Date: ${new Date().toLocaleDateString()}`, bold: true }),
            ],
            spacing: { after: 480 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'TARGET TEXT EXPORT', bold: true, size: 28 })],
            spacing: { after: 360 },
          }),
          ...takes.flatMap((t, idx) => [
            new Paragraph({
              children: [
                new TextRun({ text: `Take #${idx + 1}`, bold: true, size: 24 }),
                new TextRun({ text: `  |  Character: ${t.character || 'Unknown'}`, bold: true }),
                new TextRun({
                  text: `  |  Timecode: ${formatTimeForDisplay(t.startSeconds)} - ${formatTimeForDisplay(
                    t.endSeconds
                  )}`,
                  bold: true,
                }),
                new TextRun({ text: `  |  Status: ${t.status}`, bold: true }),
              ],
              spacing: { before: 240, after: 120 },
            }),
            new Paragraph({
              children: createTextRunsForText(t.translation || ''),
              spacing: { after: 240 },
            }),
          ]),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'Project'}_Target.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};

export const exportToWordBoth = (
  takes: Take[],
  projectName: string,
  sourceLang: string,
  targetLang: string
) => {
  const tableHeaderCellBorders = {
    top: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
    bottom: { style: BorderStyle.SINGLE, size: 8, color: '333333' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'D3D3D3' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'D3D3D3' },
  };

  const tableBodyCellBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
  };

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        borders: tableHeaderCellBorders,
        children: [new Paragraph({ children: [new TextRun({ text: 'Take #', bold: true })] })],
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders: tableHeaderCellBorders,
        children: [new Paragraph({ children: [new TextRun({ text: 'Character', bold: true })] })],
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        borders: tableHeaderCellBorders,
        children: [new Paragraph({ children: [new TextRun({ text: 'Timecode', bold: true })] })],
      }),
      new TableCell({
        width: { size: 24, type: WidthType.PERCENTAGE },
        borders: tableHeaderCellBorders,
        children: [new Paragraph({ children: [new TextRun({ text: 'Source Text', bold: true })] })],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        borders: tableHeaderCellBorders,
        children: [new Paragraph({ children: [new TextRun({ text: 'Target Text', bold: true })] })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        borders: tableHeaderCellBorders,
        children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })],
      }),
    ],
  });

  const tableBodyRows = takes.map((t, idx) => {
    return new TableRow({
      children: [
        new TableCell({
          borders: tableBodyCellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1) })] })],
        }),
        new TableCell({
          borders: tableBodyCellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: t.character || '' })] })],
        }),
        new TableCell({
          borders: tableBodyCellBorders,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${formatTimeForDisplay(t.startSeconds)} - ${formatTimeForDisplay(
                    t.endSeconds
                  )}`,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: tableBodyCellBorders,
          children: [new Paragraph({ children: createTextRunsForText(t.original || '') })],
        }),
        new TableCell({
          borders: tableBodyCellBorders,
          children: [new Paragraph({ children: createTextRunsForText(t.translation || '') })],
        }),
        new TableCell({
          borders: tableBodyCellBorders,
          children: [new Paragraph({ children: [new TextRun({ text: t.status })] })],
        }),
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...tableBodyRows],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: projectName || 'Untitled Project',
                bold: true,
                size: 36, // 18pt
              }),
            ],
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Source Language: ${sourceLang}`, bold: true }),
              new TextRun({ break: 1 }),
              new TextRun({ text: `Target Language: ${targetLang}`, bold: true }),
              new TextRun({ break: 1 }),
              new TextRun({ text: `Export Date: ${new Date().toLocaleDateString()}`, bold: true }),
            ],
            spacing: { after: 480 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'PARALLEL TEXT EXPORT', bold: true, size: 28 })],
            spacing: { after: 360 },
          }),
          table,
        ],
      },
    ],
  });

  Packer.toBlob(doc).then(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'Project'}_Both.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};
