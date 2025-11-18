'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import type { Take } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatTimeForDisplay } from '@/lib/utils';
import Timeline from './Timeline';
import { UploadCloud } from 'lucide-react';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoUrl: string | null;
  posterUrl?: string;
  posterHint?: string;
  onFileChange: (file: File) => void;
  takes: Take[];
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
  currentIndex,
  setCurrentIndex,
  onTimeUpdate,
  onDurationChange,
  currentTime,
  videoDuration,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
