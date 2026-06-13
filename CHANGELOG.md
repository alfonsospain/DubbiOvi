# CHANGELOG

All notable changes to the **Dubbing Studio Pro (DubiOvi)** project will be documented in this file.

---

## [1.0.0-phase1] - 2026-06-13

### Fixed
- **Missing Firebase Import**: Added the missing import of `deleteDoc` from `'firebase/firestore'` in `src/app/page.tsx` to resolve runtime errors when deleting takes.
- **Invalid Collection Query**: Refactored the invalid `getDoc` call on a collection reference in `handleTakesChange` inside `src/app/page.tsx`, removing the dead/broken query and ensuring successful script/JSON imports.
