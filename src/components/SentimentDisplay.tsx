'use client';

import React, { useState, useEffect } from 'react';
import { getSentiment } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SentimentAnalysisOutput } from '@/ai/flows/sentiment-analysis-takes';

interface SentimentDisplayProps {
  text: string;
}

const SentimentDisplay: React.FC<SentimentDisplayProps> = ({ text }) => {
  const [sentiment, setSentiment] = useState<SentimentAnalysisOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyze = async () => {
      if (!text) {
        setSentiment(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const result = await getSentiment(text);
        setSentiment(result);
      } catch (error) {
        console.error('Failed to get sentiment', error);
        setSentiment(null);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(analyze, 500); // Debounce API call
    return () => clearTimeout(timeoutId);
  }, [text]);

  if (isLoading) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    );
  }

  if (!sentiment) {
    return null;
  }

  const sentimentColor =
    sentiment.score > 0.3
      ? 'bg-green-500'
      : sentiment.score < -0.3
      ? 'bg-red-500'
      : 'bg-yellow-500';

  const progressValue = (sentiment.score + 1) * 50;

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <Badge variant="outline" className="capitalize">
        {sentiment.sentiment}
      </Badge>
      <Progress value={progressValue} className="h-2 w-full [&>*]:bg-primary/50" />
    </div>
  );
};

export default SentimentDisplay;
