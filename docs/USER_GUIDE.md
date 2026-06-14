# DubbiOvi User Guide (v1.2.3 Academic Edition)

An Open-Source AI-Assisted Audiovisual Translation Environment for Teaching, Research, and Knowledge Transfer.

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Creating a Project](#2-creating-a-project)
3. [Importing Source Text](#3-importing-source-text)
4. [AI Transcription](#4-ai-transcription)
5. [Editing Takes](#5-editing-takes)
6. [Merge Takes](#6-merge-takes)
7. [Split Takes](#7-split-takes)
8. [Translation Workflow](#8-translation-workflow)
9. [Workflow Statuses](#9-workflow-statuses)
10. [Video Controls](#10-video-controls)
11. [Glossary Management](#11-glossary-management)
12. [Exporting Projects](#12-exporting-projects)
13. [Word Export](#13-word-export)
14. [Excel Export](#14-excel-export)
15. [CSV Export](#15-csv-export)
16. [Save/Open Project (.dubbiovi)](#16-saveopen-project-dubbiovi)
17. [Recommended Workflows](#17-recommended-workflows)
18. [Who is DubbiOvi for?](#18-who-is-dubbiovi-for)
19. [Limitations](#19-limitations)
20. [Troubleshooting](#20-troubleshooting)
21. [Citation and License](#21-citation-and-license)

---

## 1. Introduction
DubbiOvi is an open-source, web-based translation workbench built specifically for audiovisual translation (AVT) training, research, and classroom practice. It bridges the gap between automatic speech recognition (ASR) tools, machine translation engines, and timeline segmentation. By offering a local-first interface, students and scholars can perform dubbing or subtitling exercises manually, with AI, or in hybrid configurations.

---

## 2. Creating a Project
1. Open the application.
2. Select **Project** $\rightarrow$ **New Project** from the top menubar.
3. Open the **Settings** tab in the sidebar:
   * **Project Name**: Enter a name (e.g. *Clooney Marketing Video*).
   * **Source Language**: Select the language spoken in the video.
   * **Target Language**: Select the translation language.
   * **Translator**: Enter your name for metadata logging.
4. Click the video placeholder area to upload your local video file (MP4, WebM, etc.).

---

## 3. Importing Source Text
If you already possess a script or transcript, you can bypass automatic transcription:
1. Open the **Import/Export** tab.
2. Select the script import tool.
3. Paste or load your formatted script text.
4. DubbiOvi will populate the takes list, using default time intervals that can then be manually timed.

---

## 4. AI Transcription
For automatic dialogue extraction:
1. Upload your video.
2. Go to **Import/Export** $\rightarrow$ **AI Transcribe**.
3. Select the video's audio language.
4. Click **Transcribe**.
5. The application extracts the audio client-side, downsamples it to a mono 16kHz WAV format, and streams it to Gemini 2.5 Flash. Takes are generated and timed automatically.

---

## 5. Editing Takes
The **Takes** tab displays dialogue takes in a sequential list:
* Click any field (Source Text or Target Text) to edit content.
* Character names can be specified in the metadata field.
* Edits are saved locally and synchronized with Firestore when blurring the input field.
* Locked takes cannot be edited.

---

## 6. Merge Takes
If dialogue segmentation is too granular:
1. Click the actions menu (**three dots**) on the right of the take.
2. Choose **Merge with Previous** or **Merge with Next**.
3. This combines the two adjacent segments:
   * Dialogue texts are concatenated with a newline (`\n`).
   * Start time becomes the first take's start time; end time becomes the second take's end time.
   * Status updates to `Pending` unless both were `Locked`.

---

## 7. Split Takes
To divide a single long dialogue take:
1. Click the actions menu $\rightarrow$ **Split Take...**.
2. An interactive dialog will open.
3. Adjust the text divisions inside the **Part 1** and **Part 2** text areas.
4. When a take is split, DubbiOvi automatically estimates the new timeline boundary according to the relative length of the resulting text segments.
5. Click **Split Take** to confirm. Both segments are reset to `Pending`.

---

## 8. Translation Workflow
* **Manual Translation**: Enter translations directly into the **Target Text** field of any take.
* **AI Suggestions**: Click the **Sparkles** icon on a take to generate a context-aware translation suggestion powered by Gemini, taking into account current settings and glossary entries.

---

## 9. Workflow Statuses
Manage your project pipeline by changing each take's status in the dropdown:
* **Pending** (Grey): Default state, work in progress.
* **Reviewed** (Blue): Approved script/translation.
* **Locked** (Green): Prevents edits, splits, merges, or deletes. Can still be selected and copied.
* The progress bar in the sidebar dynamically tracks completed, reviewed, and locked counts.

---

## 10. Video Controls
The custom AVT Transport Control bar provides dedicated buttons:
* **Play / Pause**: Start and pause video playback.
* **Rewind 5s / Fast Forward 5s**: Jump-seek the playhead.
* **Previous Take / Next Take**: Jump directly to the start of neighboring takes.
* **Repeat Take**: Loops the active take continuously, pausing at the end for focused dialogue review.
* **Playback Speed**: Adjust speed to `0.75x`, `1.0x`, `1.25x`, or `1.5x`.

---

## 11. Glossary Management
1. Navigate to the **Glossary** tab.
2. Add terminology pairs (Source Term $\rightarrow$ Target Term) and optional notes.
3. Glossary terms are used during AI translation generation to ensure consistent terminology.

---

## 12. Exporting Projects
DubbiOvi supports standard file exports for sharing script details with actors, directors, or researchers. Navigate to the **Export** menu in the top menubar to choose your format.

---

## 13. Word Export
Generates a Microsoft Word (`.docx`) file directly in your browser:
* **Word: Source Text**: Generates a document showing project details and a timed source script.
* **Word: Target Text**: Generates a document containing the translation script and verification statuses.
* **Word: Both Texts**: Builds a side-by-side bilingual grid table.

---

## 14. Excel Export
Exports the timeline and script to a structured Excel spreadsheet (`.xlsx`):
* Includes Take IDs, characters, timecodes, source text, target text, and workflow statuses.
* Automatically formatted with custom column widths.

---

## 15. CSV Export
Exports dialogue scripts or glossary files to standard Comma-Separated Values (`.csv`) for compatibility with database systems or subtitle builders.

---

## 16. Save/Open Project (.dubbiovi)
DubbiOvi utilizes a local-first file-saving pattern:
* Select **Project** $\rightarrow$ **Save Project** to download your session as a `.dubbiovi` JSON file.
* This file embeds all takes, timings, glossaries, settings, and video filename references.
* To restore, select **Open Project** and load the `.dubbiovi` file.

---

## 17. Recommended Workflows
* **ASR-First Subtitling**: Import video $\rightarrow$ Transcribe with ASR $\rightarrow$ Refine timings manually $\rightarrow$ Translate target segments.
* **Manual Script Translation**: Import video $\rightarrow$ Import pre-made script $\rightarrow$ Time takes manually $\rightarrow$ input translations.
* **Glossary-Driven MT**: Create glossary $\rightarrow$ Transcribe $\rightarrow$ Use AI Sparkles to suggest translations aligned with terminology.

---

## 18. Who is DubbiOvi for?
DubbiOvi is built to serve a wide range of academic, educational, and professional needs in the field of Audiovisual Translation:
* **Translation Students**: To practice translation editing, subtitle timing, post-editing, and ASR alignment in a modern, streamlined workspace.
* **Audiovisual Translation (AVT) Instructors**: To set up dialogue scripting and subtitling assignments with consistent datasets and files.
* **Localization Courses**: To teach hybrid AI-assisted and human translation workflows.
* **Translation Researchers**: To study translation process behaviors, post-editing speeds, and human-computer interaction in AVT tasks.
* **Research Groups**: To construct multilingual corpora and align dialogue segments with external audio tracks.
* **Professional Translators**: To quickly generate draft timed templates using cloud ASR.
* **Knowledge Transfer Projects**: To bridge the gap between academic translation labs and open-source software development.

---

## 19. Limitations
* **Video File Loading**: For security, browsers do not persist raw video file references. When reloading a saved project, you must re-select the video file if prompted.
* **ASR Context Windows**: Gemini works best on files under 15 minutes. For longer videos, speech recognition accuracy may degrade or fail.

### AI Service Quotas
DubbiOvi relies on external AI services for automatic transcription and translation suggestions. Availability and performance may depend on the user's Gemini API plan, quota limits, and network connectivity. If AI services are temporarily unavailable, users can continue working manually by importing source texts and editing translations directly.

---

## 20. Troubleshooting
* **Text Merges Not Refreshing**: In older versions, merging takes did not update text in the takes panel. Upgrade to v1.2.3 to utilize the reactive `TakeRow` controlled component update.
* **Typing lag**: If experiencing delay while typing, ensure you are using v1.2.3, which delays database pushes until the input element loses focus (`onBlur`).

---

## 21. Citation and License

### Suggested Academic Citation
```bibtex
@software{Rodriguez2026DubbiOvi,
  author       = {Alfonso C. Rodríguez Fernández-Peña},
  title        = {DubbiOvi: Open Audiovisual Translation Environment (Version 1.2.3 Academic Edition)},
  institution  = {University of Oviedo},
  year         = {2026},
  doi          = {10.5281/zenodo.20683887},
  url          = {https://github.com/alfonsospain/DubbiOvi}
}
```

### License
Released under the **MIT License**.
Copyright © Alfonso C. Rodríguez Fernández-Peña 2026.
University of Oviedo.
