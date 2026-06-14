# AUTOMATIC SPEECH RECOGNITION (ASR) PLAN: Dubbing Studio Pro

This plan details the implementation strategy for introducing Automatic Speech Recognition (ASR) to **DubiOvi**, enabling students and professionals to automatically transcribe uploaded videos and sync them as editable takes.

---

## 1. Desired User Workflow

```text
[ Upload Video ] ──> [ Client-Side Audio Extraction ] ──> [ Language Detection ]
                                                                   │
                                                                   ▼
[ Populate Takes Grid ] <── [ Segmenting Takes ] <── [ Generate Timestamped Script ]
```

1. **Upload Video**: The user uploads a video file (`.mp4`, `.mov`, `.webm`) into the local player.
2. **Audio Extraction**: The application automatically extracts the audio track in-browser to a compressed format (e.g., MP3 or lightweight WAV) to reduce payload size.
3. **Auto-Detection**: The system detects the spoken language.
4. **Transcription**: An ASR model transcribes the speech with start/end timecodes.
5. **Segmentation**: The transcript is parsed and segmented into discrete "takes" (lines of dialogue).
6. **Populate Original**: The generated takes are written to the `original` column in the database and displayed in the workspace grid.
7. **Translate**: The user can run Gemini suggestions to translate the transcript into the target language.
8. **Post-Edit**: The user reviews, plays, and fine-tunes the text and timecodes.
9. **Export**: The final translation is exported as SRT, VTT, TXT, or JSON.

---

## 2. Technology Evaluations

We evaluate three primary technologies for transcribing the extracted audio:

### Option A: OpenAI Whisper
* **Architecture**:
  - *Local (WASM)*: Runs in-browser via WebAssembly (`whisper.wasm`) or ONNX runtime.
  - *Server-Side*: Next.js server forwards the audio file to the OpenAI Audio API (`v1/audio/transcriptions`).
* **Implementation Complexity**:
  - *Local*: **High**. Managing multi-threading, loading large model files (75MB+ for base/tiny models), and processing audio buffers in-browser.
  - *Server*: **Low**. Standard API fetch request.
* **Hosting Requirements**:
  - *Local*: None (static files).
  - *Server*: Standard serverless Node runtime.
* **Costs**:
  - *Local*: $0 (Free).
  - *Server*: $0.006 / minute of audio.
* **Multilingual Support**: Excellent (especially for larger models; WASM is limited to smaller models with lower accuracy for minor languages).
* **Timestamp Quality**: High (segment-level or word-level).
* **Speaker Detection**: Basic. Whisper does not provide native speaker diarization out-of-the-box (requires additional models like PyAnnote).
* **University Deployment**: Great for WASM (no API keys required). Server-side requires managing API limits and keys.
* **Research Suitability**: High (reproducible, deterministic models).
* **Open-Source Distribution**: Excellent.

---

### Option B: Google Cloud Speech-to-Text (STT)
* **Architecture**: Next.js server uploads audio to Firebase Storage and initiates a request to the Google Cloud Speech-to-Text API.
* **Implementation Complexity**: **Medium-High**. Requires setting up GCP service accounts, IAM credentials, handling GCS buckets, and integrating the `@google-cloud/speech` SDK.
* **Hosting Requirements**: Requires serverless Node runtime and GCS storage integration.
* **Costs**: Standard rate is $0.024 / minute ($0.016 / minute with data logging). First 60 minutes/month are free.
* **Multilingual Support**: Excellent (supports over 125 languages and variants).
* **Timestamp Quality**: Frame-perfect. Provides word-level start and end times.
* **Speaker Detection**: Excellent. Supports native speaker diarization (tagging speaker IDs).
* **University Deployment**: Complex. Requires setting up GCP billing projects, which is difficult for classroom distributions.
* **Research Suitability**: High (highly stable, industry-grade accuracy).
* **Open-Source Distribution**: Medium (complex environment configuration for third-party forks).

---

### Option C: Gemini Multimodal Transcription (Genkit)
* **Architecture**: Next.js server reads the audio file and sends it directly to the Gemini 2.5 Flash API as a multimodal input part, requesting a structured JSON transcription in the prompt.
* **Implementation Complexity**: **Low**. Already integrated with Genkit. No new SDKs or service accounts are required; uses the existing `GEMINI_API_KEY`.
* **Hosting Requirements**: Standard App Hosting Node runtime.
* **Costs**: $0.075 / 1M input tokens + $0.30 / 1M output tokens. A 10-minute audio file translates to ~150k tokens, costing ~$0.015 per file (highly cost-effective).
* **Multilingual Support**: Outstanding. Gemini handles multilingual transcription, cross-translation, and slang interpretation out-of-the-box.
* **Timestamp Quality**: Medium. Generated via text inference (prompted to output `[MM:SS]`). It is prone to minor timing drift and hallucinations compared to specialized acoustic models.
* **Speaker Detection**: Excellent. Gemini contextually recognizes voices and can assign descriptive names (e.g., "Judge", "Lawyer") based on what they say, rather than just "Speaker 1".
* **University Deployment**: Excellent. Uses the same key and workspace configuration already established for the translation modules.
* **Research Suitability**: Medium (LLM generation is non-deterministic; timestamps may vary across runs).
* **Open-Source Distribution**: Excellent.

---

## 3. Technology Comparison Matrix

| Criteria | Option A (Whisper API) | Option B (Google STT) | Option C (Gemini Multimodal) |
| :--- | :--- | :--- | :--- |
| **Complexity** | Low | High | **Very Low** |
| **Hosting Setup** | API key only | Service Account + IAM | **API key only** |
| **Speaker Diarization**| No | **Yes (Numeric)** | **Yes (Contextual Names)** |
| **Timestamp Precision**| High | **Excellent** | Medium |
| **Multilingual** | Excellent | Excellent | **Outstanding** |
| **University Setup** | Medium | Complex | **Very Low** |
| **Cost** | $0.006 / min | $0.024 / min | **~$0.0015 / min** |

---

## 4. Recommendation for DubiOvi v1.0

### **The Winner: Option C (Gemini Multimodal Transcription)**
For Version 1.0, **Option C** is the recommended choice because:
1. **Zero Added Infrastructure**: The application already has Genkit configured and running with the Google GenAI plugin. Adding Option C requires no new service configurations, GCP setups, or external API registrations.
2. **Contextual Speaker Detection**: Gemini can read the voice context and label characters by name (e.g. "Judge") rather than numbers ("Speaker 1"), matching the Takes table column needs.
3. **Lowest Operational Cost**: Gemini 2.5 Flash token rates make this significantly cheaper than Whisper or Google STT.

*Note on Limitation*: If the client requires frame-perfect subtitle alignment for professional release, we should plan to add **Option A (Whisper API)** as a toggle in **Version 1.5** to supplement Gemini's timing estimations.

---

## 5. System Modifications

### 5.1. Proposed User Interface (UI) Workflow
1. Inside [VideoPlayer.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/VideoPlayer.tsx), loading a video unlocks a new **"AI Transcription"** button under the **Import/Export** tab.
2. The user selects a language (or chooses "Auto-Detect") and clicks **"Generate Script"**.
3. A progress overlay covers the editor panel: `"Extracting Audio..."` $\rightarrow$ `"Running Speech-to-Text..."` $\rightarrow$ `"Populating Takes..."`.
4. The generated script populated directly into the side-by-side **Takes** grid.

### 5.2. Required Backend & Audio Processing (Client-Side)
To avoid server payload limitations (Next.js serverless functions limit payloads to 4.5MB, making uploading raw 200MB videos impossible):
1. **In-Browser Audio Extraction**: Use the browser's Web Audio API (`AudioContext` and `OfflineAudioContext`) to decode the selected video file locally.
2. **Downsampling**: Convert the audio channel to single-channel (mono), 16kHz sample rate, and export it as a lightweight WAV or MP3 blob (typically < 5MB for a 10-minute clip).
3. **Transmission**: Send the compressed audio blob to the Next.js Server Action.

### 5.3. Required Firebase Changes
- **No Schema Changes Required**: The output of the transcription flow maps directly to the existing `takes` subcollection structure:
  ```json
  {
    "id": "uuid",
    "character": "Judge",
    "time": "00:02.000 --> 00:06.500",
    "startSeconds": 2.0,
    "endSeconds": 6.5,
    "original": "Members of the jury...",
    "translation": "",
    "notes": "",
    "status": "In Progress"
  }
  ```

---

## 6. Implementation Timeline

### Release Target: **Version 1.5**
While ASR is highly desirable, it is recommended to launch it in **Version 1.5** rather than Version 1.0:
- **Version 1.0 Focus**: Stabilizing core CRUD database operations, fixing the critical compiler bugs, and establishing open-access licensing (MIT) and citation DOI records.
- **Version 1.5 Focus**: Integrating client-side audio extraction pipelines, setting up ASR Genkit prompts, and testing multilingual transcriptions.
