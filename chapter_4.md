# Chapter 4: The Dubbing & Translation Workspace

## 4.1 Media Player & Transport Controls

### 4.1.1 Media Player Integration and Waveform Sync
The left-hand workspace of DubbiOvi centers on the integration between the HTML5 `<video>` player and the synced audio waveform component. This connection ensures precise coordination between the visual media, the audio track, and the text timeline:

1.  **Event Propagation:** When the HTML5 video element updates its playback head, it fires native `timeupdate` events. The application captures this via the `onTimeUpdate` handler, which updates the global `currentTime` state (in seconds) in the parent workspace page.
2.  **Waveform Alignment:** The `currentTime` state is passed down to the `AudioWaveform` component. The component uses this value to render a vertical playhead line over the audio waveform, aligning the visual audio track with the video playback.
3.  **Timeline Synchronization:** The `currentTime` state is also sent to the timeline track at the bottom of the interface, which moves a playhead indicator across the segmented take blocks.

---

### 4.1.2 Transport Toolbar Controls
The playback toolbar provides dedicated controls for navigating and playing back video segments:

*   **Play/Pause Toggle:** Plays or pauses the video.
*   **Rewind 5 Seconds:** Seeks the video playback head backward by 5 seconds:
    $$\text{New Time} = \max(0.0, \text{Current Time} - 5.0)$$
*   **Fast Forward 5 Seconds:** Seeks the video playback head forward by 5 seconds:
    $$\text{New Time} = \min(\text{Video Duration}, \text{Current Time} + 5.0)$$
*   **Previous Take Button:** Jumps the playback head directly to the start time of the previous take segment in the project.
*   **Next Take Button:** Jumps the playback head directly to the start time of the next take segment in the project.
*   **Millisecond Timecode Precision:** The timecode counter format displays the current time and total video duration down to the millisecond (`MM:SS.ms`), facilitating precise synchronization.
*   **Playback Speed Selector:** Changes the video's playback rate. It dynamically updates the browser video element's `playbackRate` property. Supported rates include:
    *   `0.75x`: Slow playback for reviewing rapid speech or precise timing.
    *   `1.0x`: Standard real-time playback.
    *   `1.25x` / `1.5x`: Accelerated playback speeds for quickly reviewing long segments.

---

### 4.1.3 "Repeat Take" Loop Automation
The **Repeat Current Take** feature loops the active take, allowing the translator to review the audio segment repeatedly without manual intervention:

```text
User selects Take 'X' and clicks Repeat
            │
            ▼
Seeks playhead to Take 'X' startSeconds
            │
            ▼
Sets local state 'isRepeating' to true
            │
            ▼
Calls video.play()
            │
            ▼
Playback advances
            │
            ▼
Checks timecode: is Current Time >= Take 'X' endSeconds?
            │
            ▼
[Yes] -> Calls video.pause() & sets 'isRepeating' to false
```

1.  **Initiating the Loop:** When the user clicks the repeat button, the transport manager verifies that a take is selected.
2.  **Playhead Seek:** The video's `currentTime` is set to the start time of the active take (`currentTake.startSeconds`).
3.  **State Activation:** The application sets the `isRepeating` state to `true` and calls `play()`.
4.  **Playback Monitoring:** During playback, the `onTimeUpdate` event monitor checks if the current playhead position meets or exceeds the take's end time:
    $$\text{Current Playhead Time} \ge \text{activeTake.endSeconds}$$
5.  **Auto-Pause and Reset:** Once the playhead reaches the end of the take, the system pauses the video and resets the `isRepeating` state to `false`.
6.  **Loop Cancellation:** If the user manual seeks the playhead, clicks play/pause, or changes the active take during a loop, the loop is canceled and `isRepeating` is reset to `false`.

---

## 4.2 The Interactive Takes Table

### 4.2.1 Selection, Auto-Focus, and Synchronized Seeking
The Takes list displays dialogue segments in a table layout. The interface supports bidirectional synchronization between the editing table, the media player, and the timeline:

*   **Single-Click Navigation:** Clicking a take row triggers a select action (`onTakeSelect`):
    *   The application updates `currentIndex` to the selected take index.
    *   The media player seeks to the take's start seconds (`takes[index].startSeconds`).
*   **Auto-Focus Mechanism:** When a row is selected, the application retrieves the corresponding textarea reference from `sourceTextRefs.current[selectedTakeIndex]` and focuses the editor cursor on the source text area. This allows translators to edit text immediately without additional mouse clicks.

---

### 4.2.2 Live Playback Autoscrolling and Highlighting
During video playback, the takes list automatically updates to show the active dialogue segment:

*   **Active Row Detection:** The application monitors the video playhead time. A take row is marked active if the current time falls within its start and end times:
    $$\text{Current Time} \in [\text{take.startSeconds}, \text{take.endSeconds})$$
    The active row is styled with a light blue background overlay (`bg-primary/10` and `bg-muted/50 border-primary`) to distinguish it from the rest of the list.
*   **Smooth Autoscroll:** When the active take changes, a React `useEffect` hook retrieves the corresponding row's DOM element from `rowRefs.current[selectedTakeIndex]`. If the row is not visible in the viewport, the system calls:
    ```typescript
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    ```
    This scrolls the active row into view within the table container, allowing the user to follow the dialogue transcription in real time.

---

## 4.3 Granular Take Operations & Management

### 4.3.1 Proportional Take Splitting
The **Split Take...** utility divides a take segment into two separate takes, allocating text and timing boundaries proportionally:

1.  **Opening the Split Dialog:** Clicking "Split Take..." in a take's actions dropdown opens a split segmentation modal. The system uses a midpoint search function (`findSplitPoint`) to locate the space character closest to the text's character midpoint, automatically splitting the text into two segments.
2.  **Adjusting Text Boundaries:** The user can edit the text boundaries for both the source and target segments in the split modal.
3.  **Proportional Timecode Preview:** The system calculates the timing split based on the character length of the split texts:
    $$\text{Ratio} = \frac{\text{Length of Source Part 1}}{\text{Length of Source Part 1} + \text{Length of Source Part 2}}$$
    If the source text is empty, the ratio is calculated using the target text lengths. If both are empty, the ratio defaults to `0.5`.
    The split timecode is calculated as:
    $$\text{Split Time (seconds)} = \text{startSeconds} + \text{Ratio} \times (\text{endSeconds} - \text{startSeconds})$$
    The modal displays a live preview of the resulting timecodes for Part 1 and Part 2.
4.  **Executing the Split:** When the split is confirmed, the original take is updated with the parameters of Part 1 (keeping the original ID). A new take containing the parameters of Part 2 is generated with a new UUID v4 and inserted directly below the first take. The status for both takes is set to `'Pending'`.

---

### 4.3.2 Take Merging and Status Inheritance Logic
Merging combines two adjacent takes (both text and timeline bounds) into a single segment:

*   **Available Actions:**
    *   **Merge with Previous:** Merges the active take with the preceding take (disabled for the first take).
    *   **Merge with Next:** Merges the active take with the following take (disabled for the last take).
*   **Text Concatenation:** The source texts of both takes are joined with a newline character (`\n`). Target texts and notes are merged in the same way. If the speaker character fields differ, they are joined with a slash separator (`Speaker 1 / Speaker 2`).
*   **Timing Adjustments:** The merged segment inherits the start time of the first take and the end time of the second take.
*   **Status Inheritance Rules:**
    *   If both takes have a status of `'Locked'`, the merged segment inherits the `'Locked'` status.
    *   If both takes have a status of `'Reviewed'`, the merged segment inherits the `'Reviewed'` status.
    *   For any other status combination, the merged segment defaults to `'Pending'`.

---

### 4.3.3 Locked Take Safeguards
When a take status is set to `'Locked'`, the application restricts editing on that segment to prevent accidental modifications:

*   **Input Lockout:** The character input, source text, and target text areas are set to `readOnly`.
*   **UI Indicators:** Locked fields are styled with a dashed border and a grey background (`bg-secondary/20 cursor-not-allowed`).
*   **Action Disabling:** In the actions dropdown menu, the **Split Take**, **Merge with Previous**, **Merge with Next**, and **Delete Take** options are disabled.
*   **AI Feature Lockout:** The translation suggestion sparkles button is disabled for locked takes.
*   *Text Selection:* Users can still select and copy text from locked takes, and click on them for navigation.

---

## 4.4 AI-Assisted Translation Suggestions

### 4.4.1 Sparkles Translation Prompt Structure
DubbiOvi integrates generative translation suggestions powered by Google's Gemini 2.5 Flash model. Clicking the **Sparkles** button on a take initiates a translation suggestion request:

1.  **Payload Compilation:** The client retrieves the take's source text, the project's source and target language settings, the terminology glossary list, and the user's Gemini API key from local storage.
2.  **Prompt Template Generation:** The parameters are sent to the Genkit flow `getTranslationSuggestionFlow` via a server action. The server action constructs a structured prompt instructing the model to translate the text while respecting the glossary terms:

```text
Translate the following dialogue from [Source Language] to [Target Language].
Source Text: "[Dialogue Text]"

Glossary Rules (translate these terms exactly as specified):
- [Source Term] -> [Target Term]

Return only the translated text, preserving any line breaks.
```

---

### 4.4.2 Glossary Post-Processing Fallback
To ensure terms are translated consistently according to the glossary, the server action applies a post-processing validation step:

1.  **Regex Matching:** After receiving the translation from the Gemini model, the server action loops through the project's glossary terms.
2.  **Boundary Replacement:** It runs a case-insensitive, word-boundary search-and-replace on the translation string:
    ```typescript
    const regex = new RegExp('\\b' + entry.sourceTerm + '\\b', 'gi');
    translation = translation.replace(regex, entry.targetTerm);
    ```
    This regex replaces any occurrences of the source term in the translation with the preferred target term, ensuring strict glossary enforcement.
3.  **UI Update:** The validated translation is sent back to the client, updating the target text field and resetting the take's status to `'Pending'`.
