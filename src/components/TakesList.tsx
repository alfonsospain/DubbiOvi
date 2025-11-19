'use client';

import React, { useState } from 'react';
import type { GlossaryEntry, ProjectSettings, Take } from '@/lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { getTranslationSuggestion } from '@/ai/ai-translation-suggestions';
import { useToast } from '@/hooks/use-toast';
import { Play, Sparkles, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface TakesListProps {
  takes: Take[];
  onTakeUpdate: (take: Take) => void;
  onTakeDelete: (id: string) => void;
  glossary: GlossaryEntry[];
  settings: ProjectSettings;
  videoRef: React.RefObject<HTMLVideoElement>;
  currentTime: number;
  onTakeSelect: (index: number) => void;
}

const TakesList: React.FC<TakesListProps> = ({
  takes,
  onTakeUpdate,
  onTakeDelete,
  glossary,
  settings,
  videoRef,
  currentTime,
  onTakeSelect,
}) => {
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);

  const handleFieldChange = (
    id: string,
    field: keyof Take,
    value: string
  ) => {
    const take = takes.find(t => t.id === id);
    if (take) {
      const updatedTake = { ...take, [field]: value };
      onTakeUpdate(updatedTake);
    }
  };

  const playSegment = (take: Take) => {
    if (videoRef.current) {
      const video = videoRef.current;
      video.currentTime = take.startSeconds;
      video.play();
      const checkTime = () => {
        if (video.currentTime >= take.endSeconds) {
          video.pause();
        } else {
          requestAnimationFrame(checkTime);
        }
      };
      requestAnimationFrame(checkTime);
    } else {
      toast({
        title: 'No video loaded',
        description: 'Please upload a video to play segments.',
        variant: 'destructive',
      });
    }
  };

  const suggestTranslation = async (take: Take) => {
    setIsSuggesting(take.id);
    try {
      const result = await getTranslationSuggestion({
        originalText: take.original,
        sourceLanguage: settings.sourceLang,
        targetLanguage: settings.targetLang,
        glossary,
      });

      if (result.translation) {
        onTakeUpdate({
          ...take,
          translation: result.translation,
          status: 'Translated',
        });
        toast({
          title: 'Translation Suggested',
          description: 'AI-powered suggestion has been generated.',
        });
      } else {
        throw new Error('No translation returned.');
      }
    } catch (error) {
      console.error('Translation suggestion failed', error);
      toast({
        title: 'Translation Failed',
        description:
          'Could not get a translation suggestion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(null);
    }
  };
  
  const isTakeActive = (take: Take) => {
    return currentTime >= take.startSeconds && currentTime < take.endSeconds;
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-grow">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[110px]">Start</TableHead>
              <TableHead className="w-[110px]">End</TableHead>
              <TableHead className="w-[150px]">Character</TableHead>
              <TableHead>Transcript</TableHead>
              <TableHead>Adaptation</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {takes.map((take, index) => (
              <TableRow key={take.id} className={cn(isTakeActive(take) && "bg-primary/10")} onClick={() => onTakeSelect(index)}>
                <TableCell>
                  <Input
                    type="text"
                    value={take.time.split('-->')[0].trim()}
                    onBlur={(e) =>
                        handleFieldChange(
                            take.id,
                            'time',
                            `${e.target.value} --> ${take.time.split('-->')[1].trim()}`
                        )
                    }
                    onChange={e => {
                        const newTakes = [...takes];
                        newTakes[index].time = `${e.target.value} --> ${take.time.split('-->')[1].trim()}`;
                    }}
                    className="h-8 font-mono text-xs"
                  />
                </TableCell>
                 <TableCell>
                  <Input
                    type="text"
                    value={take.time.split('-->')[1].trim()}
                     onBlur={(e) =>
                      handleFieldChange(
                        take.id,
                        'time',
                         `${take.time.split('-->')[0].trim()} --> ${e.target.value}`
                      )
                    }
                     onChange={e => {
                        const newTakes = [...takes];
                        newTakes[index].time = `${take.time.split('-->')[0].trim()} --> ${e.target.value}`;
                    }}
                    className="h-8 font-mono text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    defaultValue={take.character}
                    onBlur={e =>
                      handleFieldChange(take.id, 'character', e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    defaultValue={take.original}
                    onBlur={e =>
                      handleFieldChange(take.id, 'original', e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    defaultValue={take.translation}
                    onBlur={e =>
                      handleFieldChange(take.id, 'translation', e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => suggestTranslation(take)}
                      disabled={isSuggesting === take.id}
                      title="Suggest Translation"
                    >
                      <Sparkles
                        className={`h-4 w-4 ${
                          isSuggesting === take.id ? 'animate-spin' : ''
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => playSegment(take)}
                      title="Play Segment"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onTakeDelete(take.id)}
                      title="Delete Take"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default TakesList;
