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
import { Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';

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
    <div className="flex-grow flex flex-col min-h-0">
      <ScrollArea className="flex-grow min-h-0" type="always">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Source Text</TableHead>
              <TableHead>Target Text</TableHead>
              <TableHead className="w-[100px] text-right">Tools</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {takes.map((take, index) => (
              <TableRow key={take.id} className={cn(isTakeActive(take) && "bg-primary/10")} onClick={() => onTakeSelect(index)}>
                <TableCell>
                  <Textarea
                    defaultValue={take.original}
                    onBlur={e =>
                      handleFieldChange(take.id, 'original', e.target.value)
                    }
                    className="h-auto text-xs min-h-[60px]"
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    defaultValue={take.translation}
                    onBlur={e =>
                      handleFieldChange(take.id, 'translation', e.target.value)
                    }
                    className="h-auto text-xs min-h-[60px]"
                  />
                </TableCell>
                <TableCell className="text-right align-top">
                  <div className="flex flex-col gap-1 items-end">
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
