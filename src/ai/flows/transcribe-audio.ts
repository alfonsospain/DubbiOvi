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
      "The audio or video file to transcribe, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
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

const transcriptionPrompt = ai.definePrompt({
  name: 'transcriptionPrompt',
  input: { schema: TranscribeAudioInputSchema },
  output: { schema: TranscribeAudioOutputSchema },
  prompt: `You are an expert transcriptionist.
Your task is to provide a highly accurate transcription of the audio.
You must identify the different speakers and label them with a unique speaker number.
You must provide start and end timestamps for each segment of speech.
Group the segments by speaker.

The output must be in JSON format.`,
});


const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    const { output } = await transcriptionPrompt(input, {
        model: 'googleai/gemini-1.5-pro-latest'
    });
    
    if (!output) {
      return { segments: [] };
    }

    // Post-processing to merge segments from the same speaker that are consecutive or close together
    const mergedSegments: z.infer<typeof SegmentSchema>[] = [];
    if (output.segments && output.segments.length > 0) {
      // Sort segments by start time to be safe
      const sortedSegments = output.segments.sort((a, b) => a.start - b.start);
      
      let currentSegment: z.infer<typeof SegmentSchema> | null = null;
      
      for(const segment of sortedSegments) {
        if(!currentSegment) {
          currentSegment = {...segment};
          continue;
        }

        // If same speaker and gap is small (e.g., less than 0.5s), merge
        if(currentSegment.speaker === segment.speaker && (segment.start - currentSegment.end) < 0.5) {
          currentSegment.text += ` ${segment.text}`;
          currentSegment.end = segment.end;
        } else {
          // Different speaker or large gap, push current segment and start a new one
          mergedSegments.push(currentSegment);
          currentSegment = {...segment};
        }
      }
      // Push the last segment
      if(currentSegment) {
        mergedSegments.push(currentSegment);
      }
    }
    
    return { segments: mergedSegments };
  }
);
