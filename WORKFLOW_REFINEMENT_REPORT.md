# Feature Report: Workflow Refinements (v1.2.3)

This report documents the design, implementation, and verification of workflow improvements in DubbiOvi v1.2.3 Academic Edition.

---

## 1. Feature 1: Undo / Redo System
* **Implementation**: We introduced a state history tracking model in [page.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/app/page.tsx).
* **Keyboard Shortcuts**: Keydown listeners bound to `Ctrl/Cmd + Z` for Undo and `Ctrl/Cmd + Shift + Z` for Redo.
* **Scope**: Captured state snapshots of `{ takes, glossary, settings }` before merges, splits, deletions, imports, settings changes, and blurred text updates.
* **Visual Feedback**: Real-time action-specific toast notifications are rendered (e.g. `"Undo: Merge Takes"`, `"Redo: Split Take"`).
* **Firestore Syncing**: Pushes batch deletion/writes to keep the cloud backup consistent.

---

## 2. Feature 2: Merge Takes Bug Fix
* **Problem**: Merging takes updated the timeline correctly but the takes table list did not update the edited text fields.
* **Root Cause**: The textareas in [TakesList.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/TakesList.tsx) were using static `defaultValue`, which ignores parent props shifts.
* **Fix**:
  * Extracted row rendering into a controlled React subcomponent `TakeRow`.
  * Managed textarea contents via local states `localOriginal` and `localTranslation` that sync reactively using `useEffect` on changes.
  * Optimized database writes by calling `onTakeUpdate` exclusively `onBlur`.

---

## 3. Feature 3: Horizontal Timeline Navigation
* **Horizontal Scroll**: Wrapped timeline tracks inside an `overflow-x-auto` container styled with custom webkit scrollbar overrides.
* **Proportional Scaling**: Resized the timeline tracks proportionally (`duration * 15px`) to keep segments readable.
* **Auto-Centering**: Integrated `useEffect` looking at `currentIndex` to calculate centers and scroll the viewport automatically to center active takes.

---

## 4. Feature 4: Glossary Export
* **Exposed Options**:
  * **Export Glossary: CSV**
  * **Export Glossary: Excel**
  * **Export Glossary: JSON**
* **Location**: Styled directly under the header's **Export** menu dropdown.

---

## 5. Feature 5: About Menu Visibility
* Moved **About** to the top-level header Menubar.
* Layout: `Project | Export | About | Help`.
* Triggered directly via `onClick` listener on the top-level MenubarTrigger.

---

## 6. Optional Feasibility Analyses

### A. Glossary Import (CSV / XLSX / JSON)
* **Feasibility**: **HIGH**.
* **Rationale**: SheetJS is already bundled, meaning we can import CSV/XLSX spreadsheets in-browser via `XLSX.read` and standard JSON files via `JSON.parse`.
* **Conflict Resolution**: Prompt users to overwrite current terms or merge/append deduplicated entries.

### B. Glossary Term Auto-Highlighting (Future Feature)
* **Goal**: Automatically highlight terms in the Source/Target fields that match entries in the Glossary panel.
* **Feasibility**: **MEDIUM**.
* **Challenges**: HTML5 `<textarea>` tags cannot render HTML nodes (like `<span>`). Replacing textareas with rich contenteditable nodes introduces focus, blur, and cursor navigation bugs.
* **Recommended Design**: Use a read-only overlay that sits behind the textarea when not focused (matching textarea font and dimensions) which renders highlighted tokens, and display standard text input when focused.
* **Affected Files**:
  * `src/components/TakesList.tsx` (the text input elements will need custom display overlays or rich-text wrappers).
  * `src/app/page.tsx` (Glossary state would need to be tracked and passed down reactively to rows).
