"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ProjectSettings, Take } from '@/lib/types';
import { DEFAULT_PROJECT_SETTINGS, DEFAULT_TAKES } from '@/lib/data';
import {
  Cloud,
  HardDriveDownload,
  HardDriveUpload,
  User,
} from 'lucide-react';
import Header from '@/components/Header';
import ProjectSettingsComponent from '@/components/ProjectSettings';
import VideoPlayer from '@/components/VideoPlayer';
import TranslationPanel from '@/components/TranslationPanel';
import ImportExportPanel from '@/components/ImportExportPanel';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const PROJECT_SETTINGS_KEY = 'dubbing_project_settings_v3';
const PROJECT_TAKES_KEY = 'dubbing_project_takes_v3';

export default function DubbingStudioPro() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ProjectSettings>(
    DEFAULT_PROJECT_SETTINGS
  );
  const [takes, setTakes] = useState<Take[]>([]);
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

  useEffect(() => {
    if (!isClient) return;

    try {
      const savedSettings = localStorage.getItem(PROJECT_SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      const savedTakes = localStorage.getItem(PROJECT_TAKES_KEY);
      if (savedTakes) {
        const parsedTakes = JSON.parse(savedTakes);
        if (parsedTakes.length > 0) {
          setTakes(parsedTakes);
        } else {
          setTakes(DEFAULT_TAKES);
        }
      } else {
        setTakes(DEFAULT_TAKES);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
      toast({
        title: 'Error',
        description: 'Could not load saved data. Using defaults.',
        variant: 'destructive',
      });
      setTakes(DEFAULT_TAKES);
    }
  }, [isClient, toast]);

  const saveToCloud = useCallback(async () => {
    setIsSaving(true);
    // Simulate cloud save
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      localStorage.setItem(PROJECT_SETTINGS_KEY, JSON.stringify(settings));
      localStorage.setItem(PROJECT_TAKES_KEY, JSON.stringify(takes));
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
  }, [settings, takes, toast]);

  const handleSettingsChange = (newSettings: ProjectSettings) => {
    setSettings(newSettings);
  };

  const handleTakesChange = (newTakes: Take[]) => {
    setTakes(newTakes);
    if (currentIndex >= newTakes.length) {
      setCurrentIndex(Math.max(0, newTakes.length - 1));
    }
  };

  const handleTranslationChange = (newTranslation: string) => {
    const newTakes = [...takes];
    if (newTakes[currentIndex]) {
      newTakes[currentIndex].translation = newTranslation;
      newTakes[currentIndex].status = newTranslation.trim()
        ? 'Translated'
        : 'In Progress';
      setTakes(newTakes);
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
          <div className="row-start-2 lg:row-start-auto lg:col-span-1">
            <TranslationPanel
              currentTake={currentTake}
              currentIndex={currentIndex}
              totalTakes={takes.length}
              onTranslationChange={handleTranslationChange}
              onPrevious={() => setCurrentIndex(i => Math.max(0, i - 1))}
              onNext={() =>
                setCurrentIndex(i => Math.min(takes.length - 1, i + 1))
              }
              videoRef={videoRef}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProjectSettingsComponent
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
          <ImportExportPanel takes={takes} onImport={handleTakesChange} />
        </div>
      </main>
    </div>
  );
}
