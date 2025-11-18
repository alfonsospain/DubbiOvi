'use client';

import React, { useState } from 'react';
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
import { Plus, Trash2 } from 'lucide-react';

interface GlossaryPanelProps {
  glossary: GlossaryEntry[];
  onGlossaryChange: (glossary: GlossaryEntry[]) => void;
}

const GlossaryPanel: React.FC<GlossaryPanelProps> = ({
  glossary,
  onGlossaryChange,
}) => {
  const [newEntry, setNewEntry] = useState({ sourceTerm: '', targetTerm: '', notes: '' });

  const handleAddEntry = () => {
    if (!newEntry.sourceTerm || !newEntry.targetTerm) {
      return; // Or show a toast
    }
    const newGlossary = [
      ...glossary,
      { ...newEntry, id: crypto.randomUUID() },
    ];
    onGlossaryChange(newGlossary);
    setNewEntry({ sourceTerm: '', targetTerm: '', notes: '' });
  };
  
  const handleUpdateEntry = (id: string, field: keyof GlossaryEntry, value: string) => {
      const updatedGlossary = glossary.map(entry => 
        entry.id === id ? {...entry, [field]: value} : entry
      );
      onGlossaryChange(updatedGlossary);
  }

  const handleDeleteEntry = (id: string) => {
    const updatedGlossary = glossary.filter(entry => entry.id !== id);
    onGlossaryChange(updatedGlossary);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Term</TableHead>
                <TableHead>Target Term</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
                  <TableCell>
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
                  <TableCell>
                     <Button
                      variant="outline"
                      size="icon"
                      onClick={handleAddEntry}
                    >
                      <Plus className="h-4 w-4" />
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
