# ASR TECHNICAL FEASIBILITY REVIEW: TIMESTAMP GENERATION

This technical feasibility review evaluates different approaches for generating speech timestamps (`startSeconds` and `endSeconds`) within **DubiOvi v1.1**, with the goal of minimizing timing drift and maximizing usability in academic and professional settings.

---

## 1. Feasibility Analysis of Gemini 2.5 Flash

Gemini 2.5 Flash possesses native multimodal understanding of audio files. However, we must distinguish between **semantic audio comprehension** and **acoustic timestamp alignment**:
- **Acoustic Alignment**: Traditional ASR models (like Whisper or Google STT) use dedicated connectionist temporal classification (CTC) or cross-attention alignments to bind text tokens to specific millisecond windows.
- **Autoregressive Estimation**: Gemini processes audio inputs as sequences of token embeddings. When generating timestamps, it predicts numbers as text tokens. It does not calculate exact audio offsets; it estimates them based on language context and token counts.

### Key Limitations of Gemini-Generated Timestamps:
1. **Hallucinations and Rounding**: Gemini frequently rounds timestamps to the nearest half-second or integer second, leading to choppy subtitle alignment.
2. **Timing Drift**: On files longer than 5 minutes, Gemini's predicted timecodes tend to drift by 1 to 3 seconds, especially during long periods of background music, noise, or silence.
3. **Loss of Fine Boundaries**: Gemini often misses the quick, initial syllables of a sentence or truncates trailing words, leading to cut-off audio playback when seeking.

---

## 2. Comparative Analysis of Approaches

### Approach A: Gemini-Generated Timestamps (Pure Multimodal Prompting)
The client uploads the extracted audio, and a single Gemini prompt transcribes, segments, identifies speakers, and outputs timestamped JSON takes.

- **Acoustic Accuracy**: **Low**. Timestamps are estimated, resulting in drift (+/- 1.5s typical deviation) and rounded boundaries.
- **Implementation Complexity**: **Very Low**. Single Genkit flow and server action. No new SDKs or client audio decoding libraries.
- **Classroom Usability**: Medium. Students must manually adjust takes on the visual timeline, increasing editing load.
- **Cost**: Extremely Low (roughly $0.015 per 10 minutes of audio).

---

### Approach B: Browser-Side Audio Segmentation + Gemini Transcription
The client uses the browser's Web Audio API (`AudioContext` / analyzer nodes) to analyze the audio waveform locally. It detects silent blocks (e.g., amplitude below -45dB for >1.5s) and splits the audio buffer into short segments. It then uploads each segment to the server for text transcription by Gemini.

- **Acoustic Accuracy**: **High**. Timestamps are calculated using the browser's exact audio sample clock, guaranteeing perfect boundaries.
- **Implementation Complexity**: **High**. Requires complex client-side audio analysis, buffer splitting, and managing sequential/parallel API calls to prevent browser freezing.
- **Classroom Usability**: High. Gaps are accurately mapped, but overlapping speakers or quiet background voices may confuse the threshold detector.
- **Cost**: Medium-High. If a 10-minute clip is split into 60 segments, it triggers 60 individual Gemini API requests, increasing latency and API quota exhaustion.

---

### Approach C: Whisper Timestamps + Gemini Translation/Adaptation
The client uploads the audio to a server action that calls the OpenAI Whisper API. Whisper generates precise segment-level transcripts with timestamps. This transcript is then fed into Gemini for translation, glossary alignment, and formatting.

- **Acoustic Accuracy**: **Very High**. Whisper is built for exact alignment and handles background noise and accents reliably.
- **Implementation Complexity**: **Medium**. Requires managing two API endpoints (OpenAI for ASR, Genkit/Gemini for translation).
- **Classroom Usability**: Excellent. Requires minimal timing adjustments.
- **Cost**: High. OpenAI Whisper API costs $0.006 / minute. A 10-minute file costs $0.06 (4x more expensive than Gemini Multimodal).

---

## 3. Comparison Matrix

| Evaluation Criteria | Approach A (Pure Gemini) | Approach B (Client Segment + Gemini) | Approach C (Whisper + Gemini) |
| :--- | :--- | :--- | :--- |
| **Timestamp Precision** | Low (Estimated) | **High (Calculated)** | **Excellent (Aligned)** |
| **API Call Count** | **1 request** | 30-100 requests (per clip) | 2 requests |
| **Client-Side Complexity** | **Zero** | Very High (PCM Analyzers) | Zero |
| **Classroom Setup** | **Very Low** (Single key) | Very Low (Single key) | Medium (Two API keys) |
| **V1.1 Implementation Time**| **6-8 Hours** | 20-30 Hours | 12-15 Hours |
| **Billing / Cost** | **Very Low** | Medium (High call volume) | High ($0.006/min) |

---

## 4. Recommendation for DubbiOvi v1.1

### **Recommended Strategy: Approach A (Pure Gemini) with UI Timing Offsets**
For the **DubbiOvi v1.1** release, **Approach A** is the most viable path. Although its timestamp precision is lower, it aligns best with the project's core goals of **simple distribution, low cost, and zero extra credentials**.

#### Why Approach A is selected for v1.1:
1. **Classroom Deployment**: Instructors can host and run the app using only a single `GEMINI_API_KEY`. Adding OpenAI Whisper API requirements introduces billing setups that block student access.
2. **Classroom Teaching Potential**: Having minor timestamp offsets is actually **pedagogically useful**. It forces translation students to learn how to adjust and synchronize subtitles using the visual timeline components, mimicking professional workflows.
3. **No Network Overhead**: Approach B would flood the serverless action with dozens of concurrent API calls, hitting execution duration limits.

#### Mitigation for Gemini's Timing Inaccuracies:
- **Strict Prompt Guidelines**: Instruct Gemini in the prompt to use decimal seconds and avoid rounding numbers to integers.
- **Timeline Adjustments**: Ensure the timeline component supports dragging boundaries (Phase 5 plan) so users can easily fix drifts.
