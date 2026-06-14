# Implementation Plan: Word Export, Take Editing & Video Controls (DubbiOvi v1.2.2)

This document details the architectural choices, mathematical equations, and file-by-file changes required to implement Word Export, Take Editing (Merge/Split), and Professional Video Transport Controls in the DubbiOvi application.

---

## 1. Safety & Architecture Analysis

### Feature 1: Word Export (.docx)
* **Strategy**: Use the client-side library `docx` to construct Microsoft Word documents in the browser. 
* **Safety Benefit**: Client-side generation runs completely within the user's browser context, requiring zero API routes or backend compute. It is robust, lightweight, and works seamlessly with local-first setups.
* **Layout Design**:
  * **Header Block**: Project Name, Source/Target languages, and Export Date.
  * **Format A (Source Text)**: Exports a bulleted or indexed list of takes with Take #, Character, Timecodes, and Source Text.
  * **Format B (Target Text)**: Same as above but using Target Text and Status.
  * **Format C (Both Texts)**: Formats a structured `docx` table with parallel columns:
    * *Take #*, *Character*, *Timecodes*, *Source Text*, *Target Text*, and *Status*.
  * **Line Breaks**: We will split text content by newline (`\n`) and insert explicit text runs containing carriage breaks to prevent formatting loss.

### Feature 2: Take Editing (Merge & Split)
* **Strategy**: Mutate the local `takes` array state, calculate new properties, and perform a transactional batch update to Firestore to ensure UI and database are synchronized.
* **Locked Checks**: Merge and Split actions are restricted to **unlocked** takes only. Any take with `status === 'Locked'` will have its merge/split controls disabled, and programmatically blocked.
* **Merge Options**:
  * **Merge with Previous**: Merge take $i$ with take $i-1$.
  * **Merge with Next**: Merge take $i$ with take $i+1$.
* **Merge Calculations**:
  * For merging take $i$ and $i+1$ (Merge with Next):
    * $T_{start} = takes[i].startSeconds$
    * $T_{end} = takes[i+1].endSeconds$
    * $Original = takes[i].original + \text{"\n"} + takes[i+1].original$
    * $Translation = takes[i].translation + \text{"\n"} + takes[i+1].translation$
    * $Character$: If $takes[i].character === takes[i+1].character$, keep it. Otherwise, combine them as `${takes[i].character} / ${takes[i+1].character}`.
    * $Timecode$: Constructed as `${formatTimeForDisplay(T_{start})} - ${formatTimeForDisplay(T_{end})}`.
  * **Status Preservation Rules**:
    * `Locked` + `Locked` $\rightarrow$ `Locked`
    * `Reviewed` + `Reviewed` $\rightarrow$ `Reviewed`
    * Any other combination $\rightarrow$ `Pending`
* **Split Calculations**:
  * The user opens a modal dialog that splits the original text into two parts.
  * Let $L_1$ be the character length of the first part of the Source Text.
  * Let $L_2$ be the character length of the second part of the Source Text.
  * Proportional split timecode is calculated using the text length ratio:
    $$t_{split} = t_{start} + (t_{end} - t_{start}) \times \frac{L_1}{L_1 + L_2}$$
  * If the source text is empty, the calculation falls back to target text lengths. If both are empty, it defaults to a $50/50$ duration split:
    $$t_{split} = t_{start} + \frac{t_{end} - t_{start}}{2}$$
  * **Split Dialog UI**: To avoid cursor focus/range loss issues typical of browser modals, the UI will present two textareas for Source Text (Part 1 / Part 2) and two textareas for Target Text (Part 1 / Part 2), pre-populated using a default character-length split. The user can edit and refine the split points freely, then click "Confirm".

### Feature 3: Professional Video Transport Controls
* **Strategy**: Extend the `VideoPlayer` component with a dedicated control bar below the video element.
* **Play/Pause Sync**: To avoid play/pause state discrepancies between native browser controls and custom buttons, we will bind React state `isPlaying` directly to the video element's `onPlay` and `onPause` HTML5 events.
* **Speed Controller**: Bind the video element's `playbackRate` property to a speed selection state (`0.75x`, `1.0x`, `1.25x`, `1.5x`).
* **Time Display**: Render a precise current time and total duration tracker using `formatTimeForDisplay`.
* **Take Skips**: Previous/Next Take buttons will seek the video's playback head to the start of the previous/next take and highlight it in the active takes list.
* **Repeat Current Take**: Add a "Repeat Take" toggle/button:
  * Seeks the video playback head to the start time of the active take.
  * Starts video playback automatically.
  * Continuously tracks the current playback time, and automatically pauses the video when the time reaches or exceeds the active take's end seconds.

---

## 2. Affected Files

1. **`package.json`** [MODIFY]
   * Add `"docx"` (v8.5.0 or compatible) to dependencies.
2. **`src/lib/export-utils.ts`** [MODIFY]
   * Implement Word generation helpers: `exportToWordSource()`, `exportToWordTarget()`, and `exportToWordBoth()`.
3. **`src/components/Header.tsx`** [MODIFY]
   * Add new Export dropdown options:
     * Word: Source Text
     * Word: Target Text
     * Word: Both Texts
   * Map click handlers to parent callbacks.
4. **`src/components/TakesList.tsx`** [MODIFY]
   * Render "Merge with Previous", "Merge with Next", and "Split Take" buttons in the Tools column for unlocked takes.
   * Implement the `SplitTakeDialog` React modal structure.
5. **`src/components/VideoPlayer.tsx`** [MODIFY]
   * Render custom transport bar: Skip Back, Rewind 5s, Play/Pause, Forward 5s, Skip Forward, and Repeat Take.
   * Render current duration timer and playback speed select.
   * Propagate events to video element references.
6. **`src/app/page.tsx`** [MODIFY]
   * Implement parent handlers for Word Exports, Take Merges, Take Splits, and Skip Take triggers.
   * Synchronize changes to Firestore and UI state.
   * Add auto-stop logic for "Repeat Current Take" feature.

---

## 3. Verification Plan

### Automated Checks
* Run `npm run typecheck` to check for compilation errors.
* Run `npm run build` to verify production bundling.

### Manual Verification Checklist
1. **Word Export**:
   * Export Source Text only: Verify page metadata matches settings, and line breaks are preserved.
   * Export Target Text only: Verify columns and statuses are correct.
   * Export Both Texts: Verify table structure renders side-by-side columns correctly.
2. **Take Editing**:
   * Merge with previous/next: Confirm times, texts, and statuses merge according to rules:
     * Locked + Locked $\rightarrow$ Locked
     * Reviewed + Reviewed $\rightarrow$ Reviewed
     * Others $\rightarrow$ Pending
   * Split a take: Verify proportional split calculations, and ensure new takes propagate to the database.
   * Confirm Locked takes block editing, deletion, merging, and splitting.
3. **Video controls**:
   * Test play, pause, speeds, rewind/forward, and previous/next skip controls.
   * Test Repeat Take: Verify it seeks to start, plays, and auto-stops at the exact end of the take.
