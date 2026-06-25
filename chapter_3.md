# Chapter 3: Ingesting & Segmenting Source Materials

## 3.1 Manual Text and Document Importation

### 3.1.1 Local File Parser Workflow
DubbiOvi features a client-side Local File Parser designed to ingest pre-existing text or script documents. This parser processes raw files entirely within the user's browser, eliminating the need to transmit source files to an external server for processing.

Users access this feature by navigating to **Import/Export -> Import -> From Script**. The parser supports two file formats:
1.  **Plain Text Files (`.txt`):** The file is processed directly using the browser's native `FileReader` API. The reader reads the file as a UTF-8 encoded string.
2.  **Microsoft Word Documents (`.docx`):** Word files are processed using the integrated **Mammoth.js** library. Mammoth extracts raw text from the document's XML structure while stripping out complex proprietary layouts, page styling, margins, and inline font sizes. The library parses the document's paragraph nodes sequentially, outputting a clean, line-break-delimited string that matches the document's structure.

---

### 3.1.2 Paragraph Segmentation and Timing Allocation Algorithms
Once a script is uploaded or pasted into the monospaced script editor textarea, the segmentation engine splits the text block into discrete timed takes using a structured parsing pipeline:

```text
[ Raw Script String ]
         │
         ▼
[ Split by Double Line Break: regex /\n\s*\n/ ]
         │
         ▼
[ Filter Empty Paragraph Blocks ]
         │
         ▼
[ For Each Paragraph: Calculate Word Count ]
         │
         ▼
[ Apply Speech Rate Formula: Max(2, WordCount / 2.5) ]
         │
         ▼
[ Generate Timecode Interval: lastEndTime -> lastEndTime + Duration ]
         │
         ▼
[ Assign Alternating Speaker Label: (index % 2) + 1 ]
         │
         ▼
[ Output Take Array (Status: 'Pending', Translation: '') ]
```

1.  **Paragraph Boundary Detection:** The parser splits the script string using a regular expression that checks for double line breaks: `/\n\s*\n/`. This separates individual paragraphs or dialogue blocks while ignoring single carriage returns within a dialogue segment.
2.  **Chronological Timing Synthesis:** Because raw scripts typically lack timecode data, DubbiOvi generates synthetic timing boundaries using a speaking-rate algorithm:
    *   The engine tracks a running timestamp, `lastEndTime`, initialized to `0.0` seconds.
    *   For each paragraph block, the engine calculates the word count by splitting the text on whitespace characters: `/\s+/`.
    *   A duration is estimated using a standard speaking rate of **2.5 words per second**:
        $$\text{Estimated Duration} = \max\left(2.0, \frac{\text{Word Count}}{2.5}\right)$$
    *   The 2.0-second minimum duration threshold ensures that even short single-word dialogue segments (e.g., "Yes," or "No.") remain on screen long enough to be readable as subtitles.
    *   The segment's start time is set to the current value of `lastEndTime`, and the end time is set to `startTime + Estimated Duration`.
    *   The `lastEndTime` tracker is then updated to the segment's end time, ensuring that all takes are arranged end-to-end with no timing gaps or overlays.
3.  **Speaker Allocation:** The engine assigns speaker labels automatically using an alternating index formula:
    $$\text{Speaker Label} = \text{"Speaker "} \times \left((\text{index} \bmod 2) + 1\right)$$
    This alternates between `Speaker 1` and `Speaker 2` for sequential paragraphs. Users can modify these speaker names in the Takes list.
4.  **Data Initialization:** Each take is assigned a unique UUID v4 string, a default status of `'Pending'`, an empty translation string, and an empty notes field. The new take array is then updated in the workspace state and synchronized with local storage.

---

## 3.2 Automated AI Transcription (ASR)

### 3.2.1 Audio Language Selection and Processing Configuration
For video files containing spoken dialogue, DubbiOvi provides an Automatic Speech Recognition (ASR) workflow powered by Google's Gemini 2.5 Flash model. This workflow transcribes the audio track and generates synchronized, speaker-separated takes.

To configure the transcription, the user selects the target language from the **Spoken Audio Language** dropdown menu in the **AI Transcribe** tab:
*   **Auto-Detect Language (AI):** The system passes an `Auto-Detect` instruction to the Gemini model. The model identifies the dominant spoken language in the audio track and outputs the transcript in that language.
*   **Manual Language Selection:** The user can select a specific language (e.g., English, Spanish, French, German) from the `SUPPORTED_LANGUAGES` database. Specifying the language in advance improves transcription accuracy and spelling for bilingual videos or speakers with strong accents.

---

### 3.2.2 Client-Side Audio Extraction and Downsampling
To transcribe video files locally, DubbiOvi extracts and downsamples the audio track within the user's browser, preventing network bottlenecks and preserving server-side memory:

1.  **Accessing the Audio Context:** When the transcription is initiated, the application creates a web-standard `AudioContext` instance configured to run asynchronously in the browser thread.
2.  **Binary Extraction:** The video file is read into memory as an `ArrayBuffer`. The application passes this buffer to the browser's audio decoding engine via `AudioContext.decodeAudioData()`. This utility decodes compressed audio formats (such as AAC, MP3, or Opus) into a raw multi-channel PCM audio buffer.
3.  **Sample Rate Downsampling:** Because high-fidelity audio is not required for speech-to-text processing, the decoded audio data is downsampled to **16,000 Hz mono PCM**. The downsampling utility interpolates the raw audio samples, converting multi-channel, 44.1kHz or 48kHz audio into a single voice channel. This reduces the audio file size by up to 90%.
4.  **WAV Header Construction:** The downsampled 16kHz mono audio is packaged into a standard RIFF/WAV file. The system generates a 44-byte binary header specifying:
    *   RIFF chunk identifier.
    *   PCM format tag (`1` for uncompressed linear PCM).
    *   Channel count (`1` for mono).
    *   Sample rate (`16000`).
    *   Byte rate ($16000 \text{ samples/sec} \times 2 \text{ bytes/sample} = 32000 \text{ bytes/sec}$).
    *   Block align ($1 \text{ channel} \times 2 \text{ bytes/sample} = 2 \text{ bytes}$).
    *   Bits per sample (`16`).
5.  **Blob Packaging:** The binary header and the PCM audio samples are combined into a single binary Blob with the MIME type `audio/wav`.

---

### 3.2.3 Server-Side ASR Processing and Response Mapping
Once the WAV blob is generated, it is processed through a server-side action pipeline:

1.  **Payload Dispatch:** The client packages the WAV blob, the language setting, and the user's Gemini API key into a `FormData` object. The payload is sent to the server-side action `getAudioTranscription`.
2.  **Server Action Execution:** The server action runs in a Node.js context. It converts the WAV file to a Base64-encoded string and calls the Genkit flow `asrTranscriptionFlow`.
3.  **LLM Transcription:** The Genkit flow sends the audio to the Gemini 2.5 Flash model. The request includes a system instruction prompting the model to identify dialogue segments and return a structured JSON object matching the following Zod schema:

```typescript
interface AsrOutput {
  detectedLanguage: string;
  takes: Array<{
    character: string;
    original: string;
    startSeconds: number;
    endSeconds: number;
  }>;
}
```

4.  **Client-Side Mapping:** When the server action returns the JSON output, the client maps the segments to the DubbiOvi Take structure:
    *   Each take is assigned a unique UUID v4.
    *   Start and end times are formatted into a timecode string: `MM:SS.ms --> MM:SS.ms`.
    *   The speaker label is mapped to the `character` field, the transcription text to `original`, and `translation` and `notes` are initialized as empty strings.
    *   The workflow status is set to `'Pending'`.
5.  **Workspace Update:** The takes are imported into the workspace, updating the Takes list and the timeline view. The application displays a toast notification confirming the import: `ASR Transcription Complete: Successfully generated X takes. Detected language: Y`.

---

### 3.2.4 Safeguards and Validation Rules
To prevent API errors and poor transcription results, the ASR panel enforces several validation checks:

*   **Gemini API Key Check:** If no API key is saved in the browser's local storage, the ASR panel displays an amber warning banner:
    > [!IMPORTANT]
    > **Missing Gemini API Key:** To use AI transcription and translation, please configure your Gemini API key in the **Settings** tab.
    The transcription button is disabled until a key is saved.
*   **Video Ingest Check:** If no video file is loaded in the player, the ASR panel disables the transcription button and displays the warning: `⚠️ Please load a video file in the Video Player to start transcription.`
*   **Real-Time Status Indicators:** During the transcription process, the application disables the language selector and the import buttons, replacing them with a loading indicator that updates the user on the progress of the operation:
    *   `Extracting audio track from video...` (Client-side decoding and WAV extraction).
    *   `Analyzing speech with Gemini AI...` (Server-side Genkit flow execution).
    *   `Syncing takes to project database...` (Importing returned JSON data into workspace state).
