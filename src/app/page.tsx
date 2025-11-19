"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  writeBatch,
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
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

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
        .map(d => ({ ...(d.data() as Take), id: d.id }))
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
    
    const newTakesWithIds = newTakes.map(t => ({ ...t, id: t.id || uuidv4() }));
    setTakes(newTakesWithIds);

    const batch = writeBatch(db);
    const takesColRef = collection(db, 'projects', projectId, 'takes');

    // Efficiently sync takes
    const existingTakesSnapshot = await getDoc(collection(db, 'projects', projectId, 'takes') as any);
    const existingIds = new Set(takes.map(t => t.id));
    
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

  const handleVideoFileChange = (file: File) => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
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
        projectTitle={settings.title}
        onSave={saveToCloud}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />
      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <PanelGroup direction="vertical" className="flex-grow">
          <Panel defaultSize={70}>
            <PanelGroup direction="horizontal">
              <Panel defaultSize={50} minSize={30}>
                 <div className="flex flex-col gap-4 h-full overflow-hidden pr-2">
                    <VideoPlayer
                        videoRef={videoRef}
                        videoUrl={videoUrl}
                        posterUrl={videoPlaceholder?.imageUrl}
                        posterHint={videoPlaceholder?.imageHint}
                        onFileChange={handleVideoFileChange}
                        onTimeUpdate={setCurrentTime}
                        onDurationChange={setVideoDuration}
                    />
                 </div>
              </Panel>
              <PanelResizeHandle className="w-4 flex items-center justify-center">
                <GripHorizontal className="h-4 w-4 text-muted-foreground" />
              </PanelResizeHandle>
              <Panel defaultSize={50} minSize={30}>
                <div className="h-full overflow-hidden pl-2 flex flex-col gap-4">
                  <Card className="flex-grow h-full flex flex-col">
                      <CardContent className="p-0 flex-grow">
                          <Tabs defaultValue="takes" className="h-full flex flex-col">
                          <TabsList className="m-2">
                              <TabsTrigger value="takes"><FileText className="mr-2 h-4 w-4" /> Takes</TabsTrigger>
                              <TabsTrigger value="import"><FileText className="mr-2 h-4 w-4" /> Import/Export</TabsTrigger>
                              <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4"/> Settings</TabsTrigger>
                              <TabsTrigger value="glossary"><BookMarked className="mr-2 h-4 w-4"/> Glossary</TabsTrigger>
                          </TabsList>
                          <TabsContent value="takes" className="flex-grow overflow-hidden">
                              <TakesList
                                  takes={takes}
                                  onTakeUpdate={handleTakeUpdate}
                                  onTakeDelete={handleTakeDelete}
                                  glossary={glossary}
                                  settings={settings}
                                  videoRef={videoRef}
                                  currentTime={currentTime}
                                  onTakeSelect={(index) => {
                                      setCurrentIndex(index);
                                      if (videoRef.current) {
                                          videoRef.current.currentTime = takes[index]?.startSeconds ?? 0;
                                      }
                                  }}
                               />
                          </TabsContent>
                          <TabsContent value="import" className="flex-grow overflow-y-auto px-4">
                              <ImportExportPanel takes={takes} onImport={handleTakesChange} />
                          </TabsContent>
                          <TabsContent value="settings" className="flex-grow overflow-y-auto px-4">
                              <ProjectSettingsComponent
                              settings={settings}
                              onSettingsChange={handleSettingsChange}
                              />
                          </TabsContent>
                          <TabsContent value="glossary" className="flex-grow overflow-y-auto px-4">
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
                onTakeClick={setCurrentIndex}
                onTimebarClick={time =>
                  videoRef.current && (videoRef.current.currentTime = time)
                }
            />
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}
