'use client';

import React, { useState, useMemo } from 'react';
import type { Take } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { toSRT, toVTT } from '@/lib/utils';
import { HardDriveDownload, HardDriveUpload } from 'lucide-react';

interface ImportExportPanelProps {
  takes: Take[];
  onImport: (takes: Take[]) => void;
}

type ExportFormat = 'json' | 'srt' | 'vtt' | 'txt';

const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  takes,
  onImport,
}) => {
  const { toast } = useToast();
  const [importJson, setImportJson] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  const handleImport = () => {
    if (!importJson.trim()) {
      toast({
        title: 'Import Error',
        description: 'Input is empty. Please paste your JSON data.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const parsed = JSON.parse(importJson);
      const takesToImport = Array.isArray(parsed)
        ? parsed
        : parsed.takes && Array.isArray(parsed.takes)
        ? parsed.takes
        : null;

      if (!takesToImport) {
        throw new Error('Invalid JSON structure.');
      }
      onImport(takesToImport);
      toast({
        title: 'Import Successful',
        description: `${takesToImport.length} takes have been loaded.`,
      });
      setImportJson('');
    } catch (error) {
      toast({
        title: 'Import Failed',
        description:
          'Could not parse JSON. Please check the format and try again.',
        variant: 'destructive',
      });
      console.error(error);
    }
  };

  const exportData = useMemo(() => {
    switch (exportFormat) {
      case 'srt':
        return toSRT(takes);
      case 'vtt':
        return toVTT(takes);
      case 'txt':
        return takes
          .map(t => `${t.character}: ${t.translation || t.original}`)
          .join('\n');
      case 'json':
      default:
        return JSON.stringify({ takes }, null, 2);
    }
  }, [takes, exportFormat]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportData).then(() => {
        toast({ title: "Copied to clipboard!"})
    }).catch(err => {
        toast({ title: "Failed to copy", variant: "destructive"})
    })
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Import your script or export your work.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <HardDriveDownload className="mr-2 h-4 w-4" /> Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <HardDriveUpload className="mr-2 h-4 w-4" /> Import
            </TabsTrigger>
          </TabsList>
          <TabsContent value="export" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Select
                  value={exportFormat}
                  onValueChange={(v: ExportFormat) => setExportFormat(v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="srt">SRT Subtitles</SelectItem>
                    <SelectItem value="vtt">VTT Subtitles</SelectItem>
                    <SelectItem value="txt">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCopyToClipboard}>Copy to Clipboard</Button>
              </div>
              <Textarea
                readOnly
                value={exportData}
                className="h-48 font-mono text-xs"
                placeholder="Exported data will appear here."
              />
            </div>
          </TabsContent>
          <TabsContent value="import" className="mt-4">
            <div className="space-y-4">
              <Textarea
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                className="h-48 font-mono text-xs"
                placeholder='Paste your JSON data here. Can be an array of takes or a full project export.'
              />
              <Button onClick={handleImport}>Load Takes from JSON</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImportExportPanel;
