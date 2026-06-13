# CHANGELOG

All notable changes to the **Dubbing Studio Pro (DubiOvi)** project will be documented in this file.

---

## [1.1.1-ui-fixes] - 2026-06-13

### Added
- **Copyright Footer**: Implemented responsive, centered footer with copyright text at the bottom of the root screen layout.

### Changed
- **Branding Update**: Standardized spelling of application name to **DubbiOvi** (double 'b') in the Header component, browser tab metadata, code comments, and documentation.

### Fixed
- **Takes Table Scroll Overflow**: Added `min-h-0` flexbox properties to Card, CardContent, Tabs, and TabsContent panels, allowing the inner scrollable area to display scrollbars when takes data overflows the vertical viewport.

## [1.1.0-phase3.5] - 2026-06-13

### Added
- **Automatic Speech Recognition (ASR) MVP**: Implemented Gemini Multimodal transcription for loaded videos, allowing users to automatically generate source-language takes.
- **Client-Side Audio Extraction**: Created [audio-utils.ts](file:///Users/alfonso/Desktop/DubiOvi/src/lib/audio-utils.ts) to decode video files and downsample their audio to 16kHz mono WAV format in-browser using Web Audio API to prevent serverless payload limitations.
- **Genkit ASR Flow**: Added the `asrTranscriptionFlow` in [asr-transcription.ts](file:///Users/alfonso/Desktop/DubiOvi/src/ai/flows/asr-transcription.ts) utilizing Gemini 2.5 Flash with Zod output schema enforcement for structured takes extraction.
- **ASR UI Integration**: Added the "AI Transcribe" sub-tab in [ImportExportPanel.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/ImportExportPanel.tsx) featuring language selection, trigger button, and loading step states.
- **Server Action**: Registered `getAudioTranscription` server action in [actions.ts](file:///Users/alfonso/Desktop/DubiOvi/src/app/actions.ts).

## [1.0.0-phase1] - 2026-06-13

### Fixed
- **Missing Firebase Import**: Added the missing import of `deleteDoc` from `'firebase/firestore'` in `src/app/page.tsx` to resolve runtime errors when deleting takes.
- **Invalid Collection Query**: Refactored the invalid `getDoc` call on a collection reference in `handleTakesChange` inside `src/app/page.tsx`, removing the dead/broken query and ensuring successful script/JSON imports.
