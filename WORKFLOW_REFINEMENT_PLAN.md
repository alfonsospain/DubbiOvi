# Implementation Plan: Workflow Refinement (DubbiOvi v1.2.3)

This document details the architectural choices, mathematical equations, and file-by-file changes required to implement workflow refinements in DubbiOvi.

---

## 1. Feature Specifications & Architectural Choices

### A. Undo / Redo System
* **Keyboard Shortcuts**:
  * `Ctrl + Z` (or `Cmd + Z` on macOS) $\rightarrow$ Undo
  * `Ctrl + Shift + Z` (or `Cmd + Shift + Z` on macOS) $\rightarrow$ Redo
* **State Scope**:
  * Keeps a history stack of states containing:
    ```typescript
    interface HistoryState {
      takes: Take[];
      glossary: GlossaryEntry[];
      settings: ProjectSettings;
      actionName: string;
    }
    ```
  * Depth limit of 20 states.
* **Action-Specific Visual Feedback**:
  * When pushing to the stack, we record a clear label:
    * `"Merge Takes"`
    * `"Split Take"`
    * `"Delete Take"`
    * `"Text Edit"`
    * `"Glossary Edit"`
    * `"Import Takes"`
    * `"Project Settings Update"`
  * On Undo, displays: `Undo: [actionName]` (e.g. `"Undo: Merge Takes"`).
  * On Redo, displays: `Redo: [actionName]` (e.g. `"Redo: Merge Takes"`).
* **Database Synchronization**:
  * Restored states are written as batch updates to Firestore to keep database and local workspace aligned.

### B. Merge Takes Bug Fix
* **Problem**: Textareas in [TakesList.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/TakesList.tsx) use React `defaultValue={take.original}`, which only renders once. When takes are merged, the text is not updated in the UI list.
* **Solution**:
  1. Refactor table rows in `TakesList.tsx` into a `TakeRow` subcomponent.
  2. Implement controlled textareas inside `TakeRow` using React state `localOriginal` and `localTranslation` synchronized with parent props using `useEffect`.
  3. Propagate changes (`onTakeUpdate`) only `onBlur` to optimize database operations and typing response.

### C. Horizontal Timeline Navigation
* **Horizontal Scrollbar**: Wrap timeline track elements inside an `overflow-x-auto` container with scrollbars.
* **Zooming**: Scale width proportionally: `const timelineWidth = Math.max(100, duration * 15)`.
* **Auto-Centering**: Use `useEffect` to scroll the active segment into focus:
  $$\text{scrollTarget} = \text{offsetLeft} - \frac{\text{containerWidth}}{2} + \frac{\text{segmentWidth}}{2}$$

### D. Glossary Export
* **Location**: Added under **Export** menu in the header.
* **Formats**: CSV, XLSX (Excel), and JSON.

### E. About Menu Visibility
* Move **About DubbiOvi** trigger directly to the top-level Menubar trigger for single-click visibility.

---

## 2. Optional Feasibility Analyses

### A. Glossary Import (CSV / XLSX / JSON)
* **Feasibility**: **HIGH**.
* **Method**: SheetJS is already present in the project. We can parse CSV/XLSX spreadsheets in-browser via `XLSX.read` and standard JSON files via `JSON.parse`.
* **Conflict Resolution**: Prompt the user to either:
  1. *Overwrite*: Clear existing glossary.
  2. *Merge*: Append new terms, resolving conflicts by overwriting duplicate source terms.

### B. Glossary Term Auto-Highlighting (Future Feature)
* **Goal**: Automatically highlight terms in the Source Text and Target Text fields that match terms defined in the Glossary panel.
* **Feasibility**: **MEDIUM**.
* **Implementation Challenges**:
  * Standard HTML `<textarea>` elements cannot render styled/highlighted rich text (e.g. `<span>` elements).
  * Replacing textareas with rich contenteditable divs (like standard draft.js or lexical) introduces significant complexity regarding keyboard navigation, cursors, and blur events.
* **Recommended Architecture**:
  * Keep the editing textareas simple, but render a read-only overlay behind or above the textarea while not editing.
  * Alternatively, construct a custom visual "Highlight/Display Mode" that overlays matches when the field is not focused, and switches to a standard `<textarea>` when focused.
  * Matching search can use a regular expression created from glossary terms, escaping special characters:
    ```typescript
    const regex = new RegExp(`\\b(${terms.map(escapeRegExp).join('|')})\\b`, 'gi');
    ```
* **Affected Files**:
  * `src/components/TakesList.tsx` (the text input elements will need custom display overlay overlays or rich-text wrapping).
  * `src/app/page.tsx` (Glossary state would need to be tracked and passed down reactively to rows).

---

## 3. Affected Files

1. **`src/app/page.tsx`** [MODIFY]
   * Implement history stacks `past` and `future`.
   * Bind keydown listeners for Ctrl/Cmd + Z and Ctrl/Cmd + Shift + Z.
   * Implement push helpers to record states and display action-specific toast notifications.
2. **`src/components/Header.tsx`** [MODIFY]
   * Reorganize menus to show **About** at the top level.
   * Add glossary export menu options.
3. **`src/lib/export-utils.ts`** [MODIFY]
   * Implement glossary CSV, XLSX, and JSON export utilities.
4. **`src/components/TakesList.tsx`** [MODIFY]
   * Refactor rows into controlled `TakeRow` subcomponents to fix the text merge refresh bug.
5. **`src/components/Timeline.tsx`** [MODIFY]
   * Implement horizontal scrolling, zoom-based layout widths, and active segment auto-centering.
