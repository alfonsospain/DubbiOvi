# PRODUCT STRATEGY & ROADMAP: Dubbing Studio Pro (DubiOvi)

This document outlines the strategic vision for **Dubbing Studio Pro** (`DubiOvi`), positioning it within the professional localization market and evaluating its potential as an academic research and teaching tool.

---

## 1. Product Definition & Market Need

### 1.1. The Problem Space
Translating and adapting scripts for audiovisual dubbing (dubbing translation) differs significantly from traditional text localization or standard subtitling:
- **Temporal Sync**: Script lines must fit the visual duration of the speaker's take.
- **Linguistic Constraints**: Translations must balance semantic accuracy with phrasing lengths that align with lip movement (lip-sync) and character acting guides.
- **Linguistic Consistency**: Maintaining specific terms (names, lore, slang) across thousands of takes.
- **AI Assist Gaps**: General AI translation engines lack the context of video timestamps, speaker characteristics, and glossary boundaries.

`DubiOvi` addresses these challenges by offering a web-based, collaborative environment that integrates local video rendering, structured timing tables, terminology control, and GenAI suggestions.

### 1.2. Target Audience
1. **Audiovisual Translators (AVT)**: Professionals requiring clean, side-by-side editing workflows with time-synced video references.
2. **Dubbing Studios & Voice Directors**: Users who need structured, exported scripts (SRT, VTT, or dialog-style text) containing metadata, character notes, and timestamps for recording sessions.
3. **Academic Educators & Researchers**: Instructors teaching AVT modules, and researchers studying machine translation post-editing (MTPE) behaviors.

---

## 2. Competitive Landscape Analysis

| Tool | Focus | Strengths | DubiOvi Differentiation |
| :--- | :--- | :--- | :--- |
| **MemoQ / Trados** | General CAT (Computer-Assisted Translation) | Industry-standard Translation Memory (TM) and Terminology databases. | Highly text-centric; video integration is a secondary, clunky plugin. `DubiOvi` integrates the video player as a primary, layout-driving element. |
| **Subtitle Edit** | Desktop Subtitling | Massive format support, spectrogram analysis, open-source. | Primarily a desktop application (Windows-first). Lacks collaborative cloud-native synchronization. `DubiOvi` is modern, browser-native, and runs on any platform. |
| **Ooona** | Enterprise AVT Web Suite | High-end cloud collaboration, professional subtitling compliance. | Very expensive subscription model, steep learning curve. `DubiOvi` offers a lightweight, developer-accessible, self-hostable alternative. |
| **DeepDub / Papercup** | Fully Automated Synthetic Voice Dubbing | Automatic speech-to-speech dubbing via synthetic voices. | Replaces human translators and voice actors. `DubiOvi` serves as an *assistant* for human-in-the-loop adaptation, preserving acting quality and creative control. |

---

## 3. Core Feature Roadmap

```text
[ Phase 1: MVP Core ] ───> [ Phase 2: Professional AVT ] ───> [ Phase 3: Advanced Research / AI ]
- Local Video Rendering     - Timeline Waveforms & Zoom         - Automated Lip-Sync Timing Check
- Side-by-Side Editing      - Collaborative Shared Workspaces   - Cognitive Effort Metric Logs
- Gemini suggestions        - Custom Metadata Exporter          - Audio Pause Silence Detection
- Glossary mapping          - Multi-tenant Auth Walls           - API/Plugin CAT connectors
```

### 3.1. Phase 1: Essential Features (MVP v1.0)
* **Real-time Sync**: Direct links between playhead timecodes and active take highlighting.
* **GenAI suggestions**: Serverless Gemini prompts referencing source language, target language, and glossary guidelines.
* **Glossary Enforcement**: Absolute glossary mapping checks using regex overrides.
* **Multi-Format Ingestion & Export**: Local `.docx` script reading via Mammoth, exporting to SRT, VTT, JSON, and Text formats.

### 3.2. Phase 2: Optional Features (v1.5)
* **Timeline Waveforms & Zoom**: Interactive audio visualizer detailing amplitude shifts, with mouse-wheel scaling.
* **Multi-Tenant Authentication**: Sign-in integrations to restrict project routes by user.
* **Export Customizers**: Checkboxes to toggle timestamps, notes, or character sheets in exports.

### 3.3. Phase 3: Future Research Features (v2.0+)
* **Smart Pauses & Silence Injection**: GenAI analysis of audio gaps to suggest adjustments for natural translation breaks.
* **Lip-Sync Fitting Checks**: Models verifying syllable count equivalency between source and target script lines.
* **Linguistic Corpora Connections**: API links to academic translation memory registers.

---

## 4. MVP (Version 1.0) Specifications

To release version 1.0 of the application, the following functions must be stabilized:
1. **Zero-Crash Take Management**: Restoring take deleting capabilities and import procedures by resolving existing Firebase query bugs.
2. **Database Conservation**: Implementing a debounce layer (e.g. 500ms delay) on Settings and Takes inputs to minimize Firestore pricing costs.
3. **Onboarding Context**: Automatic loading of `DEFAULT_TAKES` on empty Firestore initialization.
4. **Sentiment Assist Exposure**: Displaying the `SentimentDisplay` module under Takes cells so users can verify if translation tones match the original script.
5. **Standardized Browser Compatibility**: Using local UUID libraries rather than client-dependent `crypto` functions.

---

## 5. Academic & Pedagogical Potential

`DubiOvi` is highly suited for universities, research labs, and training programs due to its light, zero-installation footprint.

### 5.1. Research Uses
- **Human-AI Collaboration Studies**: Researchers can use the tool to analyze how glossary matches and GenAI suggestions affect translator productivity and cognitive load.
- **Translation Quality Assessment (TQA)**: Comparing human-adapted scripts with Gemini-generated translations across different languages.
- **Audiovisual Corpora Building**: Using the structured Firestore schema to compile multilingual translation memory datasets for academic study.

### 5.2. Teaching & Training Uses
- **Audiovisual Translation (AVT) Modules**: Students can practice script adaptation, character constraint mapping, and timecode syncing.
- **Zero-Setup Labs**: Since the app runs in the browser, universities do not need to install local desktop software. Students can work on any laptop (Mac, Windows, Linux, Chromebook).
- **Post-Editing Training**: Instructing students in Machine Translation Post-Editing (MTPE) techniques using real-time AI suggestions.

---

## 6. Recommendations for Public Release

### 6.1. GitHub Hosting Strategy
- **Open Codebase**: Host the project in a public repository with clear directory mappings.
- **Setup Scripts**: Provide simple `npm` commands or Docker configurations to ease local environment launching.
- **Issue Templates**: Categorize feedback paths (e.g., Bug Reports, Feature Suggestions, AI Prompt Tweaks).

### 6.2. Licensing Strategy
The choice of license should align with the project's goals for adoption and contributions:

- **Option A: Apache License 2.0 (Recommended)**
  * *Why*: Permissive license that allows commercial, academic, and private use. It includes an explicit grant of patent rights and protects contributors. It encourages adoption by companies and universities alike.
- **Option B: GNU GPL v3**
  * *Why*: Copyleft license. Any modified versions or extensions of the software must also be open-source. This ensures academic extensions remain public property, but may deter commercial integration.

### 6.3. DOI Publication & Citations
For academic recognition, the software should be publishable in scientific literature:
1. **Zenodo Integration**: Link the GitHub repository to [Zenodo](https://zenodo.org/) to automatically generate a **Digital Object Identifier (DOI)** for each release. This allows researchers to cite the software in publications.
2. **Companion Paper**: Submit a short software paper to the [Journal of Open Source Software (JOSS)](https://joss.theoj.org/) or present it at audiovisual translation conferences (e.g., *Languages & the Media*, *EST*, *AMTA*).
3. **Citation Format**: Add a `CITATION.cff` file to the repository root so users can easily cite the tool in APA/BibTeX format.
