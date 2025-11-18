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

const GetTranslationSuggestionInputSchema = z.object({
  originalText: z.string().describe('The original text to translate.'),
  sourceLanguage: z.string().describe('The language of the original text.'),
  targetLanguage: z.string().describe('The language to translate the text into.'),
});
export type GetTranslationSuggestionInput = z.infer<typeof GetTranslationSuggestionInputSchema>;

const GetTranslationSuggestionOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});
export type GetTranslationSuggestionOutput = z.infer<typeof GetTranslationSuggestionOutputSchema>;

export async function getTranslationSuggestion(input: GetTranslationSuggestionInput): Promise<GetTranslationSuggestionOutput> {
  return getTranslationSuggestionFlow(input);
}

const translationPrompt = ai.definePrompt({
  name: 'translationPrompt',
  input: {schema: GetTranslationSuggestionInputSchema},
  output: {schema: GetTranslationSuggestionOutputSchema},
  prompt: `You are a translation expert.
Translate the given text from {{sourceLanguage}} to {{targetLanguage}}.

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
    const {output} = await translationPrompt(input);
    return output!;
  }
);
