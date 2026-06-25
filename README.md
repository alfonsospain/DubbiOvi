# DubbiOvi

Open Audiovisual Translation Environment

---

**DOI:** https://doi.org/10.5281/zenodo.20683887  
**Current Version:** v1.3.6 Academic Edition  
**License:** MIT License  

---

**DubbiOvi** is an open-source, AI-assisted audiovisual translation (AVT) workspace designed for translation teaching, academic research, and knowledge transfer. Developed at the University of Oviedo, it offers a local-first workspace for scripting, segmenting, translating, and aligning dialogues.

---

## Features

* **AI Transcription**: High-fidelity dialogue transcription powered by Gemini 2.5 Flash.
* **Automatic Take Segmentation**: Automatic generation of timecoded dialogue segments (takes) from audiovisual content.
* **Translation Workflow Management**: Interface for scripting, dialogue timing, and translation editing.
* **Workflow Status System**: Mark takes as **Pending**, **Reviewed**, or **Locked** for visual progress tracking.
* **Local Project Persistence**: Save and open full workspace states in local `.dubbiovi` project files.
* **Word Export (.docx)**: Export source script, target translation, or parallel comparison columns.
* **Excel Export (.xlsx)**: Export complete timed tables.
* **CSV Export**: Standard CSV exports for scripts and timelines.
* **Glossary Management**: Built-in terminology panel to store key term pairs.
* **Glossary Export**: Download terminology assets as CSV, XLSX, or JSON.
* **Merge Takes**: Easily combine adjacent takes (both text and timeline bounds) with Previous or Next.
* **Split Takes**: Visually split a take into two parts with proportional timeline calculations.
* **Professional Video Transport Controls**: Dedicated playback toolbar (Play/Pause, Rewind/FF, and Take Skipping).
* **Repeat Take**: Auto-loop dialogue segments for transcription and translation review.
* **Undo / Redo**: Local history stack supporting up to 20 previous operations with action-specific toast feedback.
* **DOI Support**: Static reference links for academic verification.
* **MIT License**: Open-source and free for academic and professional use.

---

## Screenshots

### Main Interface

### Translation Workflow

*(Project screenshots will be added later.)*

---

## Installation

### Requirements
* **Node.js**: Version 20.x or higher is recommended.
* **NPM**: Node Package Manager.

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/alfonsospain/DubbiOvi.git
   cd DubbiOvi
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The application will be available locally at `http://localhost:9002`.*

---

## Recommended Usage

### AI Transcription Limits
* **Recommended Video Length**: Dialogue transcription using Gemini 2.5 Flash works best for videos **up to approximately 15 minutes**.
* **For Longer Productions**:
  * **Import Scripts**: Pre-segment files using the text or script import feature.
  * **Section Processing**: Chop videos into segments under 15 minutes before importing.

---

## Translation Workflow

DubbiOvi is primarily an Audiovisual Translation Environment. It is fully functional with or without AI support:
* **With AI**: Leverage speech recognition (Gemini 2.5 Flash) for take transcription and translation suggestions.
* **Without AI**: Import plain text scripts or create/time dialogue takes manually to practice subtitle placement, translation editing, and transcription.

---

## Citation

Suggested academic citation:

> Rodríguez Fernández-Peña, A. C. (2026). *DubbiOvi (Version 1.3.6 Academic Edition)*. Alfonso Digital Lab, University of Oviedo. DOI: https://doi.org/10.5281/zenodo.20683887

---

## Developer

* **Developer**: Alfonso C. Rodríguez Fernández-Peña
* **Affiliation**: Department of English, French and German Philology, University of Oviedo
* **Contact**: [rodriguezalfonso@uniovi.es](mailto:rodriguezalfonso@uniovi.es)
* **License**: MIT License
