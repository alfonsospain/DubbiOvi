# UI POLISH & ACADEMIC RELEASE REPORT: DubbiOvi v1.2.1

This report details the final user interface refinements and academic release branding implemented on the **feature-asr** branch of **DubbiOvi**.

---

## 1. UI Simplification & Local-First Focus
To present a clean, academic, local-first workflow, the following enterprise-style features and cloud indicators have been completely removed from the user interface:
- **My Account** dropdown menu (user profile settings).
- **Settings (user account)**, **Support**, and **Logout** options.
- **Not Synced** / **Synced** status indicators.
- **Cloud Backup** button from the right-hand header workspace.
- **Cloud** backup dropdown option from the Menubar.

---

## 2. Academic Information Panels (Help Menu)
Replaced the Cloud menu with a new **Help** menu containing:

### 2.1. About DubbiOvi Dialog
Provides full academic attribution and metadata:
- **Version**: `v1.2.1 Academic Edition`
- **Release Date**: June 2026
- **Software Type**: Open Source Software
- **Developed Within**: Alfonso Digital Lab
- **Developer**: Alfonso C. Rodríguez Fernández-Peña
- **Affiliation**: Department of English, French and German Philology, University of Oviedo
- **Contact & Repository**: Includes clickable mailto link and Github link.
- **DOI**: Clickable Digital Object Identifier (https://doi.org/10.5281/zenodo.20683887).
- **Academic Citation Section**: Shows a copyable text citation:
  ```text
  Rodríguez Fernández-Peña, A. C. (2026).
  DubbiOvi (Version 1.2.1 Academic Edition).
  Alfonso Digital Lab, University of Oviedo.
  https://doi.org/10.5281/zenodo.20683887
  ```
  Includes a **"Copy Citation"** button that writes the formatted text to the clipboard and fires a success toast.
- **Footer**: `Built with Next.js, TypeScript, Firebase and Gemini 2.5 Flash. University of Oviedo · 2026`.

### 2.2. Help & Contact Dialog
Provides direct support information for academic collaborations, partnerships, and bug reporting:
- Contains developer details, email address (clickable mailto), and GitHub repository link (clickable link).

---

## 3. Academic Branding: SVG Favicon
- Created a scalable SVG monogram `icon.svg` displaying a stylized **"DO"** (DubbiOvi) monogram with an embedded soundwave in the **"O"** letter on a dark round background.
- Registered the favicon path inside `src/app/layout.tsx` metadata to override default icons and display beautifully in browser tabs, bookmarks, and mobile devices in both dark and light modes.
- Deleted the old `favicon.ico` to ensure clean browser resolution.

---

## 4. Verification Results
- **TypeScript Compilation**: `npm run typecheck` completed with **zero errors**.
- **Production Build**: `npm run build` compiled successfully with **zero errors**.
