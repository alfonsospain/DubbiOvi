'use client';

import React from 'react';
import { Take } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimelineProps {
  takes: Take[];
  duration: number;
  currentTime: number;
  currentIndex: number;
  onTakeClick: (index: number) => void;
  onTimebarClick: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  takes,
  duration,
  currentTime,
  currentIndex,
  onTakeClick,
  onTimebarClick,
}) => {
  const handleTimebarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      onTimebarClick(duration * percentage);
    }
  };

  const getTakeColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <TooltipProvider>
      <div
        className="relative h-12 w-full cursor-pointer rounded-full bg-secondary"
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
                      className={cn(
                        'absolute top-0 h-full rounded-md transition-all duration-150 ease-linear',
                        getTakeColor(index),
                        {
                          'ring-2 ring-offset-2 ring-primary ring-offset-background':
                            currentIndex === index,
                          'opacity-70 hover:opacity-100': currentIndex !== index,
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
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">
                      Take {index + 1}: {take.character}
                    </p>
                    <p className="text-sm text-muted-foreground">{take.time}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
        </div>
        {duration > 0 && (
          <div
            className="absolute top-0 h-full w-1 -translate-x-1/2 rounded-full bg-primary/70 pointer-events-none"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default Timeline;
