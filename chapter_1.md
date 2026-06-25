# Chapter 1: Introduction & Academic Architecture

## 1.1 About the Software

### 1.1.1 Overview and Scholarly Context
**DubbiOvi (Version 1.3.7 Academic Edition)** is a specialized, open-source Audiovisual Translation Environment (AVTE) designed to facilitate pedagogical practice, translation teaching, academic research, and knowledge transfer in philological and translation studies. Developed at the Department of English, French and German Philology of the University of Oviedo, the platform addresses a critical gap in the humanities by providing an accessible, robust, and zero-cost translation workspace for subtitling, scripting, timing, and dialogue alignment. Unlike commercial enterprise subtitling suites, which often impose prohibitive subscription licensing and require extensive data sharing, DubbiOvi is built to serve educational institutions, research labs, and independent scholars working in language science.

The application functions as a multi-modal, server-assisted translator assistant that coordinates four principal workspace components:
1.  A local video player canvas.
2.  An interactive dialogue editor (the "Takes" list) with integrated AI translation and segmentation utilities.
3.  A dedicated terminology glossary (translation memory).
4.  A synchronized, timecoded timeline showing dialogue segments mapped visually against video playback.

Through this unified dashboard, DubbiOvi supports both standard manually-timed translation workflows and AI-assisted workflows. Scholars and students can ingest raw audio/video materials, segment dialogue into discrete "takes," enforce strict terminology rules, consult large language models (LLMs) for contextual translation suggestions, and export final files to standard industry formats (e.g., SRT, VTT, Microsoft Word, and Excel spreadsheets).

---

### 1.1.2 The Local-First Architecture Paradigm
Version 1.3.7 of DubbiOvi implements a strict **local-first software design paradigm**. Originally dependent on cloud database infrastructures (specifically Firebase Firestore, which required continuous internet connectivity, user authentication, and centralized data persistence), the application was refactored in version 1.3.0 to eliminate runtime database dependencies. 

Under the local-first paradigm:
*   **Data Ownership and Privacy:** All project assets—including source dialogue scripts, target translations, translator notes, and terminology glossaries—remain strictly within the user’s local runtime environment. This design is highly critical when working with proprietary or pre-release media content, sensitive research interviews, or educational projects subject to institutional review board (IRB) privacy constraints. No project data is transmitted to or stored on external servers, except when explicit, user-initiated requests are sent to the Google Gemini API for transcription or translation.
*   **Offline Operational Capability:** The core workspace—including video playback, script editing, take splitting/merging, local file imports, and timeline synchronization—remains fully functional in environments with limited or no internet access. This reduces institutional reliance on external server uptime and network bandwidth.
*   **Zero-Latency Interactions:** By running all UI state management in the browser thread and saving changes locally, DubbiOvi avoids the network round-trip latencies associated with remote database write operations. Text inputs, timing markers, and status updates refresh instantly.

---

### 1.1.3 Local Storage Persistence and Serialization
To ensure data preservation without a centralized database, DubbiOvi utilizes the browser's native Web Storage API, specifically `localStorage`.

*   **Autosave Mechanisms:** The application implements a real-time, event-driven serialization manager. Any mutation of the workspace state—such as character name changes, text modifications in the source/target boxes, glossary additions, settings adjustments, or segmentation splits and merges—is immediately captured, serialized into a JSON payload, and saved to the user's browser under the local storage key `dubbiovi_autosave`.
*   **Restore Protocols:** Upon application initialization, the system checks for the presence of the `dubbiovi_autosave` payload. If found, it automatically parses the JSON data, restores the active workspace state (takes, glossary, settings, and active video metadata), and issues a toast notification indicating a successful restoration.
*   **The `.dubbiovi` Document Schema:** For long-term preservation, users export their workspace state into a native `.dubbiovi` project file. This file contains a version-controlled JSON schema detailing:
    *   `formatVersion`: The schema version (set to `1.2` in version 1.3.7).
    *   `createdAt`: An ISO 8601 timestamp recording the file generation date.
    *   `projectName`: The project title metadata.
    *   `videoFileName`: A string reference to the filename of the loaded video file.
    *   `settings`: Project settings (source/target languages and translator metadata).
    *   `takes`: An array of Take objects, containing unique UUIDs, start/end timecodes in seconds, character tags, original texts, translation texts, notes, and workflow statuses.
    *   `glossary`: An array of Glossary objects storing source/target term pairs and optional notes.

---

## 1.2 System Requirements & Video Compatibility

### 1.2.1 Runtime Environments
DubbiOvi operates in two primary runtime configurations:
1.  **Electron Desktop Shell:** When compiled as a desktop application (configured via `main.js` and `electron-builder.json5`), it runs within a sandboxed Chromium browser context combined with a Node.js API layer. This runtime supports local file system dialogs and system-level resource allocations.
2.  **Web Browser Client:** When hosted on a web server or run locally, the application is compatible with modern web browsers supporting ECMAScript 2022, HTML5 Video, the Web Audio API, and local storage. Chromium-based browsers (such as Google Chrome, Microsoft Edge, and Brave) are recommended for optimal performance, particularly for client-side audio decoding.

---

### 1.2.2 Browser Resource Allocation and Audio Extraction
The implementation of Automatic Speech Recognition (ASR) via Gemini 2.5 Flash requires transferring audio data from the client to the Gemini model. To avoid serverless payload size limitations (which block large video uploads) and preserve network bandwidth, DubbiOvi implements a resource-intensive **client-side audio extraction and downsampling workflow**:

1.  **Audio Decoding:** When the user initiates the "AI Transcribe" operation, the application accesses the local video file object loaded into the browser memory.
2.  **Web Audio API Processing:** Utilizing the browser's native `AudioContext` interface, DubbiOvi decodes the video file's audio track. This process extracts the raw multi-channel audio data into a decoded PCM audio buffer in the client's RAM.
3.  **Downsampling to Mono WAV:** Because Gemini’s multimodal models only require a low-bitrate voice channel for speech recognition, the raw PCM buffer is downsampled to a **16kHz mono, 16-bit linear PCM WAV format** using browser-side JavaScript. This client-side downsampling reduces the data size of the audio track by up to 90% compared to the original video file.
4.  **FormData Packaging:** The resulting downsampled WAV file is wrapped in a binary Blob object, appended to a standard `FormData` payload, and sent to the Next.js server-side action via a server-side route. This ensures that only a compact, voice-optimized audio file is sent over the network, reducing upload times and avoiding server-side memory bottlenecks.

---

### 1.2.3 Video File Compatibility and Blob Resolution
Because DubbiOvi does not upload video files to a central server, media files must be loaded and rendered entirely within the browser.

*   **Blob URL Resolution:** When a user selects a video file, the application generates a local object URL using `URL.createObjectURL(file)`. This creates a temporary pointer directly referencing the file on the user's hard drive. The browser can then stream, seek, and render the video file in the HTML5 `<video>` player without copying it to server-side storage.
*   **Codec Compatibility:** The video file must be encoded in a format natively supported by the web browser's HTML5 video decoding engine. Compatible containers and codecs include:
    *   **Containers:** `.mp4`, `.webm`, `.ogg`.
    *   **Video Codecs:** H.264 (AVC), VP8, VP9, or AV1.
    *   **Audio Codecs:** AAC, Opus, or Vorbis.
*   **Recommended Constraints:**
    *   *Video Length:* For manually-timed subtitle editing, there are no strict video length limits. However, for AI-assisted speech-to-text transcription (ASR), the video length should be kept **under 15 minutes**. Longer files can cause browser tab crashes due to JavaScript heap memory allocation limits during Web Audio API decoding. Users working on longer films should pre-segment the media into sections under 15 minutes before importing.

---

## 1.3 Academic Citations & Licensing

### 1.3.1 Scholarly Accountability and Replicability
In humanities research and translation studies, software tools must be properly documented and cited to ensure that research methodologies remain transparent, verifiable, and replicable. DubbiOvi supports these research standards by integrating static academic references and version-controlled metadata directly into the software's user interface.

*   **Version Control:** This manual applies to **Version 1.3.7 Academic Edition**, released in June 2026. The inclusion of the "Academic Edition" designation ensures that researchers can specify the exact software environment used for their translations. This is particularly important for tracking changes in AI model prompting (such as translation templates or structured output formatting) across different versions of the software.
*   **DOI (Digital Object Identifier) Integration:** DubbiOvi is cataloged in the Zenodo open-access research repository under the persistent identifier `10.5281/zenodo.20683887`. This DOI provides a stable citation link that resolves directly to the software's repository, metadata, and citation records, regardless of future changes to domain names or hosting providers.

---

### 1.3.2 Suggested Academic Citation Format
When utilizing DubbiOvi for academic publications, translation corpora construction, or philological studies, the software should be cited using the following bibliographic template:

> Rodríguez Fernández-Peña, A. C. (2026). *DubbiOvi (Version 1.3.7 Academic Edition)*. Alfonso Digital Lab, University of Oviedo. Persistent Identifier: https://doi.org/10.5281/zenodo.20683887

To facilitate this citation practice, the application features a one-click citation utility within the **About** modal dialog. Clicking the **"Copy Citation"** button copies the bibliographical block directly to the user's clipboard in standard APA format.

---

### 1.3.3 Open-Source Licensing and Terms
DubbiOvi is distributed under the **MIT License**, a permissive open-source license that encourages academic collaboration, extension, and deployment.

*   **Permissions:** Scholars, developers, and institutions are permitted to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software without payment of royalties, subject only to the inclusion of the original copyright notice and permission consent text in all copies or substantial portions of the software.
*   **Pedagogical and Research Freedom:** The MIT License guarantees that academic departments can host their own local instances of DubbiOvi on internal servers, distribute compiled Electron desktop binaries to student workstations, or modify the source code to support specific research methodologies.
*   **Disclaimer of Warranty:** In accordance with standard open-source licensing terms, the software is provided "as is," without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use of the software.
