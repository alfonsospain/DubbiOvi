'use server';

import { analyzeSentiment } from '@/ai/flows/sentiment-analysis-takes';
import type {
  SentimentAnalysisInput,
  SentimentAnalysisOutput,
} from '@/ai/flows/sentiment-analysis-takes';

export async function getSentiment(
  text: string
): Promise<SentimentAnalysisOutput | null> {
  if (!text) {
    return null;
  }
  try {
    const input: SentimentAnalysisInput = { text };
    const result = await analyzeSentiment(input);
    return result;
  } catch (error) {
    console.error('Error in getSentiment server action:', error);
    return null;
  }
}

import { asrTranscriptionFlow } from '@/ai/flows/asr-transcription';
import type { AsrOutput } from '@/ai/flows/asr-transcription';

export async function getAudioTranscription(
  formData: FormData
): Promise<AsrOutput | null> {
  const file = formData.get('audio') as File;
  const sourceLang = formData.get('sourceLang') as string;

  if (!file) {
    console.error('getAudioTranscription: No audio file found in FormData.');
    return null;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'audio/wav';

    const result = await asrTranscriptionFlow({
      audioBase64: base64Data,
      mimeType,
      sourceLanguage: sourceLang || undefined,
    });

    return result;
  } catch (error) {
    console.error('Error in getAudioTranscription server action:', error);
    return null;
  }
}
