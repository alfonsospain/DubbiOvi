# Release Metadata Update Report (v1.2.3)

This report logs the changes performed to align all application metadata, version labels, and citations for the official v1.2.3 release of DubbiOvi Academic Edition.

---

## 1. Version Upgrades
* **Target Version**: `v1.2.3 Academic Edition`
* **stale references updated**:
  * **Header About Description**: Updated `"v1.2.1 Academic Edition (June 2026)"` to `"v1.2.3 Academic Edition (June 2026)"` inside the dialog wrapper in [Header.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/Header.tsx).
  * **Suggested Academic Citation**: Updated `"DubbiOvi (Version 1.2.1 Academic Edition)"` to `"DubbiOvi (Version 1.2.3 Academic Edition)"` inside the pre-formatted code block in [Header.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/Header.tsx).
  * **Citation Copy Callback**: Updated the clip-board text generation helper function `"DubbiOvi (Version 1.2.1 Academic Edition)"` to `"DubbiOvi (Version 1.2.3 Academic Edition)"` in [Header.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/components/Header.tsx).
  * **Package Manifest**: Updated `"version": "0.1.0"` to `"version": "1.2.3"` in [package.json](file:///Users/alfonso/Desktop/DubiOvi/package.json).

---

## 2. Persistent Fields Verified
* **DOI Link**: Confirmed that the DOI reference remains unchanged:
  * https://doi.org/10.5281/zenodo.20683887
* **Browser Tab Title**: Verified that the root layout in [layout.tsx](file:///Users/alfonso/Desktop/DubiOvi/src/app/layout.tsx) correctly displays `"DubbiOvi Academic Edition"`.

---

## 3. Verification Results
* **Typescript Verification**: Ran `npm run typecheck` successfully with zero errors.
* **Production Build**: Ran `npm run build` successfully, outputting optimized bundles.
