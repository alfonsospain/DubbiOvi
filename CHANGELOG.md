# CHANGELOG

All notable changes to the **Dubbing Studio Pro (DubiOvi)** project will be documented in this file.

---

## [1.3.0] - 2026-06-15

### Added
- **Local Workspace Autosave**:
  - Client-side backup and restore manager using `localStorage` under the key `dubbiovi_autosave` to preserve project settings, takes, glossary, and active video metadata.
  - Automatically loads autosaved workspace on page load, showing a Toast notification: `"Local autosave restored."`
  - Workspace state mutations (takes changes, splits, merges, settings, glossary) now persist immediately to client storage.
  - Graceful fallback to default project state if no autosave is found.

### Changed
- **Branding Update**: Updated About dialog tech stack attribution to display `"Built with Next.js, TypeScript, Local Storage and Gemini 2.5 Flash."`

### Removed
- **Firebase Runtime Dependency**:
  - Removed `FirebaseClientProvider` wrapper from root layout.
  - Deleted the entire `src/firebase` directory (config, context provider, hooks).
  - Cleared Firestore write batches, document snapshots, listeners, and authentication checks from component states.
  - Removed `"firebase"` from `package.json` dependencies.

## [1.2.3-refinements] - 2026-06-14

### Changed
- **Metadata Alignment**: Updated version labels, dialog description values, suggested citation strings, and the clipboard citation generator to reflect `v1.2.3 Academic Edition` while preserving the Zenodo DOI link.

### Added
- **Undo / Redo System**:
  - Global hotkeys `Ctrl + Z` / `Cmd + Z` (Undo) and `Ctrl + Shift + Z` / `Cmd + Shift + Z` (Redo).
  - Remembers up to 20 states of takes, glossary, and settings.
  - Action-specific visual feedback (e.g. `"Undo: Merge Takes"`, `"Redo: Split Take"`).
  - Automatically synchronizes restored states to the Firestore cloud backup.
- **Horizontal Timeline Navigation**:
  - Horizontal scrollbar for the timeline container.
  - Constant zoom scale (15px per second of video duration) to prevent tiny segment widths on long recordings.
  - Smooth automatic centering scrolls active takes into focus when indices change.
- **Glossary Exports**: Added glossary export options under the header **Export** menu:
  - **Export Glossary: CSV**
  - **Export Glossary: Excel (.xlsx)**
  - **Export Glossary: JSON**
- **Top-Level About Menu**: Moved the **About DubbiOvi** trigger directly to the top-level Menubar trigger for single-click access.

### Fixed
- **Merge Takes Value Sync Bug**: Converted the takes list table rows to controlled components (`TakeRow`), ensuring that merged texts immediately refresh and display correctly in the browser.

## [1.2.2-features] - 2026-06-14

### Added
- **Word Document (.docx) Export**: Client-side document generation using the `docx` library. Added options:
  - **Word: Source Text**: Exports metadata and a list of takes (Take #, Character, Timecode, and Source Text).
  - **Word: Target Text**: Exports metadata and a list of takes (Take #, Character, Timecode, Target Text, and Status).
  - **Word: Both Texts**: Exports metadata and a parallel columns table containing Take #, Character, Timecode, Source Text, Target Text, and Status.
- **Take Segmentation (Merge/Split) Controls**:
  - **Merge with Previous & Merge with Next**: Merges adjacent takes, combining text with a newline. Preserves statuses: `Locked + Locked -> Locked`, `Reviewed + Reviewed -> Reviewed`, and other combinations `-> Pending`.
  - **Split Take...**: Opens a split dialog modal. Calculates proportional split time based on split text segment lengths, showing a live timecode preview.
  - **Locked Takes Enforcement**: Disables and blocks merge, split, and delete controls on Locked takes.
- **Professional Video Transport Controls**:
  - Added dedicated control bar below the video player with buttons: Play/Pause, Rewind 5s, Fast Forward 5s, Previous Take, Next Take, and Repeat Take.
  - **Repeat Current Take**: Seeks to active take start, plays automatically, and pauses automatically at active take end time.
  - **Playback Speed**: Selector supporting `0.75x`, `1.0x`, `1.25x`, and `1.5x` playback rates.
  - **Timecode Displays**: Formats current playback time and total video duration precisely in `MM:SS.ms`.

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
