'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import type { Take } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatTimeForDisplay } from '@/lib/utils';
import Timeline from './Timeline';
import { Loader2, UploadCloud } from 'lucide-react';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoUrl: string | null;
  posterUrl?: string;
  posterHint?: string;
  onFileChange: (file: File) => void;
  takes: Take[];
  onTakesUpdate: (takes: Take[]) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  currentTime: number;
  videoDuration: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  videoUrl,
  posterUrl,
  posterHint,
  onFileChange,
  takes,
  onTakesUpdate,
  currentIndex,
  setCurrentIndex,
  onTimeUpdate,
  onDurationChange,
  currentTime,
  videoDuration,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
      await handleTranscription(file);
    }
  };

  const handleTranscription = async (file: File) => {
    setIsTranscribing(true);
    toast({
      title: 'Transcription Started',
      description:
        'The audio is being transcribed. This may take a few minutes for longer videos.',
    });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const audioDataUri = reader.result as string;
        const result = await transcribeAudio({ audioDataUri });

        if (result.segments && result.segments.length > 0) {
          const newTakes: Take[] = result.segments.map((segment, index) => ({
            id: crypto.randomUUID(),
            character: `Speaker ${segment.speaker}`,
            time: `${formatTimeForDisplay(segment.start)} - ${formatTimeForDisplay(segment.end)}`,
            startSeconds: segment.start,
            endSeconds: segment.end,
            original: segment.text,
            translation: '',
            notes: '',
            status: 'In Progress',
          }));
          onTakesUpdate(newTakes);
          toast({
            title: 'Transcription Complete',
            description: `Successfully transcribed ${newTakes.length} takes.`,
          });
        } else {
          toast({
            title: 'Transcription Complete',
            description: 'No speech was detected in the audio.',
          });
          onTakesUpdate([]);
        }
      };
      reader.onerror = (error) => {
          throw new Error('Failed to read file for transcription.');
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      toast({
        title: 'Transcription Failed',
        description: 'Could not transcribe the audio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };


  const handleVideoClick = () => {
    if (!videoUrl) {
      fileInputRef.current?.click();
    }
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-slate-900 shadow-lg">
          <video
            ref={videoRef}
            src={videoUrl || undefined}
            controls={!!videoUrl}
            className="h-full w-full"
            onTimeUpdate={e => onTimeUpdate(e.currentTarget.currentTime)}
            onDurationChange={e => onDurationChange(e.currentTarget.duration)}
            onLoadedMetadata={e => onDurationChange(e.currentTarget.duration)}
          />
          {!videoUrl && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 p-8 text-center"
              onClick={handleVideoClick}
            >
              {posterUrl && (
                <Image
                  src={posterUrl}
                  alt={posterHint || 'Video placeholder'}
                  data-ai-hint={posterHint}
                  fill
                  className="object-cover -z-10 opacity-30"
                />
              )}
              {isTranscribing ? (
                <>
                  <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
                  <h3 className="text-xl font-semibold">Transcribing...</h3>
                  <p className="text-muted-foreground">
                    This may take a moment. Please wait.
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud className="h-16 w-16 text-muted-foreground" />
                  <h3 className="text-xl font-semibold">
                    Upload Video to Transcribe
                  </h3>
                  <p className="text-muted-foreground">
                    Click here to select a video file (MP4, WebM, etc.)
                  </p>
                </>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="video/*,audio/*"
                onChange={handleFileChange}
                disabled={isTranscribing}
              />
            </div>
          )}
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm font-mono text-muted-foreground">
            <span>{formatTimeForDisplay(currentTime)}</span>
            <span>{formatTimeForDisplay(videoDuration)}</span>
          </div>
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
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
