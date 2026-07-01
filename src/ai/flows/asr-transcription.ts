'use server';

/**
 * @fileOverview AI-powered speech recognition transcription flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AsrInputSchema = z.object({
  audioBase64: z.string().describe('Base64 encoded WAV audio data.'),
  mimeType: z.string().describe('MIME type of the audio data (e.g. audio/wav).'),
  sourceLanguage: z.string().optional().describe('Source language or "Auto-Detect".'),
  apiKey: z.string().optional().describe('User provided Gemini API key.'),
});

const AsrOutputSchema = z.object({
  detectedLanguage: z.string().describe('The ISO-2 language code detected (e.g. EN, ES).'),
  takes: z.array(
    z.object({
      character: z.string().describe('Speaker identity or name.'),
      startTime: z.string().describe('Start time in HH:MM:SS.mmm format.'),
      endTime: z.string().describe('End time in HH:MM:SS.mmm format.'),
      original: z.string().describe('Transcription text in the source language.'),
    })
  ),
});

export type AsrInput = z.infer<typeof AsrInputSchema>;
export type AsrOutput = z.infer<typeof AsrOutputSchema>;

export const asrTranscriptionFlow = ai.defineFlow(
  {
    name: 'asrTranscriptionFlow',
    inputSchema: AsrInputSchema,
    outputSchema: AsrOutputSchema,
  },
  async (input) => {
    const languageInstruction = input.sourceLanguage && input.sourceLanguage !== 'Auto-Detect'
      ? `Assume the spoken language is "${input.sourceLanguage}" for transcription, and output "${input.sourceLanguage}" in the "detectedLanguage" field.`
      : `Auto-detect the primary language spoken and output its ISO-2 code (e.g., EN, ES, FR, DE, JA, ZH) in the "detectedLanguage" field.`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        {
          text: `You are an expert audiovisual transcription assistant.
Analyze the attached audio track and generate a structured, timestamped transcript of the spoken dialogue.

Constraints:
1. Spoken Language:
   ${languageInstruction}
   
2. Speaker Identification:
   - Analyze voice characteristics, tones, and context to differentiate speakers.
   - If a speaker's name or title is clear from the context (e.g., "Judge", "Prosecutor", "Defense Lawyer", "Defendant"), use it in the "character" field.
   - Otherwise, use a generic speaker tag (e.g., "Speaker 1", "Speaker 2").
   
3. Take Segmentation & Timestamps:
   - Segment the text into logical, short "takes" of dialogue.
   - Each take should represent a single sentence or logical clause.
   - Do NOT let any single take exceed 10.0 seconds of audio.
   - Create a split whenever a pause longer than 1.5 seconds is detected.
   - The timestamps "startTime" and "endTime" must correspond to the exact boundaries of the spoken audio block.
   - You MUST format these timestamps strictly as strings in the "HH:MM:SS.mmm" format (e.g. "00:00:03.250", "00:07:12.430", "00:19:45.120"). Do NOT return them as numbers, and do not omit any parts of the timecode.`
        },
        {
          media: {
            url: `data:${input.mimeType};base64,${input.audioBase64}`,
            contentType: input.mimeType,
          }
        }
      ],
      config: input.apiKey ? { apiKey: input.apiKey } : {},
      output: { schema: AsrOutputSchema },
    });

    if (!response.output) {
      throw new Error('ASR Flow failed: Model did not generate structured output.');
    }

    return response.output;
  }
);
