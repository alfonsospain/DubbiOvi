"use client";

import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import Timeline from '@/components/Timeline';
import type { Take } from '@/lib/types';

export default function DetachedVideoPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [takes, setTakes] = useState<Take[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('dubbiovi-video-sync');

    const handleMessage = async (e: MessageEvent) => {
      const { type, payload } = e.data || {};
      if (type === 'DETACHED_INIT' && payload) {
        setTakes(payload.takes || []);
        if (payload.videoPath) {
          const url = `/api/video?path=${encodeURIComponent(payload.videoPath)}`;
          setVideoUrl(url);
          
          try {
            // Fetch the local video file over HTTP to construct a File object
            // so that the AudioWaveform component can decode the track locally.
            const response = await fetch(url);
            if (response.ok) {
              const blob = await response.blob();
              const file = new File([blob], payload.videoName || 'video.mp4', { type: 'video/mp4' });
              setVideoFile(file);
            }
          } catch (err) {
            console.error('Failed to fetch video file for waveform decoding:', err);
          }
        }
      } else if (type === 'TAKES_UPDATE' && payload) {
        setTakes(payload.takes || []);
      }
    };

    channel.addEventListener('message', handleMessage);

    // Announce to the main window that the detached view is ready
    channel.postMessage({ type: 'DETACHED_MOUNTED' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  const handleVideoFileChange = (file: File) => {
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const handleTimelineTakeClick = (index: number) => {
    setCurrentIndex(index);
    const take = takes[index];
    if (take && videoRef.current) {
      videoRef.current.currentTime = take.startSeconds;
    }
  };

  const handleTimelineTakeDoubleClick = (index: number) => {
    setCurrentIndex(index);
    const take = takes[index];
    if (take && videoRef.current) {
      videoRef.current.currentTime = take.startSeconds;
      videoRef.current.play().catch(err => console.error("Auto-play failed:", err));
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

  const handleDockVideo = () => {
    if (typeof window !== 'undefined' && (window as any).electron?.closeDetachedWindow) {
      (window as any).electron.closeDetachedWindow();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col dark bg-background p-4 md:p-6 overflow-hidden gap-4">
      <div className="flex-grow min-h-0 overflow-y-auto">
        <VideoPlayer
          videoRef={videoRef}
          videoUrl={videoUrl}
          videoFile={videoFile}
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
          onDetachToggle={handleDockVideo}
          isDetached={true}
        />
      </div>
      <div className="shrink-0">
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
      </div>
    </div>
  );
}
