'use client';

import React, { useRef, useState, useEffect } from 'react';

interface AudioWaveformProps {
  videoFile: File | null;
  currentTime: number;
  duration: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  videoFile,
  currentTime,
  duration,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const decodingRef = useRef<string | null>(null);

  // Decode audio track asynchronously
  useEffect(() => {
    if (!videoFile) {
      setPeaks([]);
      return;
    }

    // Prevent duplicate decoding of same file
    if (decodingRef.current === videoFile.name) return;
    decodingRef.current = videoFile.name;

    setIsLoading(true);

    const decode = async () => {
      try {
        const arrayBuffer = await videoFile.arrayBuffer();
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('Web Audio API not supported.');
        }

        const audioContext = new AudioContextClass();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        await audioContext.close();

        const channelData = audioBuffer.getChannelData(0);
        const numPeaks = 400;
        const step = Math.floor(channelData.length / numPeaks);
        const computedPeaks: number[] = [];

        for (let i = 0; i < numPeaks; i++) {
          let max = 0;
          const start = i * step;
          const end = Math.min(start + step, channelData.length);
          for (let j = start; j < end; j++) {
            const val = Math.abs(channelData[j]);
            if (val > max) max = val;
          }
          computedPeaks.push(max);
        }

        // Normalize peaks
        const maxPeak = Math.max(...computedPeaks);
        const normalized = maxPeak > 0 ? computedPeaks.map(p => p / maxPeak) : computedPeaks;

        setPeaks(normalized);
      } catch (err) {
        console.error('Waveform decoding failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    decode();
  }, [videoFile]);

  // Redraw waveform canvas when peaks or currentTime changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const numPeaks = peaks.length;
    const barWidth = width / numPeaks;
    const gap = 1; // 1px gap between bars

    // Draw background placeholder line
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, height / 2 - 1, width, 2);

    const progressRatio = duration > 0 ? currentTime / duration : 0;
    const activeIndex = Math.floor(progressRatio * numPeaks);

    for (let i = 0; i < numPeaks; i++) {
      const peakHeight = peaks[i] * height * 0.8; // Use 80% height to avoid touching borders
      const x = i * barWidth;
      const y = (height - peakHeight) / 2;

      // Color coding: #00C853 for played, #1e293b for unplayed
      ctx.fillStyle = i <= activeIndex ? '#00C853' : '#1e293b';
      
      // Draw rounded/clean bars
      ctx.fillRect(x + gap, y, barWidth - gap, peakHeight);
    }

    // Draw synchronized playhead line: bright green (#00FF88)
    const playheadX = progressRatio * width;
    ctx.fillStyle = '#00FF88';
    ctx.fillRect(playheadX - 1, 0, 2, height);
  }, [peaks, currentTime, duration]);

  if (!videoFile) return null;

  return (
    <div className="w-full bg-slate-950 border border-border/20 rounded-md p-2 flex flex-col gap-1.5 select-none">
      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
        <span>Waveform</span>
        {isLoading ? (
          <span className="animate-pulse text-[#00FF88]">ANALYZING TRACK...</span>
        ) : (
          <span>LOADED</span>
        )}
      </div>
      <div className="relative h-14 w-full bg-slate-900/50 rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={56}
          className="h-full w-full block"
        />
      </div>
    </div>
  );
};

export default AudioWaveform;
