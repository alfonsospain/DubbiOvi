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
import { DEFAULT_PROJECT_SETTINGS, DEFAULT_TAKES } from '@/lib/data';
import Header from '@/components/Header';
import ProjectSettingsComponent from '@/components/ProjectSettings';
import VideoPlayer from '@/components/VideoPlayer';
import TranslationPanel from '@/components/TranslationPanel';
import ImportExportPanel from '@/components/ImportExportPanel';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import GlossaryPanel from '@/components/GlossaryPanel';
import { getTranslationSuggestion } from '@/ai/ai-translation-suggestions';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function DubbingStudioPro() {
  const db = useFirestore();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ProjectSettings>(
    DEFAULT_PROJECT_SETTINGS
  );
  const [takes, setTakes] = useState<Take[]>(DEFAULT_TAKES);
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
        // If no settings, save the default ones
        setDoc(projectDocRef, DEFAULT_PROJECT_SETTINGS);
      }
    });

    // Subscribe to takes
    const unsubscribeTakes = onSnapshot(takesColRef, snapshot => {
      if (snapshot.empty) {
        setTakes(DEFAULT_TAKES);
        return;
      }
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
      const batch = writeBatch(db);

      // Save settings
      const projectDocRef = doc(db, 'projects', projectId);
      batch.set(projectDocRef, settings);

      await batch.commit();

      setLastSaved(new Date());
      toast({
        title: 'Project Saved',
        description: 'Your project has been successfully saved to the cloud.',
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
    
    const newTakesWithIds = newTakes.map(t => ({...t, id: t.id || uuidv4()}));

    const batch = writeBatch(db);
    const takesColRef = collection(db, 'projects', projectId, 'takes');
    
    newTakesWithIds.forEach(take => {
        const takeRef = doc(takesColRef, take.id);
        batch.set(takeRef, take);
    });
    await batch.commit();

    setTakes(newTakesWithIds);
    if (currentIndex >= newTakesWithIds.length) {
      setCurrentIndex(Math.max(0, newTakesWithIds.length - 1));
    }
  };

  const handleCurrentTakeChange = (updatedTake: Take) => {
    // Optimistic update
    const newTakes = takes.map(take =>
      take.id === updatedTake.id ? updatedTake : take
    );
    setTakes(newTakes);
    
    // Persist change to DB
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

     // Delete removed entries
     oldIds.forEach(id => {
       if (!currentIds.has(id)) {
         batch.delete(doc(glossaryColRef, id));
       }
     });

     // Add/update entries
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

  const suggestTranslation = async (take: Take) => {
    try {
      const result = await getTranslationSuggestion({
        originalText: take.original,
        sourceLanguage: settings.sourceLang,
        targetLanguage: settings.targetLang,
        glossary,
      });

      if (result.translation) {
        const updatedTake = {
          ...take,
          translation: result.translation,
          status: 'Translated' as const,
        };
        handleCurrentTakeChange(updatedTake);
        toast({
          title: 'Translation Suggested',
          description: 'An AI-powered suggestion has been generated.',
        });
      } else {
        throw new Error('No translation returned.');
      }
    } catch (error) {
      console.error('Translation suggestion failed', error);
      toast({
        title: 'Translation Failed',
        description:
          'Could not get a translation suggestion. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const currentTake = takes[currentIndex];
  const videoPlaceholder = PlaceHolderImages.find(
    p => p.id === 'video-placeholder'
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header
        projectTitle={settings.title}
        onSave={saveToCloud}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8 grid gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid gap-8">
            <VideoPlayer
              videoRef={videoRef}
              videoUrl={videoUrl}
              posterUrl={videoPlaceholder?.imageUrl}
              posterHint={videoPlaceholder?.imageHint}
              onFileChange={handleVideoFileChange}
              takes={takes}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setVideoDuration}
              videoDuration={videoDuration}
              currentTime={currentTime}
            />
          </div>
          <div className="row-start-3 lg:row-start-auto lg:col-span-1">
            <ImportExportPanel takes={takes} onImport={handleTakesChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
            {currentTake ? (
              <TranslationPanel
                currentTake={currentTake}
                currentIndex={currentIndex}
                totalTakes={takes.length}
                onTakeChange={handleCurrentTakeChange}
                onSuggestTranslation={suggestTranslation}
                onPrevious={() => setCurrentIndex(i => Math.max(0, i - 1))}
                onNext={() =>
                  setCurrentIndex(i => Math.min(takes.length - 1, i + 1))
                }
                videoRef={videoRef}
                settings={settings}
              />
            ) : (
               <Card>
                <CardHeader>
                  <CardTitle>No Takes</CardTitle>
                  <CardDescription>Import a script to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Use the Data Management panel to import a script file in JSON format.</p>
                </CardContent>
               </Card>
            )}
          </div>
          <div className="lg:col-span-1">
            <ProjectSettingsComponent
                settings={settings}
                onSettingsChange={handleSettingsChange}
            />
          </div>
        </div>
        <GlossaryPanel glossary={glossary} onGlossaryChange={handleGlossaryChange} />
      </main>
    </div>
  );
}
