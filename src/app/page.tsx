"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ProjectSettings, Take } from '@/lib/types';
import { DEFAULT_PROJECT_SETTINGS } from '@/lib/data';
import Header from '@/components/Header';
import ProjectSettingsComponent from '@/components/ProjectSettings';
import VideoPlayer from '@/components/VideoPlayer';
import TranslationPanel from '@/components/TranslationPanel';
import ImportExportPanel from '@/components/ImportExportPanel';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import GlossaryPanel from '@/components/GlossaryPanel';
import { getTranslationSuggestion } from '@/ai/ai-translation-suggestions';
import type { GlossaryEntry } from '@/lib/types';

export default function DubbingStudioPro() {
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  const saveToCloud = useCallback(async () => {
    setIsSaving(true);
    // This is where you would save to Firestore
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      console.log('Saving project:', { settings, takes, glossary });
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
  }, [settings, takes, glossary, toast]);

  const handleSettingsChange = (newSettings: ProjectSettings) => {
    setSettings(newSettings);
  };

  const handleTakesChange = (newTakes: Take[]) => {
    setTakes(newTakes);
    if (currentIndex >= newTakes.length) {
      setCurrentIndex(Math.max(0, newTakes.length - 1));
    }
  };

  const handleCurrentTakeChange = (updatedTake: Take) => {
    const newTakes = takes.map(take =>
      take.id === updatedTake.id ? updatedTake : take
    );
    setTakes(newTakes);
  };

  const handleVideoFileChange = (file: File) => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
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
        const newTakes = takes.map(t =>
          t.id === take.id
            ? {
                ...t,
                translation: result.translation,
                status: 'Translated' as const,
              }
            : t
        );
        setTakes(newTakes);
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
              onTakesUpdate={setTakes}
            />
          </div>
          <div className="row-start-2 lg:row-start-auto lg:col-span-1">
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
            <ProjectSettingsComponent
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </div>
          <ImportExportPanel takes={takes} onImport={handleTakesChange} />
        </div>
        <GlossaryPanel glossary={glossary} onGlossaryChange={setGlossary} />
      </main>
    </div>
  );
}
