'use server';
/**
 * @fileOverview AI-powered translation suggestions flow.
 *
 * - getTranslationSuggestion - A function that returns a translation suggestion.
 * - GetTranslationSuggestionInput - The input type for the getTranslationSuggestion function.
 * - GetTranslationSuggestionOutput - The return type for the getTranslationSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GlossaryEntry } from '@/lib/types';

const GlossaryEntrySchema = z.object({
  id: z.string(),
  sourceTerm: z.string(),
  targetTerm: z.string(),
  notes: z.string().optional(),
});

const GetTranslationSuggestionInputSchema = z.object({
  originalText: z.string().describe('The original text to translate.'),
  sourceLanguage: z.string().describe('The language of the original text.'),
  targetLanguage: z.string().describe('The language to translate the text into.'),
  glossary: z.array(GlossaryEntrySchema).optional().describe('A list of glossary terms to ensure consistent translation.'),
  apiKey: z.string().optional().describe('User provided Gemini API key.'),
});
export type GetTranslationSuggestionInput = z.infer<typeof GetTranslationSuggestionInputSchema>;

const GetTranslationSuggestionOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});
export type GetTranslationSuggestionOutput = z.infer<typeof GetTranslationSuggestionOutputSchema>;

export async function getTranslationSuggestion(input: GetTranslationSuggestionInput): Promise<GetTranslationSuggestionOutput> {
  const activeKey = input.apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || undefined;
  return getTranslationSuggestionFlow({
    ...input,
    apiKey: activeKey,
  });
}

const translationPrompt = ai.definePrompt({
  name: 'translationPrompt',
  input: {schema: GetTranslationSuggestionInputSchema},
  output: {schema: GetTranslationSuggestionOutputSchema},
  prompt: `You are a translation expert.
Translate the given text from {{sourceLanguage}} to {{targetLanguage}}.

{{#if glossary}}
You MUST use the following glossary to ensure consistency.
Glossary:
{{#each glossary}}
- "{{sourceTerm}}" must be translated as "{{targetTerm}}"
{{/each}}
{{/if}}

Original text: {{{originalText}}}
Translation:`,
});

const getTranslationSuggestionFlow = ai.defineFlow(
  {
    name: 'getTranslationSuggestionFlow',
    inputSchema: GetTranslationSuggestionInputSchema,
    outputSchema: GetTranslationSuggestionOutputSchema,
  },
  async input => {
    const {output} = await translationPrompt(
      {
        originalText: input.originalText,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        glossary: input.glossary,
      },
      input.apiKey ? { config: { apiKey: input.apiKey } } : {}
    );
    
    if (!output) {
      return { translation: "" };
    }

    // Secondary check to apply glossary, as LLMs can sometimes ignore prompt instructions
    let translatedText = output.translation;
    if (input.glossary) {
      for (const entry of input.glossary) {
        // Use a case-insensitive regex to replace all occurrences of the source term
        const regex = new RegExp(`\\b${entry.sourceTerm}\\b`, 'gi');
        translatedText = translatedText.replace(regex, entry.targetTerm);
      }
    }

    return { translation: translatedText };
  }
);
