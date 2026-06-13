# ASR MVP INTEGRATION REPORT: Dubbing Studio Pro (DubiOvi)

This report details the integration plan for introducing Automatic Speech Recognition (ASR) into the `feature-asr` branch of **DubiOvi** using **Gemini 2.5 Flash** via the **Genkit** AI framework.

---

## 1. Files to Modify & Create

We will create and modify the following files without breaking existing video or document importing, settings configuration, or Firestore schemas.

### 1.1. New Files to Create

#### 1. [src/lib/audio-utils.ts](file:///Users/alfonso/Desktop/DubiOvi/src/lib/audio-utils.ts)
- **Role**: Client-side audio processing.
- **Functionality**:
  - Decodes the local video file's audio track via browser `AudioContext.decodeAudioData()`.
  - Uses an `OfflineAudioContext` to downsample the decoded audio to **16kHz mono** (reducing payload size significantly).
  - Encodes the raw PCM data into a standard **16-bit mono WAV** file container with a proper 44-byte header.
  - Returns a browser `Blob` (`audio/wav`) ready for server upload.

#### 2. [src/ai/flows/asr-transcription.ts](file:///Users/alfonso/Desktop/DubiOvi/src/ai/flows/asr-transcription.ts)
- **Role**: Server-side Genkit flow.
- **Functionality**:
  - Registers the `asrTranscriptionFlow` in Genkit.
  - Validates inputs (audio data base64, MIME type, source language selection) and enforces structured outputs using a Zod schema (`AsrOutputSchema`).
  - Calls `googleai/gemini-2.5-flash` with the audio data passed as an inline media attachment.
  - Directs Gemini to auto-detect language, identify speakers contextually, and split dialogue into takes based on pauses.

---

### 1.2. Existing Files to Modify

#### 3. [src/app/actions.ts](file:///Users/alfonso/Desktop/DubiOvi/src/app/actions.ts)
- **Role**: Next.js Server Action wrapper.
- **Modifications**:
  - Add the `getAudioTranscription` server action:
    ```typescript
    export async function getAudioTranscription(formData: FormData): Promise<AsrOutput | null>;
    ```
  - Reads the WAV file and `sourceLanguage` from the `FormData` object, converts the file to a base64 string, and executes the Genkit flow.

#### 4. [src/ai/dev.ts](file:///Users/alfonso/Desktop/DubiOvi/src/ai/dev.ts)
- **Role**: Genkit development UI registers.
- **Modifications**:
  - Import `src/ai/flows/asr-transcription.ts` to expose the flow inside the Genkit developer interface.

#### 5. [src/app/page.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/app/page.tsx)
- **Role**: Coordinative layout state.
- **Modifications**:
  - Pass the state variables `videoFile` (which holds the uploaded local `File` object) and `settings.sourceLang` down to the `ImportExportPanel` component.

#### 6. [src/components/ImportExportPanel.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/ImportExportPanel.tsx)
- **Role**: Data import panels.
- **Modifications**:
  - Accept `videoFile?: File | null` and `defaultSourceLang?: string` as props.
  - Add an **"AI Transcribe"** tab under the import sub-tabs.
  - Implement a selector for languages (Auto-Detect, English, Spanish, etc.) and a `"Transcribe Video Audio"` action button.
  - Implement the loading state overlay with step indicators: `"Extracting audio track..."` $\rightarrow$ `"Running speech recognition..."` $\rightarrow$ `"Syncing takes..."`.
  - Handle importing by passing the received takes array to the existing `onImport` callback.

---

## 2. System Architecture & Data Flows

### 2.1. Client-Side UI & Audio Flow
```text
[ Select Video File ] ──> stored in `videoFile` state (page.tsx)
                                │
                                ▼
[ Import/Export Tab ] ──> reads `videoFile`
                                │
                                ▼
Web Audio API Decoder ──> downsamples to 16kHz mono PCM (audio-utils.ts)
                                │
                                ▼
WAV Encoder           ──> outputs Blob (audio/wav)
                                │
                                ▼
FormData Packager     ──> appends Blob + Language choice
                                │
                                ▼
[ Next.js Server Action ]
```

### 2.2. Server-Side AI Flow
```text
[ getAudioTranscription ] (actions.ts)
           │
           ▼ (reads FormData)
Convert Blob -> Base64
           │
           ▼
Genkit asrTranscriptionFlow (asr-transcription.ts)
           │
           ▼ (Gemini 2.5 Flash API call)
Structured JSON output validated via Zod Schema
           │
           ▼ (returns to Client)
[ onImport(takes) ]   ──> calls handleTakesChange (page.tsx)
                                │
                                ▼
Real-time Firestore Sync & UI grid render update
```

---

## 3. Detailed Server Integration Specifications

### 3.1. Genkit Flow & Prompts (`asr-transcription.ts`)
```typescript
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AsrInputSchema = z.object({
  audioBase64: z.string(),
  mimeType: z.string(),
  sourceLanguage: z.string().optional(),
});

export const AsrOutputSchema = z.object({
  detectedLanguage: z.string().describe('ISO-2 language code (e.g. EN, ES)'),
  takes: z.array(z.object({
    character: z.string().describe('Name of character or generic identifier'),
    startSeconds: z.number().describe('Start time in seconds (decimal)'),
    endSeconds: z.number().describe('End time in seconds (decimal)'),
    original: z.string().describe('Spoken dialogue transcript')
  }))
});

export const asrTranscriptionFlow = ai.defineFlow(
  {
    name: 'asrTranscriptionFlow',
    inputSchema: AsrInputSchema,
    outputSchema: AsrOutputSchema,
  },
  async (input) => {
    // Invoke Gemini 2.5 Flash model, passing audio base64 as an inline attachment
    // Verify results and return structured takes data
  }
);
```

### 3.2. Structured Response Prompt Structure
We will supply instructions to Gemini via Genkit:
```text
You are an expert audiovisual transcription assistant.
Analyze the attached audio and generate a timestamped transcript.

Constraints:
1. Spoken Language: If 'sourceLanguage' is "Auto-Detect", identify the language and return it. Otherwise, assume 'sourceLanguage'.
2. Speaker Identification: Identify speakers contextually by name or generic tag.
3. Take Segmentation: Split transcript into takes. No take may exceed 10.0 seconds. Split on pauses longer than 1.5 seconds.
```

---

## 4. Risks & Mitigation Strategies

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Server Timeout** | High. Server Actions timeout after 60s. | Limit video duration to 15 minutes max for ASR processing. Downsample to 16kHz mono to minimize processing overhead. |
| **Browser Out of Memory** | Medium. Decoding large audio files in-browser consumes RAM. | Standardize browser-native garbage collection on arrays and audio buffers immediately after extraction. |
| **Generative Drift** | Low. Gemini timestamps can occasionally float/drift. | Explain in tooltips that timestamps are approximate and easily adjusted inside the timeline editor. |
| **Empty Audio Track** | Medium. Videos without audio tracks or with unreadable codecs. | Validate audio channel count and raise a clean client-side Toast if decoding fails. |

---

## 5. Estimated Effort

- **Step 1: Audio Processing (`audio-utils.ts`)**: 2 Hours.
- **Step 2: Genkit Setup (`asr-transcription.ts` & actions)**: 2 Hours.
- **Step 3: Frontend Integration (`ImportExportPanel.tsx`)**: 2 Hours.
- **Step 4: Quality & Build Validation**: 1 Hour.
- **Total Estimated Effort**: **7 Hours**.
