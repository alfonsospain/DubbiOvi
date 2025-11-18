'use server';
/**
 * @fileOverview Audio transcription flow using Genkit and Google AI.
 *
 * - transcribeAudio - Transcribes an audio file and returns segments with timestamps and speaker diarization.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio file to transcribe, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const SegmentSchema = z.object({
  text: z.string().describe('The transcribed text for this segment.'),
  start: z.number().describe('The start time of the segment in seconds.'),
  end: z.number().describe('The end time of the segment in seconds.'),
  speaker: z.number().describe('The identified speaker for this segment.'),
});

const TranscribeAudioOutputSchema = z.object({
  segments: z
    .array(SegmentSchema)
    .describe(
      'An array of transcribed segments, including text, timestamps, and speaker tags.'
    ),
});
export type TranscribeAudioOutput = z.infer<
  typeof TranscribeAudioOutputSchema
>;

export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-transcription',
      prompt: [
        {
          media: {
            url: input.audioDataUri,
          },
        },
        {
          text: 'Transcribe this audio. Enable speaker diarization.',
        }
      ],
      config: {
        recognitionConfig: {
          enableSpeakerDiarization: true,
        },
        responseMimeType: 'application/json',
      },
    });

    if (!output || typeof output !== 'object' || !('results' in output)) {
        throw new Error('Invalid transcription response from the model.');
    }

    const typedOutput = output as { results: { alternatives: { transcript: string; words: { startTime: string, endTime: string, word: string, speaker: number }[] }[] }[] };

    const segments: z.infer<typeof SegmentSchema>[] = [];
    if (typedOutput.results && typedOutput.results.length > 0) {
      typedOutput.results.forEach(result => {
        if(result.alternatives && result.alternatives.length > 0) {
            const firstAlternative = result.alternatives[0];
            if(firstAlternative.words && firstAlternative.words.length > 0) {
                let currentSegment: z.infer<typeof SegmentSchema> | null = null;

                firstAlternative.words.forEach(wordInfo => {
                    const startTime = parseFloat(wordInfo.startTime.replace('s', ''));
                    const endTime = parseFloat(wordInfo.endTime.replace('s', ''));

                    if (!currentSegment || currentSegment.speaker !== wordInfo.speaker) {
                        if (currentSegment) {
                            segments.push(currentSegment);
                        }
                        currentSegment = {
                            text: wordInfo.word,
                            start: startTime,
                            end: endTime,
                            speaker: wordInfo.speaker,
                        };
                    } else {
                        currentSegment.text += ` ${wordInfo.word}`;
                        currentSegment.end = endTime;
                    }
                });
                if (currentSegment) {
                    segments.push(currentSegment);
                }
            }
        }
      });
    }

    return { segments };
  }
);
