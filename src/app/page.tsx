"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { ProjectSettings, Take, GlossaryEntry } from '@/lib/types';
import { DEFAULT_PROJECT_SETTINGS } from '@/lib/data';
import Header from '@/components/Header';
import ProjectSettingsComponent from '@/components/ProjectSettings';
import VideoPlayer from '@/components/VideoPlayer';
import ImportExportPanel from '@/components/ImportExportPanel';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import GlossaryPanel from '@/components/GlossaryPanel';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';
import TakesList from '@/components/TakesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Settings, BookMarked, GripHorizontal } from 'lucide-react';
import Timeline from '@/components/Timeline';
import {
  exportToExcel,
  exportToCSV,
  exportToWordSource,
  exportToWordTarget,
  exportToWordBoth,
} from '@/lib/export-utils';
import { formatTimeForDisplay } from '@/lib/utils';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

const normalizeStatus = (status: string | undefined): 'Pending' | 'Reviewed' | 'Locked' => {
  if (status === 'Approved') return 'Reviewed';
  if (status === 'Translated' || status === 'In Progress') return 'Pending';
  if (status === 'Pending' || status === 'Reviewed' || status === 'Locked') return status;
  return 'Pending';
};

export default function DubbingStudioPro() {
  const db = useFirestore();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ProjectSettings>(
    DEFAULT_PROJECT_SETTINGS
  );
  const [takes, setTakes] = useState<Take[]>([]);
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoReloadHint, setVideoReloadHint] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('takes');

  const videoRef = useRef<HTMLVideoElement>(null);
  const projectId = 'main-project'; // Using a static project ID for now

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect for loading data from Firestore
  useEffect(() => {
    if (!db || !isClient) return;

    const projectDocRef = doc(db, 'projects', projectId);
    const takesColRef = collection(db, 'projects', projectId, 'takes');
    const glossaryColRef = collection(db, 'projects', projectId, 'glossary');

    // Load project settings
    getDoc(projectDocRef).then(docSnap => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as ProjectSettings);
      } else {
        setDoc(projectDocRef, DEFAULT_PROJECT_SETTINGS);
      }
    });

    // Subscribe to takes
    const unsubscribeTakes = onSnapshot(takesColRef, snapshot => {
      const serverTakes = snapshot.docs
        .map(d => {
          const data = d.data();
          return {
            ...(data as Take),
            id: d.id,
            status: normalizeStatus((data as any).status),
          };
        })
        .sort((a, b) => a.startSeconds - b.startSeconds);
      setTakes(serverTakes);
    });

    // Subscribe to glossary
    const unsubscribeGlossary = onSnapshot(glossaryColRef, snapshot => {
      const serverGlossary = snapshot.docs.map(d => ({
        ...(d.data() as Omit<GlossaryEntry, 'id'>),
        id: d.id,
      }));
      setGlossary(serverGlossary);
    });

    return () => {
      unsubscribeTakes();
      unsubscribeGlossary();
    };
  }, [db, isClient]);

  const saveToCloud = useCallback(async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      const projectDocRef = doc(db, 'projects', projectId);
      await setDoc(projectDocRef, settings);

      setLastSaved(new Date());
      toast({
        title: 'Project Saved',
        description: 'Your project settings have been saved.',
      });
    } catch (error) {
      console.error('Failed to save data', error);
      toast({
        title: 'Save Failed',
        description: 'There was an error saving your project.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [db, settings, toast]);

  const handleSettingsChange = (newSettings: ProjectSettings) => {
    setSettings(newSettings);
    // Persist immediately
    if (db) {
      setDoc(doc(db, 'projects', projectId), newSettings);
    }
  };

  const handleTakesChange = async (newTakes: Take[]) => {
    if (!db) return;
    
    const newTakesWithIds = newTakes.map(t => ({
      ...t,
      id: t.id || uuidv4(),
      status: normalizeStatus((t as any).status),
    }));
    setTakes(newTakesWithIds);

    const batch = writeBatch(db);
    const takesColRef = collection(db, 'projects', projectId, 'takes');

    
    // Delete takes that are no longer present
    takes.forEach(take => {
        if(!newTakes.find(nt => nt.id === take.id)) {
            batch.delete(doc(takesColRef, take.id));
        }
    });

    // Add or update takes
    newTakesWithIds.forEach(take => {
      const takeRef = doc(takesColRef, take.id);
      batch.set(takeRef, take);
    });
    
    await batch.commit();

    if (currentIndex >= newTakesWithIds.length) {
      setCurrentIndex(Math.max(0, newTakesWithIds.length - 1));
    }
  };

  const handleTakeUpdate = (updatedTake: Take) => {
    if (db) {
      const takeRef = doc(db, 'projects', projectId, 'takes', updatedTake.id);
      setDoc(takeRef, updatedTake, { merge: true });
    }
  };

  const handleTimelineTakeClick = (index: number) => {
    setCurrentIndex(index);
    setActiveTab('takes');
  };

  const handleTimelineTakeDoubleClick = (index: number) => {
    setCurrentIndex(index);
    setActiveTab('takes');
    const take = takes[index];
    if (take && videoRef.current) {
      videoRef.current.currentTime = take.startSeconds;
      videoRef.current.play().catch(err => console.error("Auto-play failed:", err));
    }
  };

  const handleVideoFileChange = (file: File) => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoReloadHint(null);
  };
  
  const handleGlossaryChange = async (newGlossary: GlossaryEntry[]) => {
     if (!db) return;
     const batch = writeBatch(db);
     const glossaryColRef = collection(db, 'projects', projectId, 'glossary');
     
     const currentIds = new Set(newGlossary.map(e => e.id));
     const oldIds = new Set(glossary.map(e => e.id));

     oldIds.forEach(id => {
       if (!currentIds.has(id)) {
         batch.delete(doc(glossaryColRef, id));
       }
     });

     newGlossary.forEach(entry => {
       const entryRef = doc(glossaryColRef, entry.id);
       batch.set(entryRef, {
           sourceTerm: entry.sourceTerm,
           targetTerm: entry.targetTerm,
           notes: entry.notes
       });
     });

     await batch.commit();
     setGlossary(newGlossary);
  };

  const handleNewProject = async () => {
    setTakes([]);
    setGlossary([]);
    setSettings(DEFAULT_PROJECT_SETTINGS);
    setCurrentIndex(0);
    setVideoFile(null);
    setVideoUrl(null);
    setVideoDuration(0);
    setCurrentTime(0);
    setVideoReloadHint(null);

    if (db) {
      const batch = writeBatch(db);
      const projectDocRef = doc(db, 'projects', projectId);
      batch.set(projectDocRef, DEFAULT_PROJECT_SETTINGS);

      const takesColRef = collection(db, 'projects', projectId, 'takes');
      takes.forEach(t => {
        batch.delete(doc(takesColRef, t.id));
      });

      const glossaryColRef = collection(db, 'projects', projectId, 'glossary');
      glossary.forEach(g => {
        batch.delete(doc(glossaryColRef, g.id));
      });

      await batch.commit();
    }

    toast({
      title: 'New Project Created',
      description: 'Workspace has been reset.',
    });
  };

  const handleOpenProject = async (projectData: any) => {
    try {
      // 1. Restore settings with backwards compatibility
      const loadedSettings: ProjectSettings = {
        projectName: projectData.projectName || projectData.settings?.projectName || projectData.title || projectData.settings?.title || 'Untitled Project',
        sourceLang: projectData.settings?.sourceLang || projectData.sourceLang || 'EN',
        targetLang: projectData.settings?.targetLang || projectData.targetLang || 'ES',
        translator: projectData.settings?.translator || projectData.translator || '',
      };
      loadedSettings.title = loadedSettings.projectName;

      // 2. Restore takes with standard defaults
      const loadedTakes: Take[] = (projectData.takes || []).map((t: any) => ({
        id: t.id || uuidv4(),
        character: t.character || 'Speaker',
        time: t.time || '00:00.000 - 00:00.000',
        startSeconds: Number(t.startSeconds) || 0,
        endSeconds: Number(t.endSeconds) || 0,
        original: t.original || '',
        translation: t.translation || '',
        notes: t.notes || '',
        status: normalizeStatus(t.status)
      }));

      // 3. Restore glossary
      const loadedGlossary: GlossaryEntry[] = (projectData.glossary || []).map((g: any) => ({
        id: g.id || uuidv4(),
        sourceTerm: g.sourceTerm || '',
        targetTerm: g.targetTerm || '',
        notes: g.notes || ''
      }));

      // 4. Update local state
      setSettings(loadedSettings);
      setTakes(loadedTakes);
      setGlossary(loadedGlossary);
      setCurrentIndex(0);

      // 5. Update Firestore
      if (db) {
        const batch = writeBatch(db);
        const projectDocRef = doc(db, 'projects', projectId);
        batch.set(projectDocRef, loadedSettings);

        const takesColRef = collection(db, 'projects', projectId, 'takes');
        // Delete old takes
        takes.forEach(t => {
          batch.delete(doc(takesColRef, t.id));
        });
        // Set new takes
        loadedTakes.forEach(t => {
          batch.set(doc(takesColRef, t.id), t);
        });

        const glossaryColRef = collection(db, 'projects', projectId, 'glossary');
        // Delete old glossary
        glossary.forEach(g => {
          batch.delete(doc(glossaryColRef, g.id));
        });
        // Set new glossary
        loadedGlossary.forEach(g => {
          batch.set(doc(glossaryColRef, g.id), g);
        });

        await batch.commit();
      }

      // 6. Handle video filename reference check
      const fileVideoName = projectData.videoFileName || null;
      if (fileVideoName) {
        if (!videoFile || videoFile.name !== fileVideoName) {
          setVideoReloadHint(fileVideoName);
          toast({
            title: 'Video File Required',
            description: `⚠️ Please reload video file: ${fileVideoName}`,
            duration: 8000,
          });
        } else {
          setVideoReloadHint(null);
        }
      } else {
        setVideoReloadHint(null);
      }

      toast({
        title: 'Project Opened Successfully',
        description: `Restored project: "${loadedSettings.projectName}"`,
      });
    } catch (error) {
      console.error('Failed to open project file', error);
      toast({
        title: 'Open Project Failed',
        description: 'Invalid or corrupt project file format.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProject = () => {
    const pName = settings.projectName || settings.title || 'Untitled Project';
    const projectData = {
      formatVersion: '1.2',
      createdAt: new Date().toISOString(),
      projectName: pName,
      videoFileName: videoFile ? videoFile.name : null,
      settings,
      takes,
      glossary,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${pName}.dubbiovi`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Project Saved',
      description: `Successfully exported "${pName}.dubbiovi"`,
    });
  };

  const handleSaveProjectAs = () => {
    const currentName = settings.projectName || settings.title || 'Untitled Project';
    const newName = window.prompt('Enter new project name:', currentName);
    if (newName === null) return;
    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast({
        title: 'Invalid Name',
        description: 'Project name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    const updatedSettings = {
      ...settings,
      projectName: trimmedName,
      title: trimmedName,
    };
    setSettings(updatedSettings);

    if (db) {
      setDoc(doc(db, 'projects', projectId), updatedSettings);
    }

    const projectData = {
      formatVersion: '1.2',
      createdAt: new Date().toISOString(),
      projectName: trimmedName,
      videoFileName: videoFile ? videoFile.name : null,
      settings: updatedSettings,
      takes,
      glossary,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${trimmedName}.dubbiovi`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Project Saved As',
      description: `Successfully exported "${trimmedName}.dubbiovi"`,
    });
  };

  const handleExportExcel = () => {
    const name = settings.projectName || settings.title || 'Project';
    exportToExcel(takes, name);
    toast({
      title: 'Excel Export Complete',
      description: `Downloaded "${name}.xlsx"`,
    });
  };

  const handleExportCSV = () => {
    const name = settings.projectName || settings.title || 'Project';
    exportToCSV(takes, name);
    toast({
      title: 'CSV Export Complete',
      description: `Downloaded "${name}.csv"`,
    });
  };

  const handleExportWordSource = () => {
    const name = settings.projectName || settings.title || 'Project';
    exportToWordSource(takes, name, settings.sourceLang, settings.targetLang);
    toast({
      title: 'Word Export Complete',
      description: `Downloaded "${name}_Source.docx"`,
    });
  };

  const handleExportWordTarget = () => {
    const name = settings.projectName || settings.title || 'Project';
    exportToWordTarget(takes, name, settings.sourceLang, settings.targetLang);
    toast({
      title: 'Word Export Complete',
      description: `Downloaded "${name}_Target.docx"`,
    });
  };

  const handleExportWordBoth = () => {
    const name = settings.projectName || settings.title || 'Project';
    exportToWordBoth(takes, name, settings.sourceLang, settings.targetLang);
    toast({
      title: 'Word Export Complete',
      description: `Downloaded "${name}_Both.docx"`,
    });
  };

  const handleTakeMerge = async (index: number, direction: 'prev' | 'next') => {
    if (!db) return;

    const targetIndex = direction === 'prev' ? index - 1 : index;
    const nextIndex = targetIndex + 1;

    if (targetIndex < 0 || nextIndex >= takes.length) return;

    const t1 = takes[targetIndex];
    const t2 = takes[nextIndex];

    if (t1.status === 'Locked' || t2.status === 'Locked') {
      toast({
        title: 'Merge Denied',
        description: 'Cannot merge locked takes. Please unlock first.',
        variant: 'destructive',
      });
      return;
    }

    const startSeconds = t1.startSeconds;
    const endSeconds = t2.endSeconds;
    const original = [t1.original, t2.original].filter(Boolean).join('\n');
    const translation = [t1.translation, t2.translation].filter(Boolean).join('\n');
    const character = t1.character === t2.character ? t1.character : `${t1.character} / ${t2.character}`;

    let status: 'Pending' | 'Reviewed' | 'Locked' = 'Pending';
    if ((t1.status as string) === 'Locked' && (t2.status as string) === 'Locked') {
      status = 'Locked';
    } else if (t1.status === 'Reviewed' && t2.status === 'Reviewed') {
      status = 'Reviewed';
    }

    const time = `${formatTimeForDisplay(startSeconds)} - ${formatTimeForDisplay(endSeconds)}`;

    const mergedTake: Take = {
      id: t1.id,
      character,
      time,
      startSeconds,
      endSeconds,
      original,
      translation,
      notes: [t1.notes, t2.notes].filter(Boolean).join('\n'),
      status,
    };

    const newTakes = [...takes];
    newTakes.splice(nextIndex, 1);
    newTakes[targetIndex] = mergedTake;

    setTakes(newTakes);
    setCurrentIndex(Math.max(0, targetIndex));

    try {
      const batch = writeBatch(db);
      const takesColRef = collection(db, 'projects', projectId, 'takes');

      batch.set(doc(takesColRef, t1.id), mergedTake);
      batch.delete(doc(takesColRef, t2.id));

      await batch.commit();

      toast({
        title: 'Takes Merged',
        description: `Merged Take ${targetIndex + 1} and Take ${nextIndex + 1}.`,
      });
    } catch (error) {
      console.error('Failed to merge takes in Firestore', error);
      toast({
        title: 'Database Sync Failed',
        description: 'Merged locally but failed to save in database.',
        variant: 'destructive',
      });
    }
  };

  const handleTakeSplit = async (
    index: number,
    source1: string,
    source2: string,
    target1: string,
    target2: string
  ) => {
    if (!db) return;

    const t = takes[index];
    if (!t) return;

    if (t.status === 'Locked') {
      toast({
        title: 'Split Denied',
        description: 'Cannot split a locked take. Please unlock first.',
        variant: 'destructive',
      });
      return;
    }

    const l1 = source1.length;
    const l2 = source2.length;
    let ratio = 0.5;
    if (l1 + l2 > 0) {
      ratio = l1 / (l1 + l2);
    } else {
      const tl1 = target1.length;
      const tl2 = target2.length;
      if (tl1 + tl2 > 0) {
        ratio = tl1 / (tl1 + tl2);
      }
    }

    const splitSeconds = t.startSeconds + ratio * (t.endSeconds - t.startSeconds);

    const take1: Take = {
      id: t.id,
      character: t.character,
      time: `${formatTimeForDisplay(t.startSeconds)} - ${formatTimeForDisplay(splitSeconds)}`,
      startSeconds: t.startSeconds,
      endSeconds: splitSeconds,
      original: source1,
      translation: target1,
      notes: t.notes,
      status: 'Pending',
    };

    const take2Id = uuidv4();
    const take2: Take = {
      id: take2Id,
      character: t.character,
      time: `${formatTimeForDisplay(splitSeconds)} - ${formatTimeForDisplay(t.endSeconds)}`,
      startSeconds: splitSeconds,
      endSeconds: t.endSeconds,
      original: source2,
      translation: target2,
      notes: '',
      status: 'Pending',
    };

    const newTakes = [...takes];
    newTakes[index] = take1;
    newTakes.splice(index + 1, 0, take2);

    setTakes(newTakes);

    try {
      const batch = writeBatch(db);
      const takesColRef = collection(db, 'projects', projectId, 'takes');

      batch.set(doc(takesColRef, t.id), take1);
      batch.set(doc(takesColRef, take2Id), take2);

      await batch.commit();

      toast({
        title: 'Take Split',
        description: `Split Take ${index + 1} into two takes.`,
      });
    } catch (error) {
      console.error('Failed to split take in Firestore', error);
      toast({
        title: 'Database Sync Failed',
        description: 'Split locally but failed to save in database.',
        variant: 'destructive',
      });
    }
  };

  const handleTakeSkip = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (videoRef.current && takes[prevIdx]) {
        videoRef.current.currentTime = takes[prevIdx].startSeconds;
      }
    } else if (direction === 'next' && currentIndex < takes.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (videoRef.current && takes[nextIdx]) {
        videoRef.current.currentTime = takes[nextIdx].startSeconds;
      }
    }
  };
  
  const handleTakeDelete = async (id: string) => {
    if (!db) return;
    const takeRef = doc(db, 'projects', projectId, 'takes', id);
    await deleteDoc(takeRef);
  };

  const videoPlaceholder = PlaceHolderImages.find(
    p => p.id === 'video-placeholder'
  );

  return (
    <div className="flex h-screen w-full flex-col dark bg-background">
      <Header
        projectName={settings.projectName || settings.title || 'Untitled Project'}
        onSave={saveToCloud}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onSaveProjectAs={handleSaveProjectAs}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
        onExportWordSource={handleExportWordSource}
        onExportWordTarget={handleExportWordTarget}
        onExportWordBoth={handleExportWordBoth}
      />
      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <PanelGroup direction="vertical" className="flex-grow">
          <Panel defaultSize={70}>
            <PanelGroup direction="horizontal">
              <Panel defaultSize={50} minSize={30}>
                 <div className="flex flex-col gap-4 h-full overflow-hidden pr-2">
                    {videoReloadHint && (
                      <div className="bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs px-3 py-2 rounded-md flex items-center gap-2 mb-2 animate-pulse shrink-0">
                        <span>⚠️ Please reload video file: <strong>{videoReloadHint}</strong></span>
                      </div>
                    )}
                    <VideoPlayer
                        videoRef={videoRef}
                        videoUrl={videoUrl}
                        posterUrl={videoPlaceholder?.imageUrl}
                        posterHint={videoPlaceholder?.imageHint}
                        onFileChange={handleVideoFileChange}
                        onTimeUpdate={setCurrentTime}
                        onDurationChange={setVideoDuration}
                        currentTime={currentTime}
                        videoDuration={videoDuration}
                        onPrevTake={() => handleTakeSkip('prev')}
                        onNextTake={() => handleTakeSkip('next')}
                        hasPrevTake={currentIndex > 0}
                        hasNextTake={currentIndex < takes.length - 1}
                        currentTake={takes[currentIndex]}
                    />
                 </div>
              </Panel>
              <PanelResizeHandle className="w-4 flex items-center justify-center">
                <GripHorizontal className="h-4 w-4 text-muted-foreground" />
              </PanelResizeHandle>
              <Panel defaultSize={50} minSize={30}>
                <div className="h-full overflow-hidden pl-2 flex flex-col gap-4">
                  <Card className="flex-grow h-full flex flex-col min-h-0">
                      <CardContent className="p-0 flex-grow min-h-0 flex flex-col">
                          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col min-h-0">
                          <TabsList className="m-2 shrink-0">
                              <TabsTrigger value="takes"><FileText className="mr-2 h-4 w-4" /> Takes</TabsTrigger>
                              <TabsTrigger value="import"><FileText className="mr-2 h-4 w-4" /> Import/Export</TabsTrigger>
                              <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4"/> Settings</TabsTrigger>
                              <TabsTrigger value="glossary"><BookMarked className="mr-2 h-4 w-4"/> Glossary</TabsTrigger>
                          </TabsList>
                          <TabsContent value="takes" className="flex-grow overflow-hidden min-h-0 flex flex-col">
                              <TakesList
                                  takes={takes}
                                  onTakeUpdate={handleTakeUpdate}
                                  onTakeDelete={handleTakeDelete}
                                  glossary={glossary}
                                  settings={settings}
                                  videoRef={videoRef}
                                  currentTime={currentTime}
                                  selectedTakeIndex={currentIndex}
                                  onTakeSelect={(index) => {
                                      setCurrentIndex(index);
                                      if (videoRef.current) {
                                          videoRef.current.currentTime = takes[index]?.startSeconds ?? 0;
                                      }
                                  }}
                                  onTakeMerge={handleTakeMerge}
                                  onTakeSplit={handleTakeSplit}
                               />
                          </TabsContent>
                          <TabsContent value="import" className="flex-grow overflow-y-auto min-h-0 px-4">
                              <ImportExportPanel 
                                takes={takes} 
                                onImport={handleTakesChange} 
                                videoFile={videoFile}
                                defaultSourceLang={settings.sourceLang}
                              />
                          </TabsContent>
                          <TabsContent value="settings" className="flex-grow overflow-y-auto min-h-0 px-4">
                              <ProjectSettingsComponent
                              settings={settings}
                              onSettingsChange={handleSettingsChange}
                              />
                          </TabsContent>
                          <TabsContent value="glossary" className="flex-grow overflow-y-auto min-h-0 px-4">
                              <GlossaryPanel glossary={glossary} onGlossaryChange={handleGlossaryChange} />
                          </TabsContent>
                          </Tabs>
                      </CardContent>
                  </Card>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="h-4 flex items-center justify-center">
             <GripHorizontal className="h-4 w-4 text-muted-foreground rotate-90" />
          </PanelResizeHandle>
          <Panel defaultSize={30} minSize={20} className="pt-2">
            <Timeline
                takes={takes}
                duration={videoDuration}
                currentTime={currentTime}
                currentIndex={currentIndex}
                onTakeClick={handleTimelineTakeClick}
                onTakeDoubleClick={handleTimelineTakeDoubleClick}
                onTimebarClick={time =>
                  videoRef.current && (videoRef.current.currentTime = time)
                }
            />
          </Panel>
        </PanelGroup>
      </main>
      <footer className="w-full py-2 text-center text-[10px] text-muted-foreground border-t bg-card/20 shrink-0">
        Copyright Alfonso C. Rodríguez Fernández-Peña 2026
      </footer>
    </div>
  );
}
