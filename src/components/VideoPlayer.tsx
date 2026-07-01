'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { AudioWaveform } from './AudioWaveform';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UploadCloud,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Repeat,
  ExternalLink,
} from 'lucide-react';
import { formatTimeForDisplay } from '@/lib/utils';
import type { Take } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoUrl: string | null;
  videoFile: File | null;
  posterUrl?: string;
  posterHint?: string;
  onFileChange: (file: File) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  currentTime: number;
  videoDuration: number;
  onPrevTake?: () => void;
  onNextTake?: () => void;
  hasPrevTake?: boolean;
  hasNextTake?: boolean;
  currentTake?: Take | null;
  onDetachToggle?: () => void;
  isDetached?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  videoUrl,
  videoFile,
  posterUrl,
  posterHint,
  onFileChange,
  onTimeUpdate,
  onDurationChange,
  currentTime,
  videoDuration,
  onPrevTake,
  onNextTake,
  hasPrevTake = false,
  hasNextTake = false,
  currentTake = null,
  onDetachToggle,
  isDetached = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1.0');
  const [isRepeating, setIsRepeating] = useState(false);

  // Sync video play/pause states
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef, videoUrl]);

  // Turn off repeat if target take changes
  useEffect(() => {
    setIsRepeating(false);
  }, [currentTake?.id]);

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

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      setIsRepeating(false);
      videoRef.current.play().catch(err => console.error('Play failed:', err));
    }
  };

  const handleRewind = () => {
    if (!videoRef.current) return;
    setIsRepeating(false);
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
  };

  const handleForward = () => {
    if (!videoRef.current) return;
    setIsRepeating(false);
    videoRef.current.currentTime = Math.min(
      videoRef.current.duration || 0,
      videoRef.current.currentTime + 5
    );
  };

  const handleSpeedChange = (value: string) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = parseFloat(value);
    setPlaybackSpeed(value);
  };

  const handleRepeatToggle = () => {
    if (!videoRef.current || !currentTake) return;
    
    // Seek to the start of the active take
    videoRef.current.currentTime = currentTake.startSeconds;
    
    // Toggle state and auto play
    setIsRepeating(true);
    videoRef.current.play().catch(err => console.error('Play failed:', err));
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const time = e.currentTarget.currentTime;
    onTimeUpdate(time);

    // Stop at end time of repeat take
    if (isRepeating && currentTake && time >= currentTake.endSeconds) {
      e.currentTarget.pause();
      setIsRepeating(false);
    }
  };

  return (
    <Card className="flex-shrink-0 border bg-card text-card-foreground shadow-sm">
      <CardContent className="p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1 py-0.5 border-b border-border/20 pb-1.5 mb-0.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider select-none">Video Monitor</span>
          {onDetachToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDetachToggle}
              className="h-6 text-[10px] font-semibold gap-1 px-2 hover:bg-muted"
            >
              <ExternalLink className={cn("h-3 w-3", isDetached && "rotate-180")} />
              {isDetached ? 'Dock Video' : 'Detach Video'}
            </Button>
          )}
        </div>
        <div 
          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-md bg-slate-950 border border-border/30"
          onClick={handleVideoClick}
        >
          <video
            ref={videoRef}
            src={videoUrl || undefined}
            controls={!!videoUrl}
            className="h-full w-full"
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={e => onDurationChange(e.currentTarget.duration)}
            onLoadedMetadata={e => onDurationChange(e.currentTarget.duration)}
          />
          {!videoUrl && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 p-8 text-center"
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
                Click here to select a video file.
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

        {/* Audio Waveform */}
        {videoUrl && (
          <AudioWaveform
            videoFile={videoFile}
            currentTime={currentTime}
            duration={videoDuration}
          />
        )}

        {/* Transport Controls Toolbar */}
        {videoUrl && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-1.5 rounded bg-muted/40 border border-border/50 text-xs">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={onPrevTake}
                disabled={!hasPrevTake}
                title="Previous Take"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={handleRewind}
                title="Rewind 5 Seconds"
              >
                <Rewind className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handlePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={handleForward}
                title="Fast Forward 5 Seconds"
              >
                <FastForward className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={onNextTake}
                disabled={!hasNextTake}
                title="Next Take"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 hover:bg-muted",
                  isRepeating && "text-primary bg-primary/10 hover:bg-primary/20"
                )}
                onClick={handleRepeatToggle}
                disabled={!currentTake}
                title={currentTake ? "Repeat Current Take (Play & Stop at end)" : "No Take Selected"}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            {/* Display timecode */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted-foreground select-none">
                {formatTimeForDisplay(currentTime)} / {formatTimeForDisplay(videoDuration)}
              </span>

              {/* Playback speed selector */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mr-1">Speed</span>
                <Select value={playbackSpeed} onValueChange={handleSpeedChange}>
                  <SelectTrigger className="h-7 w-[68px] text-[11px] font-mono px-2 py-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.75" className="text-[11px] font-mono">0.75x</SelectItem>
                    <SelectItem value="1.0" className="text-[11px] font-mono">1.0x</SelectItem>
                    <SelectItem value="1.25" className="text-[11px] font-mono">1.25x</SelectItem>
                    <SelectItem value="1.5" className="text-[11px] font-mono">1.5x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
