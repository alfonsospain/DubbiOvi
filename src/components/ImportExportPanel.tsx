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
import { toSRT, toVTT, parseTimestampToSeconds } from '@/lib/utils';
import { HardDriveDownload, HardDriveUpload, FileText, UploadCloud, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { Input } from './ui/input';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import { extractAudioTrack } from '@/lib/audio-utils';
import { getAudioTranscription } from '@/app/actions';
import { loadApiKey } from '@/lib/apiKeyStorage';
import { SUPPORTED_LANGUAGES } from '@/lib/data';


interface ImportExportPanelProps {
  takes: Take[];
  onImport: (takes: Take[]) => void;
  videoFile?: File | null;
  defaultSourceLang?: string;
  projectName?: string;
}

type ExportFormat = 'json' | 'srt' | 'vtt' | 'txt';

const STAGE_DETAILS = {
  preparing: {
    title: 'Preparing audio...',
    desc: 'Extracting the audio track from the video.'
  },
  optimizing: {
    title: 'Optimizing audio...',
    desc: 'Preparing the audio for speech recognition.'
  },
  uploading: {
    title: 'Sending audio to AI...',
    desc: 'Sending audio securely to the AI service.'
  },
  transcribing: {
    title: 'AI is transcribing...',
    desc: 'This may take several minutes for long videos. Please keep DubbiOvi open while processing.'
  },
  generating: {
    title: 'Generating takes...',
    desc: 'Organizing the transcription into dialogue segments.'
  },
  completed: {
    title: 'Completed.',
    desc: 'All speech segments processed successfully.'
  }
};


const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  takes,
  onImport,
  videoFile,
  defaultSourceLang,
  projectName,
}) => {
  const { toast } = useToast();
  const [importJson, setImportJson] = useState('');
  const [importScript, setImportScript] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStage, setTranscriptionStage] = useState<'preparing' | 'optimizing' | 'uploading' | 'transcribing' | 'generating' | 'completed' | null>(null);
  const [selectedAsrLang, setSelectedAsrLang] = useState('Auto-Detect');
  const [hasApiKey, setHasApiKey] = useState(false);

  React.useEffect(() => {
    setHasApiKey(!!loadApiKey());
  }, []);

  const handleAsrTranscription = async () => {
    if (!videoFile) {
      toast({
        title: 'No Video Loaded',
        description: 'Please load a video file in the player first.',
        variant: 'destructive',
      });
      return;
    }

    setIsTranscribing(true);
    setTranscriptionStage('preparing');

    try {
      // Step 1: Decode and downsample video audio to 16kHz mono WAV Blob
      const audioBlob = await extractAudioTrack(videoFile);

      // Step 2: Package WAV file and target language selection in FormData
      setTranscriptionStage('optimizing');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('sourceLang', selectedAsrLang);
      const userApiKey = loadApiKey();
      if (userApiKey) {
        formData.append('apiKey', userApiKey);
      }

      // Step 3: Trigger Next.js Server Action
      setTranscriptionStage('uploading');
      setTranscriptionStage('transcribing');
      const result = await getAudioTranscription(formData);

      if (!result) {
        throw new Error('Transcription failed. No response from AI service.');
      }

      if (!result.takes || result.takes.length === 0) {
        throw new Error('No speech segments detected in this video.');
      }

      // Step 4: Map Gemini takes to DubbiOvi Take structure
      setTranscriptionStage('generating');
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.round((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${mins}:${secs}.${ms}`;
      };

      const newTakes: Take[] = result.takes.map(t => {
        const startSecs = parseTimestampToSeconds(t.startTime);
        const endSecs = parseTimestampToSeconds(t.endTime);
        return {
          id: uuidv4(),
          character: t.character,
          original: t.original,
          translation: '',
          notes: '',
          status: 'Pending',
          startSeconds: startSecs,
          endSeconds: endSecs,
          time: `${formatTime(startSecs)} --> ${formatTime(endSecs)}`,
        };
      });

      // Step 5: Save takes
      onImport(newTakes);
      setTranscriptionStage('completed');

      toast({
        title: 'ASR Transcription Complete',
        description: `Successfully generated ${newTakes.length} takes. Detected language: ${result.detectedLanguage}`,
      });
    } catch (error) {
      console.error('ASR transcription failed:', error);
      toast({
        title: 'Transcription Failed',
        description: error instanceof Error ? error.message : 'Could not transcribe video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
      setTranscriptionStage(null);
    }
  };

  const handleJsonImport = () => {
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
        throw new Error('Invalid JSON structure. Expected an array of takes.');
      }
      onImport(takesToImport);
      toast({
        title: 'Import Successful',
        description: `${takesToImport.length} takes have been loaded from JSON.`,
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
  
  const handleScriptImport = (scriptText: string) => {
    if (!scriptText.trim()) {
      toast({
        title: 'Import Error',
        description: 'Script is empty. Please paste your script text.',
        variant: 'destructive',
      });
      return;
    }
    try {
      // Split script by paragraphs (one or more empty lines)
      const paragraphs = scriptText.split(/\n\s*\n/).filter(p => p.trim() !== '');
      let lastEndTime = 0;

      const newTakes: Take[] = paragraphs.map((p, index) => {
        const text = p.trim();
        const wordCount = text.split(/\s+/).length;
        const estimatedDuration = Math.max(2, wordCount / 2.5); // Estimate 2.5 words per second, min 2s
        
        const startTime = lastEndTime;
        const endTime = startTime + estimatedDuration;
        lastEndTime = endTime;

        const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
          const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
          const ms = Math.round((seconds % 1) * 1000).toString().padStart(3, '0');
          return `${mins}:${secs}.${ms}`;
        }
        
        return {
          id: uuidv4(),
          character: `Speaker ${ (index % 2) + 1}`,
          original: text,
          translation: '',
          notes: '',
          status: 'Pending',
          startSeconds: startTime,
          endSeconds: endTime,
          time: `${formatTime(startTime)} --> ${formatTime(endTime)}`,
        };
      });

      if (newTakes.length === 0) {
          throw new Error('No paragraphs found in the script.');
      }
      
      onImport(newTakes);
      toast({
        title: 'Script Import Successful',
        description: `${newTakes.length} takes have been created from your script.`,
      });
      setImportScript('');

    } catch (error) {
      toast({
        title: 'Script Import Failed',
        description: 'Could not process the script.',
        variant: 'destructive',
      });
      console.error(error);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      if (file.name.endsWith('.docx')) {
        reader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(result => {
                    handleScriptImport(result.value);
                })
                .catch(err => {
                    toast({
                        title: 'DOCX Import Failed',
                        description: 'Could not extract text from the .docx file.',
                        variant: 'destructive'
                    });
                    console.error(err);
                });
        };
        reader.readAsArrayBuffer(file);

      } else { // Assume .txt or other plain text
        reader.onload = (e) => {
            const text = e.target?.result as string;
            handleScriptImport(text);
        };
        reader.readAsText(file);
      }
    }
    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
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
          .join('\n\n');
      case 'json':
      default:
        return JSON.stringify({ takes }, null, 2);
    }
  }, [takes, exportFormat]);

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(exportData)
      .then(() => {
        toast({ title: 'Copied to clipboard!' });
      })
      .catch(err => {
        toast({ title: 'Failed to copy', variant: 'destructive' });
      });
  };

  const handleDownload = () => {
    const baseName = projectName ? projectName.trim() : 'untitled-project';
    const sanitizedBase = baseName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    const fileName = `${sanitizedBase || 'project'}.${exportFormat}`;

    let mimeType = 'text/plain;charset=utf-8';
    if (exportFormat === 'json') {
      mimeType = 'application/json;charset=utf-8';
    }

    const blob = new Blob([exportData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download Started',
      description: `Saving ${fileName}...`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Import your script or export your work.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">
              <HardDriveUpload className="mr-2 h-4 w-4" /> Import
            </TabsTrigger>
            <TabsTrigger value="export">
              <HardDriveDownload className="mr-2 h-4 w-4" /> Export
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="mt-4">
             <Tabs defaultValue="script">
                  <TabsList className="grid w-full grid-cols-3">
                     <TabsTrigger value="script">
                         <FileText className="mr-2 h-4 w-4" /> From Script
                     </TabsTrigger>
                     <TabsTrigger value="json">From JSON</TabsTrigger>
                     <TabsTrigger value="asr">
                         <Sparkles className="mr-2 h-4 w-4" /> AI Transcribe
                     </TabsTrigger>
                  </TabsList>
                  <TabsContent value="script" className="mt-4 space-y-4">
                     <p className="text-sm text-muted-foreground">
                         Upload a .txt or .docx file, or paste your script below. Paragraphs will be treated as separate takes.
                     </p>
                     <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                         <UploadCloud className="mr-2 h-4 w-4" />
                         Upload .txt or .docx file
                     </Button>
                     <Textarea
                         value={importScript}
                         onChange={e => setImportScript(e.target.value)}
                         className="h-32 font-mono text-xs"
                         placeholder='Or paste your plain text script here...'
                     />
                     <Button onClick={() => handleScriptImport(importScript)} disabled={!importScript}>Import from Text</Button>
                      <Input
                         ref={fileInputRef}
                         type="file"
                         className="hidden"
                         accept=".txt,.docx"
                         onChange={handleFileChange}
                       />
                  </TabsContent>
                  <TabsContent value="json" className="mt-4 space-y-4">
                      <p className="text-sm text-muted-foreground">
                         For advanced users restoring a project from a previous export.
                      </p>
                      <Textarea
                         value={importJson}
                         onChange={e => setImportJson(e.target.value)}
                         className="h-48 font-mono text-xs"
                         placeholder='Paste your JSON data here...'
                       />
                       <Button onClick={handleJsonImport}>Load Project from JSON</Button>
                  </TabsContent>
                  <TabsContent value="asr" className="mt-4 space-y-4">
                      <p className="text-sm text-muted-foreground">
                         Extract the audio track from the loaded video and automatically generate timestamped, speaker-separated Takes in the source language using Gemini 2.5 Flash.
                      </p>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Spoken Audio Language</label>
                        <Select
                          value={selectedAsrLang}
                          onValueChange={setSelectedAsrLang}
                          disabled={isTranscribing}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select audio language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Auto-Detect">Auto-Detect Language (AI)</SelectItem>
                            {SUPPORTED_LANGUAGES.map(lang => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {!hasApiKey ? (
                        <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex flex-col gap-1.5">
                          <p className="font-semibold flex items-center gap-1.5 text-[13px] text-amber-400">
                            <AlertTriangle className="h-4 w-4" />
                            Missing Gemini API Key
                          </p>
                          <p className="leading-relaxed text-muted-foreground">
                            To use AI transcription and translation, please configure your Gemini API key in the <strong>Settings</strong> tab.
                          </p>
                        </div>
                      ) : !videoFile ? (
                        <p className="text-xs text-amber-500 font-medium">
                          ⚠️ Please load a video file in the Video Player to start transcription.
                        </p>
                      ) : null}
                      
                      {isTranscribing && transcriptionStage && STAGE_DETAILS[transcriptionStage] && (
                        <div className="flex flex-col gap-1.5 p-3.5 rounded-lg border border-border/50 bg-secondary/30 text-xs select-none">
                          <div className="flex items-center gap-2 font-bold text-foreground">
                            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                            <span>{STAGE_DETAILS[transcriptionStage].title}</span>
                          </div>
                          <p className="text-muted-foreground pl-6 leading-relaxed">
                            {STAGE_DETAILS[transcriptionStage].desc}
                          </p>
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleAsrTranscription} 
                        disabled={!videoFile || isTranscribing || !hasApiKey}
                        className="w-full"
                      >
                        {isTranscribing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            AI Transcribing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Transcribe Video Audio
                          </>
                        )}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        Note: Processing may take 30-60 seconds. Video length is limited to 15 minutes.
                      </p>
                  </TabsContent>
              </Tabs>
          </TabsContent>

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
                    <SelectItem value="json">Project (JSON)</SelectItem>
                    <SelectItem value="srt">Subtitles (SRT)</SelectItem>
                    <SelectItem value="vtt">Subtitles (VTT)</SelectItem>
                    <SelectItem value="txt">Script (Text)</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCopyToClipboard}>Copy to Clipboard</Button>
                <Button onClick={handleDownload} variant="outline">Download</Button>
              </div>
              <Textarea
                readOnly
                value={exportData}
                className="h-48 font-mono text-xs"
                placeholder="Exported data will appear here."
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImportExportPanel;
