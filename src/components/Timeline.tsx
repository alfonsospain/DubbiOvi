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

  return (
    <TooltipProvider>
      <div className="w-full bg-muted p-2 rounded-lg">
        <div className="flex justify-between text-xs font-mono text-muted-foreground mb-2">
            <span>{formatTimeForDisplay(currentTime)}</span>
            <span>{formatTimeForDisplay(duration)}</span>
        </div>
        <div
            className="relative h-10 w-full cursor-pointer rounded-lg bg-secondary/30"
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
                            'absolute top-0 h-full rounded-sm transition-all duration-150 ease-linear',
                            getTakeColor(take.status),
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
                          Start: {formatTimeForDisplay(take.startSeconds)} | End: {formatTimeForDisplay(take.endSeconds)}
                        </p>
                        <p className={cn("text-[11px] font-semibold mt-1",
                          take.status === 'Locked' && "text-green-400",
                          take.status === 'Reviewed' && "text-blue-400",
                          take.status === 'Pending' && "text-muted-foreground"
                        )}>
                          Status: {take.status}
                        </p>
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
      </div>
    </TooltipProvider>
  );
};

export default Timeline;
