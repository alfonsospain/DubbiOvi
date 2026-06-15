'use server';

import { ai } from '@/ai/genkit';
import { analyzeSentiment } from '@/ai/flows/sentiment-analysis-takes';
import type {
  SentimentAnalysisInput,
  SentimentAnalysisOutput,
} from '@/ai/flows/sentiment-analysis-takes';

export async function testGeminiConnection(
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: 'Respond with exactly the word "OK".',
      config: { apiKey },
    });
    if (response.text?.trim().toUpperCase().includes('OK')) {
      return { success: true };
    }
    return { success: false, error: 'Unexpected response from model.' };
  } catch (error: any) {
    console.error('Test connection failed:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function getSentiment(
  text: string,
  apiKey?: string
): Promise<SentimentAnalysisOutput | null> {
  if (!text) {
    return null;
  }
  try {
    const input: SentimentAnalysisInput = { text, apiKey };
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
  const apiKey = formData.get('apiKey') as string | null;

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
      apiKey: apiKey || undefined,
    });

    return result;
  } catch (error) {
    console.error('Error in getAudioTranscription server action:', error);
    return null;
  }
}
