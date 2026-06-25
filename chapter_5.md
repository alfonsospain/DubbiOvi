# Chapter 5: Quality Assurance, Security, & Glossary Enforcement

## 5.1 Managing the Translation Memory (Glossary Tab)

### 5.1.1 Inline CRUD Mechanics
The **Glossary** tab manages terminology rules to ensure translation consistency. The glossary interface supports direct inline CRUD (Create, Read, Update, Delete) operations within a spreadsheet-style grid layout:

*   **Read (Display):** The interface renders glossary records from the active state as table rows.
*   **Create (Addition):** The last row of the glossary table is a data entry form. The user enters a source term, its preferred translation, and optional context notes. Clicking the **Plus ("+")** icon button calls `handleAddEntry`:
    *   Verifies that both `sourceTerm` and `targetTerm` are not empty.
    *   Generates a unique ID using `crypto.randomUUID()`.
    *   Appends the new entry to the glossary array and updates the workspace state.
*   **Update (Modification):** The input fields in each row are active textboxes. Changing a value triggers `handleUpdateEntry`:
    *   The function receives the target entry ID, the modified field name, and the new value.
    *   It updates the matching entry in the glossary array while keeping the rest of the array unchanged.
*   **Delete (Removal):** Clicking the **Trash** icon button on a row triggers `handleDeleteEntry`, which filters out the entry by ID and updates the glossary array.

---

### 5.1.2 Glossary Enforcement Framework
The glossary acts as an active constraint system during translation. In addition to serving as a reference for the translator, glossary rules are enforced during AI-assisted translation:

1.  **Prompt Context Injection:** When a user requests an AI translation suggestion, the active glossary terms are formatted as system instructions and injected into the Gemini API prompt template.
2.  **Server-Side Post-Processing Fallback:** Because generative language models can occasionally fail to follow terminology rules, the server action applies a validation step. It runs a case-insensitive, word-boundary search-and-replace on the returned translation string:
    ```typescript
    const regex = new RegExp('\\b' + entry.sourceTerm + '\\b', 'gi');
    translation = translation.replace(regex, entry.targetTerm);
    ```
    This regex ensures that the preferred target term is used in the final translation.

---

## 5.2 Progress Tracking & Quality Dashboards

### 5.2.1 Completion Percentage Mathematics
The progress dashboard at the top of the Takes tab provides a real-time summary of the project's translation status. The completion percentage is calculated using the following formula:

$$\text{Completion Percentage} = \begin{cases} 
0, & \text{if } N_{\text{total}} = 0 \\
\text{round}\left( \frac{N_{\text{translated}}}{N_{\text{total}}} \times 100 \right), & \text{if } N_{\text{total}} > 0 
\end{cases}$$

Where:
*   $N_{\text{total}}$ is the total number of takes in the project.
*   $N_{\text{translated}}$ is the number of takes where the `translation` text field contains non-whitespace characters.

---

### 5.2.2 Dynamic Segmented Progress Bar
To show the distribution of take statuses, the dashboard renders a segmented, multi-colored progress bar. The width of each status segment is calculated proportionally:

```text
Progress Bar:
[  Locked (Green)  ][  Reviewed (Blue)  ][  Translated (Purple)  ][  Untranslated (Gray)  ]
```

1.  **Locked Segment (Green):** Displays the proportion of finalized takes.
    $$\text{Width}_{\text{locked}} = \frac{N_{\text{locked}}}{N_{\text{total}}} \times 100\%$$
2.  **Reviewed Segment (Blue):** Displays the proportion of verified takes.
    $$\text{Width}_{\text{reviewed}} = \frac{N_{\text{reviewed}}}{N_{\text{total}}} \times 100\%$$
3.  **Translated Pending Segment (Light Purple):** Displays the proportion of translated takes that are still marked as Pending.
    $$\text{Width}_{\text{translated\_pending}} = \frac{N_{\text{translated\_pending}}}{N_{\text{total}}} \times 100\%$$
4.  **Untranslated Segment (Gray):** Represents the remaining untranslated takes.
    $$\text{Width}_{\text{untranslated}} = 100\% - \left(\text{Width}_{\text{locked}} + \text{Width}_{\text{reviewed}} + \text{Width}_{\text{translated\_pending}}\right)$$

---

## 5.3 Workflow Lifecycle & Editorial Controls

### 5.3.1 The Three-Tier Status Lifecycle
DubbiOvi uses a three-tier status lifecycle to manage the workflow stages of each take:

```text
[ Pending (Gray Clock) ] ──(Verification)──> [ Reviewed (Blue Check) ] ──(Approve)──> [ Locked (Padlock) ]
```

*   **Pending (Gray Clock Icon):** The default status for newly generated, imported, or split takes. Indicates that the translation needs to be entered or reviewed.
*   **Reviewed (Blue Checkmark Icon):** Indicates that the translation has been verified for accuracy, timing, and glossary compliance.
*   **Locked (Green Padlock Icon):** Indicates that the take is approved and finalized.

---

### 5.3.2 Transition Logic and Architectural Lockout
*   **Manual Transitions:** Users can change a take's status at any time using the status dropdown menu in the row.
*   **System Resets:** Certain actions reset a take's status to preserve data integrity:
    *   Requesting an AI translation suggestion resets the take status to `'Pending'`.
    *   Splitting a take resets both resulting segments to `'Pending'`.
*   **Locked Lockout Rules:** Setting a take's status to `'Locked'` enables safeguards to prevent accidental changes:
    *   The character input, source text, and target text areas are set to `readOnly`.
    *   The fields are styled with a dashed border and a grey background (`bg-secondary/20 cursor-not-allowed`).
    *   In the actions dropdown menu, the **Split Take**, **Merge with Previous**, **Merge with Next**, and **Delete Take** options are disabled.
    *   AI translation suggestions are blocked.

---

## 5.4 Global Workspace Protection Systems

### 5.4.1 Real-Time Local Storage Autosave Engine
To prevent data loss from browser crashes, accidental navigation, or power interruptions, DubbiOvi implements an automatic caching system:

1.  **State Mutation Triggers:** Any action that modifies the workspace state calls the `syncAutosave` utility.
2.  **JSON Serialization:** The utility serializes the settings, takes, glossary, and video filename into a single JSON object.
3.  **Local Storage Write:** The serialized string is saved in the browser's persistent cache under the key `dubbiovi_autosave`:
    ```typescript
    localStorage.setItem('dubbiovi_autosave', JSON.stringify(payload));
    ```

---

### 5.4.2 Undo/Redo Historical Stack Architecture
DubbiOvi includes an Undo/Redo history manager that tracks changes to settings, takes, and glossary terms:

*   **Stack Configuration:** The history manager maintains three states:
    *   `past`: An array of historical state snapshots.
    *   `present`: The current active state.
    *   `future`: An array of redone state snapshots.
*   **Memory Depth Limits:** The `past` stack stores up to 20 historical states. When a new change is saved, the state is pushed to the `past` array and the `future` array is cleared. If the stack size exceeds 20, the oldest state is removed.
*   **Keyboard Hotkey Listeners:** The application registers a global keyboard event listener:
    *   **Undo:** Jumps back to the previous state. Triggered by `Cmd + Z` (macOS) or `Ctrl + Z` (Windows/Linux).
    *   **Redo:** Jumps forward to the next state. Triggered by `Cmd + Shift + Z` (macOS) or `Ctrl + Shift + Z` (Windows/Linux).
*   **Autosave Re-Synchronization:** When an undo or redo action is triggered, the restored state is written to the active workspace and immediately saved to `localStorage` via the autosave engine.
*   **Action Feedback:** The application displays a toast notification detailing the action that was undone or redone (e.g., `Undo: Split Take` or `Redo: Merge Takes`).
