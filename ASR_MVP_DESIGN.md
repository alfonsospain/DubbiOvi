# ASR MVP DESIGN: Gemini Multimodal Transcription

This document outlines the detailed system design for implementing an Automatic Speech Recognition (ASR) feature in **DubiOvi** using **Gemini 2.5 Flash** as the multimodal transcription engine.

---

## 1. User Experience Step-by-Step

```text
[ Load Video ] ──> [ Select 'AI Transcribe' Tab ] ──> [ Click 'Transcribe Audio' ]
                                                                │
                                                                ▼
[ Takes Table Populated ] <── [ Takes Synced to DB ] <── [ Audio Sent to Gemini ]
```

1. **Load Video**: The user loads a local video file into the player.
2. **Open ASR Panel**: The user navigates to the **Import/Export** panel and selects the **AI Transcribe** tab.
3. **Select Language**: The user selects the video's spoken language from a dropdown, or leaves it as the default **"Auto-Detect Language (AI)"**.
4. **Trigger Transcription**: The user clicks the **"Transcribe Audio"** button.
5. **In-Browser Processing**:
   - The UI shows a progress overlay: `"Extracting audio track from video..."`.
   - The app uses the browser's Web Audio API to decode the audio track, convert it to mono, downsample it to 16kHz, and render a lightweight WAV blob.
6. **Server Processing**:
   - The progress state updates: `"Analyzing speech with Gemini AI..."`.
   - The WAV blob is sent to a server action, which loads it as an inline part and triggers the Genkit ASR flow.
7. **Grid Population**:
   - The server returns a structured JSON list of segmented takes.
   - The client generates UUIDs, formats the timing strings, and overwrites the project's Firestore takes collection.
   - The **Takes** grid and **Timeline** instantly update with the transcribed audio segments.

---

## 2. Required UI Changes

### 2.1. Import/Export Panel Tabs
Add a new sub-tab **"AI Transcribe"** next to the existing **"From Script"** and **"From JSON"** tabs:
- **Language Selector**: A dropdown to choose the source language, referencing `SUPPORTED_LANGUAGES` + an `"Auto-Detect"` option.
- **Action Button**: `"Transcribe Video Audio"` (disabled if no video is loaded in the player).
- **Progress Indicator**: A text label and spinner showing the active processing state.

### 2.2. Timeline Playhead State
While ASR is running, show a loading placeholder over the timeline: `"Awaiting Transcription Timecodes..."`.

---

## 3. Required Database Changes

**None.**
Because Gemini will be forced to return a structured output matching the properties of the existing `Take` schema, the result integrates into the existing Firestore collections `/projects/{projectId}/takes` and `/projects/{projectId}/glossary` without changing the database layout.

---

## 4. Prompt Engineering Strategy

Genkit will call the Gemini 2.5 Flash model, passing the audio blob as an inline MIME attachment. We will use Gemini's structured output capability (`responseSchema`) to enforce a Zod schema.

### 4.1. Prompt Template
```handlebars
You are an expert audiovisual localization and transcription assistant.
Analyze the attached audio track and generate a timestamped transcript.

Follow these strict constraints:
1. Spoken Language:
   - If the input language is set to "Auto-Detect", identify the primary language spoken in the audio and return its ISO-2 code in the "detectedLanguage" field.
   - Otherwise, transcribe the audio assuming the language is {{sourceLanguage}}.

2. Speaker Identification:
   - Analyze the voice characteristics, tones, and context to differentiate speakers.
   - If a speaker's name or title is clear from the context (e.g., "Judge", "Prosecutor", "Defendant"), use it in the "character" field.
   - Otherwise, use a generic tag (e.g., "Speaker 1", "Speaker 2").

3. Take Segmentation & Timestamps:
   - Segment the text into logical, short "takes" of dialogue.
   - Each take should represent a single sentence or logical clause.
   - Do NOT let any single take exceed 10.0 seconds of audio.
   - Create a split whenever a pause longer than 1.5 seconds is detected.
   - The timestamps "startSeconds" and "endSeconds" must correspond to the exact boundaries of the spoken audio block.
```

### 4.2. Genkit Zod Schema Integration
```typescript
import { z } from 'genkit';

const AsrOutputSchema = z.object({
  detectedLanguage: z.string().describe('The detected ISO-2 language code (e.g., EN, ES)'),
  takes: z.array(z.object({
    character: z.string().describe('Speaker identity or name'),
    startSeconds: z.number().describe('Start time in seconds (decimal)'),
    endSeconds: z.number().describe('End time in seconds (decimal)'),
    original: z.string().describe('The transcription text of the spoken dialogue')
  }))
});
```

---

## 5. Expected Output JSON Structure

When Gemini processes the prompt, it returns the following JSON schema:
```json
{
  "detectedLanguage": "EN",
  "takes": [
    {
      "character": "Judge",
      "startSeconds": 2.05,
      "endSeconds": 6.42,
      "original": "Members of the jury, you must now retire to consider your verdict."
    },
    {
      "character": "Defense Lawyer",
      "startSeconds": 7.1,
      "endSeconds": 11.95,
      "original": "Remember that doubt, any reasonable doubt, must always benefit the defendant."
    }
  ]
}
```

---

## 6. Error Handling

1. **Client Audio Extraction Failure**:
   - *Cause*: Browser does not support the video's audio codec.
   - *Handling*: Show a toast error: `"Audio extraction failed. Please convert your video to a standard MP4 with AAC audio, or paste a text script instead."`
2. **Payload Size Limitation**:
   - *Cause*: Video files are too large to process.
   - *Handling*: The client-side downsampling to 16kHz mono WAV ensures the payload is small (e.g., ~1MB per minute of audio). The UI blocks any requests for video audio track extractions longer than 20 minutes in Version 1.0.
3. **Structured JSON Fallback**:
   - *Cause*: Gemini fails to output valid JSON.
   - *Handling*: Genkit handles JSON schema validation out-of-the-box and will automatically raise a parsing error if fields are missing. The server action catches this and alerts the user: `"AI transcription formatting error. Please try again."`

---

## 7. Performance Considerations

- **Server Timeout**: Serverless actions have a maximum execution duration (typically 60 seconds on Firebase App Hosting / Vercel). To guarantee calls complete within this window, the video duration is restricted to a maximum of 15 minutes for ASR processing.
- **Bandwidth Savings**: Compressing the audio to mono WAV 16kHz at the client-side keeps upload speeds fast, even on slow classroom networks.

---

## 8. Integration with Translation Workflow

Once the generated takes are populated:
1. The source text (`original` field) is written to the Firestore `takes` collection.
2. The user can open the **Takes** tab, click **Suggest Translation** (Sparkles icon), and translation suggestions will populate the target column normally.
3. If glossary terms are defined, they are applied to the generated translation automatically.
4. The timeline updates color-coded take blocks, allowing the user to click takes, play the video, and manually refine the timing boundaries.

---

## 9. Classroom & Open-Source Friendly Implementation

To keep the application easy to deploy in university environments:
- **Shared API Key**: The ASR workflow relies on the same `GEMINI_API_KEY` already configured for the translation assistant. No additional services (like GCP Service Accounts, speech APIs, or storage buckets) are needed.
- **Zero Local Dependencies**: In-browser audio decoding utilizes the built-in Web Audio API, which works natively on Chrome, Firefox, Safari, and Edge without installing local tools like `ffmpeg` or Python runtimes.
- **Single Host Deployment**: The entire project can be hosted on Firebase App Hosting securely, making it simple for university labs to self-host their own instance.
