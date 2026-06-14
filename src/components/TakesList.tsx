'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { GlossaryEntry, ProjectSettings, Take } from '@/lib/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { getTranslationSuggestion } from '@/ai/ai-translation-suggestions';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Trash2,
  Lock,
  Clock,
  CheckCircle,
  MoreVertical,
  Scissors,
  GitMerge,
} from 'lucide-react';
import { cn, formatTimeForDisplay } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

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
  onTakeMerge: (index: number, direction: 'prev' | 'next') => void;
  onTakeSplit: (
    index: number,
    source1: string,
    source2: string,
    target1: string,
    target2: string
  ) => void;
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
  onTakeMerge,
  onTakeSplit,
}) => {
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = useState<string | null>(null);

  // Split dialog state
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [splitIndex, setSplitIndex] = useState<number | null>(null);
  const [splitSource1, setSplitSource1] = useState('');
  const [splitSource2, setSplitSource2] = useState('');
  const [splitTarget1, setSplitTarget1] = useState('');
  const [splitTarget2, setSplitTarget2] = useState('');

  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const sourceTextRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    if (
      selectedTakeIndex !== undefined &&
      selectedTakeIndex >= 0 &&
      selectedTakeIndex < takes.length
    ) {
      const row = rowRefs.current[selectedTakeIndex];
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      const sourceText = sourceTextRefs.current[selectedTakeIndex];
      if (sourceText) {
        sourceText.focus();
      }
    }
  }, [selectedTakeIndex, takes]);

  const handleFieldChange = (id: string, field: keyof Take, value: string) => {
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
        description: 'Could not get a translation suggestion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(null);
    }
  };

  const isTakeActive = (take: Take) => {
    return currentTime >= take.startSeconds && currentTime < take.endSeconds;
  };

  // Find a smart midpoint space to split text
  const findSplitPoint = (text: string) => {
    if (!text) return 0;
    const mid = Math.floor(text.length / 2);
    const spaceBefore = text.lastIndexOf(' ', mid);
    const spaceAfter = text.indexOf(' ', mid);

    if (spaceBefore === -1 && spaceAfter === -1) {
      return mid;
    }
    if (spaceBefore === -1) return spaceAfter;
    if (spaceAfter === -1) return spaceBefore;

    return mid - spaceBefore < spaceAfter - mid ? spaceBefore : spaceAfter;
  };

  const openSplitDialog = (index: number) => {
    const take = takes[index];
    if (!take) return;

    const original = take.original || '';
    const translation = take.translation || '';

    const origPoint = findSplitPoint(original);
    const transPoint = findSplitPoint(translation);

    setSplitSource1(original.substring(0, origPoint).trim());
    setSplitSource2(original.substring(origPoint).trim());
    setSplitTarget1(translation.substring(0, transPoint).trim());
    setSplitTarget2(translation.substring(transPoint).trim());

    setSplitIndex(index);
    setIsSplitOpen(true);
  };

  const handleSplitSubmit = () => {
    if (splitIndex === null) return;
    onTakeSplit(splitIndex, splitSource1, splitSource2, splitTarget1, splitTarget2);
    setIsSplitOpen(false);
    setSplitIndex(null);
  };

  // Calculate metrics
  const totalCount = takes.length;
  const translatedCount = takes.filter(t => t.translation && t.translation.trim() !== '').length;
  const reviewedCount = takes.filter(t => t.status === 'Reviewed').length;
  const lockedCount = takes.filter(t => t.status === 'Locked').length;
  const completionPercentage = totalCount > 0 ? Math.round((translatedCount / totalCount) * 100) : 0;

  // Segment widths in %
  const lockedWidth = totalCount > 0 ? (lockedCount / totalCount) * 100 : 0;
  const reviewedWidth = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;
  const translatedPendingCount = takes.filter(
    t => t.status === 'Pending' && t.translation && t.translation.trim() !== ''
  ).length;
  const translatedPendingWidth = totalCount > 0 ? (translatedPendingCount / totalCount) * 100 : 0;
  const untranslatedWidth = 100 - (lockedWidth + reviewedWidth + translatedPendingWidth);

  // Proportional Split time calculations for dialog preview
  let splitTimePreviewStart = 0;
  let splitTimePreviewMiddle = 0;
  let splitTimePreviewEnd = 0;
  if (splitIndex !== null && takes[splitIndex]) {
    const activeTake = takes[splitIndex];
    splitTimePreviewStart = activeTake.startSeconds;
    splitTimePreviewEnd = activeTake.endSeconds;
    const dur = splitTimePreviewEnd - splitTimePreviewStart;

    const l1 = splitSource1.length;
    const l2 = splitSource2.length;
    let ratio = 0.5;
    if (l1 + l2 > 0) {
      ratio = l1 / (l1 + l2);
    } else {
      const tl1 = splitTarget1.length;
      const tl2 = splitTarget2.length;
      if (tl1 + tl2 > 0) {
        ratio = tl1 / (tl1 + tl2);
      }
    }
    splitTimePreviewMiddle = splitTimePreviewStart + ratio * dur;
  }

  return (
    <div className="flex-grow flex flex-col min-h-0">
      {/* Progress Indicator Panel */}
      <div className="p-3 border-b bg-card/40 flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="flex flex-col p-1.5 rounded bg-secondary/30">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
              Translated
            </span>
            <span className="font-semibold text-xs mt-0.5">
              {translatedCount} / {totalCount}
            </span>
          </div>
          <div className="flex flex-col p-1.5 rounded bg-secondary/30">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider text-blue-400">
              Reviewed
            </span>
            <span className="font-semibold text-xs mt-0.5 text-blue-400">
              {reviewedCount} / {totalCount}
            </span>
          </div>
          <div className="flex flex-col p-1.5 rounded bg-secondary/30">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider text-green-400">
              Locked
            </span>
            <span className="font-semibold text-xs mt-0.5 text-green-400">
              {lockedCount} / {totalCount}
            </span>
          </div>
          <div className="flex flex-col p-1.5 rounded bg-secondary/30 justify-center">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
              Completion
            </span>
            <span className="font-bold text-xs mt-0.5 text-primary">{completionPercentage}%</span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex">
          <div
            style={{ width: `${lockedWidth}%` }}
            className="bg-green-500 h-full transition-all duration-300"
            title={`Locked: ${lockedCount}`}
          />
          <div
            style={{ width: `${reviewedWidth}%` }}
            className="bg-blue-500 h-full transition-all duration-300"
            title={`Reviewed: ${reviewedCount}`}
          />
          <div
            style={{ width: `${translatedPendingWidth}%` }}
            className="bg-primary/50 h-full transition-all duration-300"
            title={`Translated (Pending): ${translatedPendingCount}`}
          />
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
              const isPrevLocked = index > 0 && takes[index - 1].status === 'Locked';
              const isNextLocked = index < takes.length - 1 && takes[index + 1].status === 'Locked';

              return (
                <TableRow
                  key={take.id}
                  ref={el => {
                    rowRefs.current[index] = el;
                  }}
                  className={cn(
                    isTakeActive(take) && 'bg-primary/10',
                    selectedTakeIndex === index && 'bg-muted/50 border-primary'
                  )}
                  onClick={() => onTakeSelect(index)}
                >
                  <TableCell className="align-top pt-3">
                    <Select
                      value={take.status}
                      onValueChange={value => handleFieldChange(take.id, 'status', value)}
                    >
                      <SelectTrigger
                        className={cn(
                          'h-8 text-xs font-medium w-full flex items-center justify-between gap-1',
                          take.status === 'Pending' &&
                            'border-muted-foreground/30 text-muted-foreground bg-secondary/10',
                          take.status === 'Reviewed' && 'border-blue-500/50 text-blue-400 bg-blue-500/5',
                          take.status === 'Locked' && 'border-green-500/50 text-green-400 bg-green-500/5'
                        )}
                      >
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
                      ref={el => {
                        sourceTextRefs.current[index] = el;
                      }}
                      defaultValue={take.original}
                      readOnly={isLocked}
                      onBlur={e => handleFieldChange(take.id, 'original', e.target.value)}
                      className={cn(
                        'h-auto text-xs min-h-[60px] select-text',
                        isLocked && 'bg-secondary/20 text-muted-foreground cursor-not-allowed border-dashed'
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Textarea
                      defaultValue={take.translation}
                      readOnly={isLocked}
                      onBlur={e => handleFieldChange(take.id, 'translation', e.target.value)}
                      className={cn(
                        'h-auto text-xs min-h-[60px] select-text',
                        isLocked && 'bg-secondary/20 text-muted-foreground cursor-not-allowed border-dashed'
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-right align-top pt-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation();
                          suggestTranslation(take);
                        }}
                        disabled={isSuggesting === take.id || isLocked}
                        title={isLocked ? 'Unlock to suggest translation' : 'Suggest Translation'}
                      >
                        <Sparkles
                          className={cn('h-4 w-4', isSuggesting === take.id && 'animate-spin')}
                        />
                      </Button>

                      {/* Dropdown actions menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" title="Actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem
                            onClick={() => openSplitDialog(index)}
                            disabled={isLocked}
                            className="cursor-pointer gap-2"
                          >
                            <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Split Take...</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onTakeMerge(index, 'prev')}
                            disabled={isLocked || index === 0 || isPrevLocked}
                            className="cursor-pointer gap-2"
                          >
                            <GitMerge className="h-3.5 w-3.5 text-muted-foreground rotate-180" />
                            <span>Merge with Previous</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onTakeMerge(index, 'next')}
                            disabled={isLocked || index === takes.length - 1 || isNextLocked}
                            className="cursor-pointer gap-2"
                          >
                            <GitMerge className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Merge with Next</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onTakeDelete(take.id)}
                            disabled={isLocked}
                            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            <span>Delete Take</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Split Take Modal Dialog */}
      <Dialog open={isSplitOpen} onOpenChange={setIsSplitOpen}>
        <DialogContent className="max-w-xl text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Split Take Segmentation</DialogTitle>
            <DialogDescription className="text-[11px]">
              Review and adjust the text split boundaries. The time code interval will be proportionally split based on text length.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Source Text splits */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                Source Part 1
              </span>
              <Textarea
                value={splitSource1}
                onChange={e => setSplitSource1(e.target.value)}
                className="h-20 text-xs"
                placeholder="First segment of source text..."
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                Source Part 2
              </span>
              <Textarea
                value={splitSource2}
                onChange={e => setSplitSource2(e.target.value)}
                className="h-20 text-xs"
                placeholder="Second segment of source text..."
              />
            </div>

            {/* Target Text splits */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                Target Part 1
              </span>
              <Textarea
                value={splitTarget1}
                onChange={e => setSplitTarget1(e.target.value)}
                className="h-20 text-xs"
                placeholder="First segment of target text..."
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                Target Part 2
              </span>
              <Textarea
                value={splitTarget2}
                onChange={e => setSplitTarget2(e.target.value)}
                className="h-20 text-xs"
                placeholder="Second segment of target text..."
              />
            </div>
          </div>

          {/* Timecode preview */}
          {splitIndex !== null && (
            <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/40 grid grid-cols-2 gap-4 text-center mt-1">
              <div>
                <span className="block text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                  Take Part 1 Timecode
                </span>
                <span className="font-mono font-semibold text-foreground text-xs mt-0.5 block">
                  {formatTimeForDisplay(splitTimePreviewStart)} -{' '}
                  {formatTimeForDisplay(splitTimePreviewMiddle)}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                  Take Part 2 Timecode
                </span>
                <span className="font-mono font-semibold text-foreground text-xs mt-0.5 block">
                  {formatTimeForDisplay(splitTimePreviewMiddle)} -{' '}
                  {formatTimeForDisplay(splitTimePreviewEnd)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsSplitOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSplitSubmit}>
              Split Take
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TakesList;
