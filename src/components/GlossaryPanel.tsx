'use client';

import React, { useState, useRef } from 'react';
import type { GlossaryEntry } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GlossaryPanelProps {
  glossary: GlossaryEntry[];
  onGlossaryChange: (glossary: GlossaryEntry[]) => void;
  projectName?: string;
}

const SOURCE_ALIASES = ['source', 'source term', 'original', 'term'];
const TARGET_ALIASES = ['target', 'target term', 'translation', 'equivalent'];
const NOTES_ALIASES = ['notes', 'comment', 'context', 'example'];

const GlossaryPanel: React.FC<GlossaryPanelProps> = ({
  glossary,
  onGlossaryChange,
  projectName,
}) => {
  const { toast } = useToast();
  const [newEntry, setNewEntry] = useState({ sourceTerm: '', targetTerm: '', notes: '' });
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddEntry = () => {
    const trimmedSource = newEntry.sourceTerm.trim();
    const trimmedTarget = newEntry.targetTerm.trim();

    if (!trimmedSource || !trimmedTarget) {
      toast({
        title: 'Validation Error',
        description: 'Source Term and Target Term cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    const newGlossary = [
      ...glossary,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        sourceTerm: trimmedSource,
        targetTerm: trimmedTarget,
        notes: newEntry.notes.trim(),
      },
    ];

    onGlossaryChange(newGlossary);
    setNewEntry({ sourceTerm: '', targetTerm: '', notes: '' });

    // Return focus automatically to the Source Term field
    setTimeout(() => {
      sourceInputRef.current?.focus();
    }, 0);

    toast({
      title: 'Term added successfully.',
    });
  };
  
  const handleUpdateEntry = (id: string, field: keyof GlossaryEntry, value: string) => {
    const updatedGlossary = glossary.map(entry => 
      entry.id === id ? {...entry, [field]: value} : entry
    );
    onGlossaryChange(updatedGlossary);
  };

  const handleDeleteEntry = (id: string) => {
    const updatedGlossary = glossary.filter(entry => entry.id !== id);
    onGlossaryChange(updatedGlossary);
  };

  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal);
        currentVal = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
        row.push(currentVal);
        lines.push(row);
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal);
      lines.push(row);
    }
    return lines;
  };

  const processImportData = (rawRows: any[][]) => {
    if (rawRows.length === 0) {
      toast({
        title: 'Import Error',
        description: 'File is empty.',
        variant: 'destructive',
      });
      return;
    }

    // First row is the header
    const headers = rawRows[0].map(h => String(h).trim().toLowerCase());
    
    // Find matching columns using aliases
    const sourceIndex = headers.findIndex(h => SOURCE_ALIASES.includes(h));
    const targetIndex = headers.findIndex(h => TARGET_ALIASES.includes(h));
    const notesIndex = headers.findIndex(h => NOTES_ALIASES.includes(h));

    if (sourceIndex === -1 || targetIndex === -1) {
      toast({
        title: 'Import Failed',
        description: 'Could not detect Source and Target columns. Please verify the glossary structure.',
        variant: 'destructive',
      });
      return;
    }

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    const newEntries: GlossaryEntry[] = [];
    const existingKeys = new Set(
      glossary.map(g => `${g.sourceTerm.trim().toLowerCase()} ||| ${g.targetTerm.trim().toLowerCase()}`)
    );
    const addedKeysInImport = new Set<string>();

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      // Skip completely empty rows
      if (!row || row.length === 0 || row.every(val => val === undefined || val === null || String(val).trim() === '')) {
        continue;
      }

      const sourceVal = row[sourceIndex];
      const targetVal = row[targetIndex];
      const notesVal = notesIndex !== -1 ? row[notesIndex] : '';

      const sourceStr = sourceVal !== undefined && sourceVal !== null ? String(sourceVal).trim() : '';
      const targetStr = targetVal !== undefined && targetVal !== null ? String(targetVal).trim() : '';
      const notesStr = notesVal !== undefined && notesVal !== null ? String(notesVal).trim() : '';

      if (!sourceStr || !targetStr) {
        errorCount++;
        continue;
      }

      const key = `${sourceStr.toLowerCase()} ||| ${targetStr.toLowerCase()}`;
      if (existingKeys.has(key) || addedKeysInImport.has(key)) {
        duplicateCount++;
        continue;
      }

      newEntries.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        sourceTerm: sourceStr,
        targetTerm: targetStr,
        notes: notesStr,
      });
      addedKeysInImport.add(key);
      importedCount++;
    }

    if (newEntries.length > 0) {
      onGlossaryChange([...glossary, ...newEntries]);
    }

    toast({
      title: 'Glossary Import Complete',
      description: (
        <div className="text-xs mt-1 space-y-0.5">
          <div>Imported: {importedCount}</div>
          <div>Skipped duplicates: {duplicateCount}</div>
          <div>Errors: {errorCount}</div>
        </div>
      ),
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx');

    if (isExcel) {
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
          processImportData(rawRows);
        } catch (err) {
          toast({
            title: 'Import Failed',
            description: 'Could not parse Excel file.',
            variant: 'destructive',
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const rawRows = parseCSV(text);
          processImportData(rawRows);
        } catch (err) {
          toast({
            title: 'Import Failed',
            description: 'Could not parse CSV file.',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    const baseName = projectName ? projectName.trim() : 'Project';
    const sanitizedBase = baseName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    const fileName = `${sanitizedBase || 'Project'}_Glossary`;

    if (format === 'csv') {
      const headers = ['Source Term', 'Target Term', 'Notes'];
      const escapeCSV = (val: string) => {
        if (val === undefined || val === null) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = glossary.map(g => [
        g.sourceTerm,
        g.targetTerm,
        g.notes || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const data = glossary.map(g => ({
        'Source Term': g.sourceTerm,
        'Target Term': g.targetTerm,
        'Notes': g.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Glossary');

      worksheet['!cols'] = [
        { wch: 30 }, // Source
        { wch: 30 }, // Target
        { wch: 45 }  // Notes
      ];

      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }

    toast({
      title: 'Export Successful',
      description: `Saved glossary as ${fileName}.${format}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Glossary / Translation Memory</CardTitle>
        <CardDescription>
          Define key terms and their preferred translations for consistency.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" /> Import Glossary
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Export Glossary
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-xs">
                <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')} className="cursor-pointer">
                  Export as Excel (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Term</TableHead>
                <TableHead>Target Term</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {glossary.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Input
                      value={entry.sourceTerm}
                      onChange={e => handleUpdateEntry(entry.id, 'sourceTerm', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={entry.targetTerm}
                      onChange={e => handleUpdateEntry(entry.id, 'targetTerm', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={entry.notes}
                      onChange={e => handleUpdateEntry(entry.id, 'notes', e.target.value)}
                      className="h-8"
                      placeholder="Optional notes"
                    />
                  </TableCell>
                  <TableCell className="w-[120px] text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Row for new entry */}
              <TableRow>
                <TableCell>
                  <Input
                    ref={sourceInputRef}
                    value={newEntry.sourceTerm}
                    onChange={e => setNewEntry({...newEntry, sourceTerm: e.target.value})}
                    placeholder="e.g., Objection"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newEntry.targetTerm}
                    onChange={e => setNewEntry({...newEntry, targetTerm: e.target.value})}
                    placeholder="e.g., Objeción"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newEntry.notes}
                    onChange={e => setNewEntry({...newEntry, notes: e.target.value})}
                    placeholder="Optional notes"
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="w-[120px]">
                  <Button
                    variant="outline"
                    onClick={handleAddEntry}
                    className="w-full h-8 text-xs font-semibold"
                  >
                    Add New Term
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlossaryPanel;
