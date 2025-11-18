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
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  const handleVideoClick = () => {
    if (!videoUrl) {
      fileInputRef.current?.click();
    }
  };
  
  const handleAudioFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const audioDataUri = reader.result as string;
        const result = await transcribeAudio({ audioDataUri });
        
        if (result.segments && result.segments.length > 0) {
          const newTakes: Take[] = result.segments.map((segment, index) => ({
            id: index + 1,
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
    } catch (error) {
      console.error('Transcription failed:', error);
      toast({
        title: 'Transcription Failed',
        description: 'Could not transcribe the audio file.',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const openAudioFilePicker = () => {
    audioInputRef.current?.click();
  }


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
              <UploadCloud className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Upload Video</h3>
              <p className="text-muted-foreground">
                Click here to select a video file (MP4, WebM, etc.)
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
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
         <div className="mt-4">
          <Button onClick={openAudioFilePicker} disabled={isTranscribing}>
            {isTranscribing ? <Loader2 className="mr-2 animate-spin" /> : null}
            Transcribe Audio
          </Button>
          <Input
            ref={audioInputRef}
            type="file"
            className="hidden"
            accept="audio/*"
            onChange={handleAudioFileChange}
          />
          <p className="text-xs text-muted-foreground mt-2">Upload an audio file to automatically generate takes.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
