'use client';

import React, { useState } from 'react';
import type { Take } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Sparkles,
  Square,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import SentimentDisplay from './SentimentDisplay';
import { Skeleton } from './ui/skeleton';

interface TranslationPanelProps {
  currentTake: Take | undefined;
  currentIndex: number;
  totalTakes: number;
  onTranslationChange: (translation: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({
  currentTake,
  currentIndex,
  totalTakes,
  onTranslationChange,
  onPrevious,
  onNext,
  videoRef,
}) => {
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleAction = (action: () => void, message: string) => {
    if (videoRef.current?.src) {
      action();
    } else {
      toast({
        title: 'No Video Loaded',
        description: 'Please upload a video first to use playback controls.',
        variant: 'destructive',
      });
    }
  };

  const jumpToTakeStart = () =>
    handleAction(() => {
      if (videoRef.current && currentTake) {
        videoRef.current.currentTime = currentTake.startSeconds;
      }
    }, 'Jumped to take start.');

  const playSegment = () =>
    handleAction(() => {
      if (videoRef.current && currentTake) {
        const video = videoRef.current;
        video.currentTime = currentTake.startSeconds;
        video.play();
        const checkTime = () => {
          if (video.currentTime >= currentTake.endSeconds) {
            video.pause();
          } else {
            requestAnimationFrame(checkTime);
          }
        };
        requestAnimationFrame(checkTime);
      }
    }, 'Playing take.');

  const suggestTranslation = async () => {
    setIsSuggesting(true);
    // Placeholder for AI translation
    await new Promise(res => setTimeout(res, 1500));
    onTranslationChange(
      `${currentTake?.original} (AI translation placeholder)`
    );
    setIsSuggesting(false);
    toast({
      title: 'Translation Suggested',
      description: 'An AI-powered suggestion has been generated.',
    });
  };

  if (!currentTake) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Take</CardTitle>
          <div className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {totalTakes}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
          <span>
            <strong>Character:</strong> {currentTake.character}
          </span>
          <span>
            <strong>Timecode:</strong> {currentTake.time}
          </span>
          <Badge variant={currentTake.status === 'Translated' ? 'default' : 'secondary'} className="bg-accent text-accent-foreground">
            {currentTake.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <Label
            htmlFor="original-text"
            className="mb-2 block text-sm font-medium"
          >
            Original ({currentTake.notes || 'EN'})
          </Label>
          <div
            id="original-text"
            className="rounded-md border bg-muted/50 p-3 text-sm min-h-[60px]"
          >
            {currentTake.original}
          </div>
          <SentimentDisplay text={currentTake.original} />
        </div>
        <Separator />
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label
              htmlFor="translation-text"
              className="text-sm font-medium"
            >
              Translation ({'ES'})
            </Label>
            <span className="text-xs text-muted-foreground">
              Chars: {currentTake.translation.length}
            </span>
          </div>
          <Textarea
            id="translation-text"
            value={currentTake.translation}
            onChange={e => onTranslationChange(e.target.value)}
            placeholder="Enter your dubbing translation..."
            className="min-h-[120px] resize-y"
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={suggestTranslation}
            disabled={isSuggesting}
          >
            <Sparkles
              className={`mr-2 h-4 w-4 ${isSuggesting ? 'animate-spin' : ''}`}
            />
            Suggest Translation
          </Button>
          <Button variant="outline" onClick={() => {toast({title: "Coming Soon!", description: "Automated timecode adjustment is under development."})}}>
            <ChevronsRight className="mr-2 h-4 w-4" />
            Auto-Adjust Timecode
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={jumpToTakeStart}>
            <Square className="mr-2 h-4 w-4" /> Go to Start
          </Button>
          <Button variant="outline" onClick={playSegment}>
            <Play className="mr-2 h-4 w-4" /> Play Take
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <Button onClick={onPrevious} disabled={currentIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button onClick={onNext} disabled={currentIndex >= totalTakes - 1}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TranslationPanel;
