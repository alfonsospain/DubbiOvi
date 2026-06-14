'use client';

import React, { useRef, useEffect } from 'react';
import { Take } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatTimeForDisplay } from '@/lib/utils';

interface TimelineProps {
  takes: Take[];
  duration: number;
  currentTime: number;
  currentIndex: number;
  onTakeClick: (index: number) => void;
  onTakeDoubleClick?: (index: number) => void;
  onTimebarClick: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  takes,
  duration,
  currentTime,
  currentIndex,
  onTakeClick,
  onTakeDoubleClick,
  onTimebarClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Smoothly center the active take segment inside the scroll container
  useEffect(() => {
    const container = scrollContainerRef.current;
    const activeSegment = segmentRefs.current[currentIndex];

    if (container && activeSegment) {
      const containerWidth = container.clientWidth;
      const segmentLeft = activeSegment.offsetLeft;
      const segmentWidth = activeSegment.clientWidth;

      // Scroll target aligns segment mid-point to container mid-point
      const scrollTarget = segmentLeft - containerWidth / 2 + segmentWidth / 2;
      container.scrollTo({
        left: scrollTarget,
        behavior: 'smooth',
      });
    }
  }, [currentIndex, takes.length]);

  const handleTimebarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      onTimebarClick(duration * percentage);
    }
  };

  const getTakeColor = (status: 'Pending' | 'Reviewed' | 'Locked') => {
    switch (status) {
      case 'Locked':
        return 'bg-green-500';
      case 'Reviewed':
        return 'bg-blue-500';
      case 'Pending':
      default:
        return 'bg-zinc-500';
    }
  };

  // Zoom scale (pixels per second) to spread out take segments readable
  const pxPerSecond = 15;
  const timelineWidth = duration > 0 ? `${Math.max(600, duration * pxPerSecond)}px` : '100%';

  return (
    <TooltipProvider>
      <div className="w-full bg-muted p-2 rounded-lg flex flex-col gap-2">
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>{formatTimeForDisplay(currentTime)}</span>
          <span>{formatTimeForDisplay(duration)}</span>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent rounded-lg"
        >
          {/* Zoomed Timeline Track Width */}
          <div
            className="relative h-12 cursor-pointer bg-secondary/30 rounded-lg select-none"
            style={{ width: timelineWidth }}
            onClick={handleTimebarClick}
          >
            <div className="relative h-full w-full">
              {duration > 0 &&
                takes.map((take, index) => {
                  const left = (take.startSeconds / duration) * 100;
                  const width = ((take.endSeconds - take.startSeconds) / duration) * 100;
                  return (
                    <Tooltip key={take.id} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div
                          ref={el => {
                            segmentRefs.current[index] = el;
                          }}
                          className={cn(
                            'absolute top-1 bottom-1 rounded-sm transition-all duration-150 ease-linear',
                            getTakeColor(take.status),
                            {
                              'ring-2 ring-offset-2 ring-primary ring-offset-background z-10':
                                currentIndex === index,
                              'opacity-75 hover:opacity-100': currentIndex !== index,
                            }
                          )}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            onTakeClick(index);
                          }}
                          onDoubleClick={e => {
                            e.stopPropagation();
                            if (onTakeDoubleClick) {
                              onTakeDoubleClick(index);
                            }
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold text-xs">
                          Take {index + 1}: {take.character}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Start: {formatTimeForDisplay(take.startSeconds)} | End:{' '}
                          {formatTimeForDisplay(take.endSeconds)}
                        </p>
                        <p
                          className={cn(
                            'text-[11px] font-semibold mt-1',
                            take.status === 'Locked' && 'text-green-400',
                            take.status === 'Reviewed' && 'text-blue-400',
                            take.status === 'Pending' && 'text-muted-foreground'
                          )}
                        >
                          Status: {take.status}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
            </div>
            {duration > 0 && (
              <div
                className="absolute top-0 h-full w-1 -translate-x-1/2 rounded-full bg-primary pointer-events-none z-20"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Timeline;
