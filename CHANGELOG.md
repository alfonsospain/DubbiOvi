# CHANGELOG

All notable changes to the **Dubbing Studio Pro (DubiOvi)** project will be documented in this file.

---

## [1.2.1-academic] - 2026-06-14

### Added
- **Academic Branding & Favicon**: Added custom scalable SVG monogram "DO" favicon to browser tab icons and layout metadata, replacing the default favicon.
- **Academic Attribution Panels (Help Menu)**: Added a "Help" dropdown containing:
  - **About DubbiOvi**: Displays metadata, DOI link, developer name, affiliation, and a copyable suggested citation block with a **"Copy Citation"** button.
  - **Help & Contact**: Renders support/collaboration contact details, clickable mailto anchors, and repository references.
- **Header Layout Simplification**: Removed all profile options (My Account, Settings, Support, Logout) and user-facing cloud indicators (Cloud Backup button, Not Synced status text), focusing the UI purely on the local-first academic workflow.

## [1.2.0-workflow] - 2026-06-14

### Added
- **Local-First Architecture**: Implemented `.dubbiovi` JSON file save, open, and save-as workflows, embedding format versions, timestamps, and video filename references.
- **Excel & CSV Exports**: Created `export-utils.ts` and integrated SheetJS (`xlsx` dependency) to compile formatted spreadsheet workbooks and CSV downloads.
- **Missing Video Reload Warning Banner**: Added dynamic warning alerts to the workspace if a restored project requires a video file reload.
- **Glossary Persistence**: Verified complete cloud and local file sync for glossary collections.
- **Menu Bar Navigation Controls**: Implemented Project, Export, and Cloud drop-down menus in the header.
- **Bidirectional Timeline $\leftrightarrow$ Takes Panel Sync**: Controlled workspace active tab state and autoscroll/focus handlers. Clicking a timeline segment highlights the take, scrolls it into view, and focuses the Source Text textarea.
- **Timeline Auto-Play**: Double-clicking a segment seeks the video to the segment start and starts playback automatically.
- **Workflow Status System**: Added support for `'Pending'`, `'Reviewed'`, and `'Locked'` statuses.
- **Locked Takes Enforcement**: Enabled `readOnly` styling on text inputs when a take is Locked, disabling editing, deletion, and translation suggestions while still permitting text selection, copying, and navigation.
- **Progress Tracking & Dashboard**: Calculated metrics for Translated, Reviewed, and Locked takes, with completion % calculated as `(Translated / Total) * 100`. Renders a multi-colored segmented progress bar showing status proportions at a glance.
- **Dynamic Timeline Color Coding**: Styled timeline segments by status: Pending (Gray), Reviewed (Blue), Locked (Green).
- **Enhanced Hover Tooltips**: Added Take number, Start/End times, and Status styling to segment tooltips.

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
