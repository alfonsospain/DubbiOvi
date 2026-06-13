# LOCAL PROJECT PERSISTENCE & EXPORT REPORT: DubbiOvi v1.2

This report details the implementation of the local-first persistence phase and spreadsheet export features on the **feature-asr** branch of **DubbiOvi**.

---

## 1. Local-First Architecture Transitions
* **Source of Truth**: The workspace utilizes local `.dubbiovi` files as the primary mechanism for project backups, snapshots, and sharing.
* **Secondary Cloud Sync**: Firestore support remains fully integrated, running automatically in the background or triggered manually via the **Cloud Backup** button.

---

## 2. Implemented Features & Technical Details

### 2.1. Project Menu Controls
Added a new top-level **Project** menu with the following items:
- **New Project**: Resets all state variables (takes, settings, glossary, player state) and clears corresponding Firestore collections in a single batch transaction.
- **Open Project**: Displays a file picker input accepting `.dubbiovi` extensions. Parsed file contents are validated and restored to local memory and Firestore collections.
- **Save Project**: Serializes takes, settings, glossary, and current video file name reference to a `.dubbiovi` file and starts browser download using the project name as the filename.
- **Save Project As...**: Prompts the user for a new project name via a browser input dialog, updates the settings (both locally and in the Firestore database), and downloads the project file under the new name.

### 2.2. Export Options Menu
Added a new top-level **Export** menu with the following items:
- **Excel (.xlsx)**: Integrates SheetJS (`xlsx`) to package takes data into a native binary Excel sheet. Columns included: *Take ID, Character, Start Time, End Time, Source Text, Target Text, Status*. Widths are auto-padded for optimal readability.
- **CSV**: Converts takes data to standard comma-separated text formatting (complying with RFC 4180 escaping rules) and starts browser download.

### 2.3. Project Name Settings & Display
- Updated `src/components/ProjectSettings.tsx` to bind the first text input to `projectName` (synchronized with `title` for backward compatibility).
- Displayed the current active project name prominently in the header in a styled project display tag: `Project: [name]`.

---

## 3. Approved Plan Adjustments & Validation

### 3.1. Backward Compatibility
- Developed the project loader in `src/app/page.tsx` to automatically resolve and parse legacy `.dubbiovi` files containing `title` inside settings or base layers. If no `projectName` is available, it maps `title` as the fallback project name to prevent crashes.

### 3.2. File Version & Created Timestamp Metadata
- `.dubbiovi` exports now embed:
  - `"formatVersion": "1.2"`
  - `"createdAt": "ISO-TIMESTAMP"`
  These metadata values are preserved at the root of the JSON payload.

### 3.3. Glossary Persistence & Restoration
- Explicitly verified glossary serialization:
  - Export: glossary entries are successfully written to the `.dubbiovi` JSON file.
  - Import: opens a batch write that deletes previous database glossary records, writes the new file entries, and triggers a state refresh. The glossary auto-updates inside the workspace instantly.

### 3.4. Video Reload Warning Banner
- If a `.dubbiovi` file contains a video filename reference, and the user opens it on a fresh session without the video loaded, the UI renders an warning banner above the player: `⚠️ Please reload video file: episode01.mp4`.
- The banner remains visible until a video file with the matching name is loaded, providing clear usability direction.

---

## 4. Verification Results
- **TypeScript Compiler Check**: `npm run typecheck` completed with **zero errors**.
- **Production Build compilation**: `npm run build` completed successfully, compiling the home router and all static files with **zero errors**.
