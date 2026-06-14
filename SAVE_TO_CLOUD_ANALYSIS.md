# Cloud Save Functionality Analysis: DubbiOvi

This report analyzes the current "Save to Cloud" feature, explaining where and how project data is persisted, what elements are covered, recovery behaviors, and its relation to local project files.

---

## 1. Does Save to Cloud Currently Work?
**Yes, but with nuances.**
- The manual **"Save to Cloud"** button in the Header triggers the `saveToCloud` function in [page.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/app/page.tsx#L99-L121). This function explicitly writes the `settings` object to Firestore, updates the `lastSaved` state, and fires a success toast.
- However, **all other workspace edits** (takes, translations, statuses, and glossary changes) are **already autosaved in real-time** to Firestore via Firestore state change handlers:
  - `handleTakesChange` (triggered by imports/ASR) writes changes in a batch.
  - `handleTakeUpdate` (triggered on textarea blurs or status changes) updates specific document fields.
  - `handleGlossaryChange` (triggered by glossary edits) writes glossary entries.
  - `handleSettingsChange` (triggered by settings edits) writes settings.
- Therefore, the workspace is fully self-saving. The manual "Save to Cloud" button is primarily a visual assurance tool for the user and a trigger to update the "Saved X minutes ago" helper text in the header.

---

## 2. Where is the Data Stored?
* **Firestore**: **Yes (Primary Storage)**. All workspace configuration, takes, and glossary entries are saved in Firestore under the `projects/main-project` document path and its subcollections (`projects/main-project/takes` and `projects/main-project/glossary`).
* **Firebase Storage**: **No**. Video or extracted audio files are never uploaded or stored in Firebase Storage.
* **Local Storage / Session Storage**: **No**. The browser's local and session storage APIs are not used for persistence.
* **Other**: The video file is referenced purely in-memory using local browser Object URLs (`blob:` URLs). 

---

## 3. Which Project Elements are Currently Saved?
* **takes**: **Yes** (Autosaved to Firestore in real-time).
* **translations**: **Yes** (Stored as part of the take document, autosaved on textarea blur).
* **glossary**: **Yes** (Autosaved to Firestore in real-time).
* **settings**: **Yes** (Autosaved on change, and manually written by the Cloud Save trigger).
* **statuses**: **Yes** (Stored as part of the take document, autosaved on dropdown changes).

---

## 4. Can a User Close the Browser and Recover the Project Later?
* **For Text/Metadata (Takes, Translations, Statuses, Glossary, Settings)**: **Yes**. Since all text data is bound to real-time Firestore listeners, when the page is reopened, the application automatically pulls and restores the exact state from the cloud database.
* **For the Video File**: **No**. Since the video file is kept as a local memory reference (`blob:` URL), closing the browser revokes the URL. When the user returns, they will see all their synced text takes and translations, but the video player will be empty. The user must reload the local video file to restore synchronization.

---

## 5. Is Save to Cloud Redundant Once Local `.dubbiovi` Project Files Exist?
**No. They serve complementary purposes:**
1. **Save to Cloud (Firestore)**:
   * Provides **frictionless, automatic cloud sync**. The user does not have to remember to export anything; they can close their laptop and continue working on another machine instantly.
   * Protects against sudden browser crashes or data loss.
2. **Local `.dubbiovi` Project Files (JSON exports)**:
   * Serves as **immutable backups/snapshots** that the user can share, archive, or restore to a specific milestone.
   * Enables **offline capability** (working completely disconnected from Firebase services).
   * Prevents database bloat and allows easy project management for different video releases.
