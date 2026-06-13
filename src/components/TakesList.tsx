'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { getTranslationSuggestion } from '@/ai/ai-translation-suggestions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Trash2, Lock, Unlock, Clock, CheckCircle } from 'lucide-react';
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
  selectedTakeIndex?: number;
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
  selectedTakeIndex,
  onTakeSelect,
}) => {
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);

  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const sourceTextRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    if (selectedTakeIndex !== undefined && selectedTakeIndex >= 0 && selectedTakeIndex < takes.length) {
      // Scroll the row into view
      const row = rowRefs.current[selectedTakeIndex];
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      // Focus the source text textarea
      const sourceText = sourceTextRefs.current[selectedTakeIndex];
      if (sourceText) {
        sourceText.focus();
      }
    }
  }, [selectedTakeIndex, takes]);

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
          status: 'Pending',
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

  // Calculate metrics
  const totalCount = takes.length;
  const translatedCount = takes.filter(t => t.translation && t.translation.trim() !== '').length;
  const reviewedCount = takes.filter(t => t.status === 'Reviewed').length;
  const lockedCount = takes.filter(t => t.status === 'Locked').length;
  const completionPercentage = totalCount > 0 ? Math.round((translatedCount / totalCount) * 100) : 0;

  // Segment widths in %
  const lockedWidth = totalCount > 0 ? (lockedCount / totalCount) * 100 : 0;
  const reviewedWidth = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;
  const translatedPendingCount = takes.filter(t => t.status === 'Pending' && t.translation && t.translation.trim() !== '').length;
  const translatedPendingWidth = totalCount > 0 ? (translatedPendingCount / totalCount) * 100 : 0;
  const untranslatedWidth = 100 - (lockedWidth + reviewedWidth + translatedPendingWidth);

  return (
    <div className="flex-grow flex flex-col min-h-0">
      {/* Progress Indicator Panel */}
      <div className="p-3 border-b bg-card/40 flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="flex flex-col p-1.5 rounded bg-secondary/30">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Translated</span>
            <span className="font-semibold text-xs mt-0.5">{translatedCount} / {totalCount}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded bg-secondary/30">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider text-blue-400">Reviewed</span>
            <span className="font-semibold text-xs mt-0.5 text-blue-400">{reviewedCount} / {totalCount}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded bg-secondary/30">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider text-green-400">Locked</span>
            <span className="font-semibold text-xs mt-0.5 text-green-400">{lockedCount} / {totalCount}</span>
          </div>
          <div className="flex flex-col p-1.5 rounded bg-secondary/30 justify-center">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Completion</span>
            <span className="font-bold text-xs mt-0.5 text-primary">{completionPercentage}%</span>
          </div>
        </div>
        {/* Segmented Progress Bar */}
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex">
          <div style={{ width: `${lockedWidth}%` }} className="bg-green-500 h-full transition-all duration-300" title={`Locked: ${lockedCount}`} />
          <div style={{ width: `${reviewedWidth}%` }} className="bg-blue-500 h-full transition-all duration-300" title={`Reviewed: ${reviewedCount}`} />
          <div style={{ width: `${translatedPendingWidth}%` }} className="bg-primary/50 h-full transition-all duration-300" title={`Translated (Pending): ${translatedPendingCount}`} />
          <div style={{ width: `${untranslatedWidth}%` }} className="bg-secondary h-full transition-all duration-300" />
        </div>
      </div>

      <ScrollArea className="flex-grow min-h-0" type="always">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[125px]">Status</TableHead>
              <TableHead>Source Text</TableHead>
              <TableHead>Target Text</TableHead>
              <TableHead className="w-[80px] text-right">Tools</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {takes.map((take, index) => {
              const isLocked = take.status === 'Locked';
              return (
                <TableRow 
                  key={take.id} 
                  ref={el => { rowRefs.current[index] = el; }}
                  className={cn(
                    isTakeActive(take) && "bg-primary/10",
                    selectedTakeIndex === index && "bg-muted/50 border-primary"
                  )} 
                  onClick={() => onTakeSelect(index)}
                >
                  <TableCell className="align-top pt-3">
                    <Select
                      value={take.status}
                      onValueChange={(value) => handleFieldChange(take.id, 'status', value)}
                    >
                      <SelectTrigger className={cn("h-8 text-xs font-medium w-full flex items-center justify-between gap-1", 
                        take.status === 'Pending' && "border-muted-foreground/30 text-muted-foreground bg-secondary/10",
                        take.status === 'Reviewed' && "border-blue-500/50 text-blue-400 bg-blue-500/5",
                        take.status === 'Locked' && "border-green-500/50 text-green-400 bg-green-500/5"
                      )}>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {take.status === 'Locked' ? (
                            <Lock className="h-3.5 w-3.5 shrink-0 text-green-400" />
                          ) : take.status === 'Reviewed' ? (
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <SelectValue placeholder="Status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> Pending
                          </span>
                        </SelectItem>
                        <SelectItem value="Reviewed">
                          <span className="flex items-center gap-1.5 text-xs text-blue-400">
                            <CheckCircle className="h-3.5 w-3.5" /> Reviewed
                          </span>
                        </SelectItem>
                        <SelectItem value="Locked">
                          <span className="flex items-center gap-1.5 text-xs text-green-400">
                            <Lock className="h-3.5 w-3.5" /> Locked
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Textarea
                      ref={el => { sourceTextRefs.current[index] = el; }}
                      defaultValue={take.original}
                      readOnly={isLocked}
                      onBlur={e =>
                        handleFieldChange(take.id, 'original', e.target.value)
                      }
                      className={cn(
                        "h-auto text-xs min-h-[60px] select-text",
                        isLocked && "bg-secondary/20 text-muted-foreground cursor-not-allowed border-dashed"
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Textarea
                      defaultValue={take.translation}
                      readOnly={isLocked}
                      onBlur={e =>
                        handleFieldChange(take.id, 'translation', e.target.value)
                      }
                      className={cn(
                        "h-auto text-xs min-h-[60px] select-text",
                        isLocked && "bg-secondary/20 text-muted-foreground cursor-not-allowed border-dashed"
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-right align-top pt-3">
                    <div className="flex flex-col gap-1 items-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          suggestTranslation(take);
                        }}
                        disabled={isSuggesting === take.id || isLocked}
                        title={isLocked ? "Unlock to suggest translation" : "Suggest Translation"}
                      >
                        <Sparkles
                          className={cn(
                            "h-4 w-4",
                            isSuggesting === take.id && 'animate-spin'
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTakeDelete(take.id);
                        }}
                        disabled={isLocked}
                        title={isLocked ? "Unlock to delete" : "Delete Take"}
                        className="text-destructive hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default TakesList;
