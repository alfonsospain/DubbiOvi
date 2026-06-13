# IMPLEMENTATION PLAN: Dubbing Studio Pro (DubiOvi) v1.0

This implementation plan details the phases required to release **DubiOvi v1.0** as a stable, optimized, academic open-access application under the **Alfonso Digital Lab**, released under the **MIT License**.

---

## Roadmap Overview

```text
[ Phase 0: Branding ] ──> [ Phase 1: Bug Fixes ] ──> [ Phase 2: DB Tuning ]
        │                        │                          │
        ▼                        ▼                          ▼
[ Phase 3: MVP Finish ] ─> [ Phase 3.5: ASR MVP ] ──> [ Phase 4: Pub Ready ]
                                                            │
                                                            ▼
                                                      [ Phase 5: Research ]
```

---

## Phase 0: Branding & Product Definition

### Objectives
- Establish the official identity of the tool as an academic project within **Alfonso Digital Lab**.
- Align frontend layout branding, titles, metadata, and logos.

### Files Affected
- [src/app/layout.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/app/layout.tsx): Update window titles and descriptions.
- [src/components/Header.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/Header.tsx): Update branding text (e.g., "Alfonso Digital Lab - DubiOvi").
- [src/components/ProjectSettings.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/ProjectSettings.tsx): Add default metadata fields.

### Tasks
1. Update Next.js `metadata` in `layout.tsx` to include academic credits and "Alfonso Digital Lab".
2. Redesign the Header UI to display the official logo/text for Alfonso Digital Lab.
3. Replace the placeholder accounts menu in the header with a "Help & Documentation" links panel.

### Risks
- Over-cluttering the header layout on smaller screens.

### Estimated Effort
- **1-2 Hours**

---

## Phase 1: Critical Bug Fixes [COMPLETED]

### Objectives
- Resolve all runtime errors to ensure workspace stability.
- Ensure that users can delete takes and import scripts/JSON without crashes.

### Files Affected
- [src/app/page.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/app/page.tsx): Resolve missing imports and invalid queries.

### Tasks
1. Import `deleteDoc` from `'firebase/firestore'` at the top of `page.tsx`.
2. Refactor `handleTakesChange` to remove the invalid `getDoc` call on the `takes` collection. Replace it with `getDocs` if verification is needed, or remove it entirely since the `existingTakesSnapshot` query is currently dead code.
3. Test imports from Word (`.docx`), Plain Text, and JSON to ensure they save to Firestore without breaking the connection.
4. Run static type checking using `npm run typecheck` to confirm compiler clean state.

### Risks
- Minor race conditions if the snapshot listener fires while write batches are committing.

### Estimated Effort
- **2 Hours**

---

## Phase 2: Database Optimization

### Objectives
- Reduce Firestore write costs and prevent database throttling.
- Prevent settings updates from executing on every individual keystroke.

### Files Affected
- [src/app/page.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/app/page.tsx): Move writing handlers into a debounced wrapper.
- [src/components/ProjectSettings.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/ProjectSettings.tsx): Decouple inline change triggers from immediate Firestore updates.
- [src/components/TakesList.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/TakesList.tsx): Debounce target text edits to minimize writes.

### Tasks
1. Implement a custom React debounce hook or utility (e.g. using `setTimeout` closures).
2. Decouple `handleSettingsChange` in `page.tsx` so that while state updates immediately (to keep UI inputs responsive), the Firestore `setDoc` write is debounced by 500ms.
3. Apply the same debouncing mechanism to take text edits (original/translation edits) inside `TakesList` textareas.

### Risks
- Users closing the browser window before the debounce timer finishes and the write commits (can be mitigated by warning on tab close if changes are pending).

### Estimated Effort
- **3 Hours**

---

## Phase 3: MVP Completion

### Objectives
- Complete the feature parity described in the product vision.
- Expose the sentiment analysis capabilities in the UI layout.
- Ensure a friendly onboarding experience for new workspaces.

### Files Affected
- [src/components/TakesList.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/TakesList.tsx): Embed the SentimentDisplay component.
- [src/app/page.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/app/page.tsx): Initialize empty databases with default takes.
- [src/components/GlossaryPanel.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/GlossaryPanel.tsx): Resolve UUID generation compatibility risk.

### Tasks
1. Integrate [SentimentDisplay.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/SentimentDisplay.tsx) into the Takes table row layout (e.g., render below the target translation text box) to show Gemini-rated scores.
2. In `page.tsx`, check if the fetched takes collection snapshot is empty. If empty, write `DEFAULT_TAKES` to Firestore automatically so the workspace has mock data out-of-the-box.
3. In `GlossaryPanel.tsx`, replace `crypto.randomUUID()` with the imported `v4` function from the `uuid` package.
4. Integrate basic tooltips to guide users on how to load a video and get translation suggestions.

### Risks
- API Key exhaustion: Gemini sentiment triggers can incur higher token usage if scripts are very long.

### Estimated Effort
- **4-6 Hours**

---

## Phase 3.5: AI Transcription / ASR MVP (Release Target: v1.1)

### Objectives
- Enable users to automatically transcribe video audio tracks and populate the source-language Takes column using generative AI.
- Maintain a zero-dependency local deployment pipeline by leveraging the existing Genkit/Gemini framework.

### Files Affected
- [src/components/ImportExportPanel.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/ImportExportPanel.tsx): UI additions for language selection and execution.
- [src/app/page.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/app/page.tsx): Handler logic for receiving ASR outputs and syncing Firestore collections.
- [src/ai/flows/asr-transcription.ts](file:///Users/alfonso/Desktop/DubiOvi/src/ai/flows/asr-transcription.ts): [NEW] Genkit flow, prompts, and Zod output schema definition.
- [src/app/actions.ts](file:///Users/alfonso/Desktop/DubiOvi/src/app/actions.ts): Server Action mapping client audio files to the Genkit flow.

### UI Changes
- Add a new **"AI Transcribe"** tab inside the Import/Export panel.
- Implement a Language dropdown selection (Auto-Detect, English, Spanish, etc.) and a primary action button `"Transcribe Video Audio"`.
- Render a progress modal showing steps: `"Extracting Audio..."` -> `"Analyzing Speech..."` -> `"Populating Takes..."`.

### Backend Changes
- Establish a Next.js Server Action (`getAudioTranscription`) that reads incoming WAV blobs and initiates the Genkit prompt request.

### Audio Extraction Requirements
- Write a client-side utility script utilizing browser Web Audio API (`AudioContext`/`OfflineAudioContext`) to extract the audio track from local videos.
- Downsample extracted audio to 16kHz mono and render a lightweight WAV file (typically <5MB) to keep payload uploads under serverless limits.

### Genkit ASR Flow
- Register a flow `transcribeAudioFlow` using Gemini 2.5 Flash.
- Define a prompt instructing Gemini to detect language, recognize speaker voices contextually (e.g. "Judge"), and segment speech into takes based on natural pauses (under 10 seconds).
- Enforce the Zod schema structured response containing `detectedLanguage` and a list of `takes` (character, startSeconds, endSeconds, original).

### Risks
- Server timeouts: Next.js serverless functions capping at 60s execution limits, which can interrupt transcribing long files.
- Client audio failures: Older browser engines failing to decode high-bitrate video audio files locally.

### Limitations
- Cap video files to a maximum duration of 15 minutes.
- Minor timing alignment rounding errors due to non-deterministic generative text timestamping.

### Estimated Effort
- **6-8 Hours**

---

## Phase 4: Academic Release Preparation

### Objectives
- Clean up unnecessary file weight and libraries to streamline the code.
- Create files required for open-access citation and open-source licensing.

### Files Affected
- [package.json](file:///Users/alfonso/Desktop/DubiOvi/package.json): Remove unused dependencies.
- [LICENSE](file:///Users/alfonso/Desktop/DubiOvi/LICENSE): [NEW] Add MIT License terms.
- [README.md](file:///Users/alfonso/Desktop/DubiOvi/README.md): Update documentation and run instructions.
- [CITATION.cff](file:///Users/alfonso/Desktop/DubiOvi/CITATION.cff): [NEW] Add academic citation guidelines.
- `src/components/ui/`: Delete the 18 unused Shadcn files.
- `src/hooks/use-mobile.tsx`: Delete this unused hook.

### Tasks
1. Delete the 18 unused components from `/src/components/ui/` (e.g., `accordion.tsx`, `calendar.tsx`, `sidebar.tsx`).
2. Uninstall unused `@radix-ui/` packages in `package.json` to keep `node_modules` clean.
3. Write a full `LICENSE` file containing the standard MIT License.
4. Write a `CITATION.cff` metadata file containing author, title, version, and Alfonso Digital Lab information.
5. Revamp `README.md` to detail:
   - Installation and setup guidelines.
   - How to configure environment variables.
   - Zenodo DOI citation examples.
6. Verify IDX configurations (`.idx/dev.nix`) and environment files to ensure a smooth launch for other developers.

### Risks
- Accidentally deleting a UI component that has an implicit import dependency. (Mitigated by running `npm run build` after removal).

### Estimated Effort
- **3 Hours**

---

## Phase 5: Future Research Features

### Objectives
- Introduce advanced capabilities to support translation studies research.
- Improve synchronization controls and visual analysis tools.

### Files Affected
- [src/components/Timeline.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/Timeline.tsx): Add zoom/scale canvas capabilities.
- [src/components/ImportExportPanel.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/ImportExportPanel.tsx): Exporter customizer options.
- [src/ai/flows/](file:///Users/alfonso/Desktop/DubiOvi/src/ai/flows/): Add automated lip-sync timing flow.

### Tasks
1. Refactor the timeline component to support scaling and scrolling (e.g., using mouse wheel events and mapping durations dynamically).
2. Integrate audio waveform rendering onto the timeline if audio tracks are extracted.
3. Create a custom export settings menu allowing users to toggle timecode structures or metadata inclusion.
4. Implement an experimental Genkit flow to test lip-sync timing based on syllable-length counts in translations.

### Risks
- High code complexity in timeline canvas rendering and audio decoders.

### Estimated Effort
- **10-15 Hours**
