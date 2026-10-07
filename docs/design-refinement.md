# Interface refinement

This pass refines the existing Macintosh exhibit's readability and interaction flow. It preserves the hardware descriptions, original illustration, and working framebuffer model. It is an educational architecture project, not a Macintosh emulator.

## Findings and changes

- Small, muted interface text made controls and explanatory copy harder to scan. The visual refinement increases their prominence and clarifies selected states, using warm paper, classic window details, and a six-colour rainbow palette.
- The original pixel experiment sat separately below the exhibit, making the relationship between editing and the screen harder to follow. Pixel mode now brings the full bitmap, outlined region, magnified editor, byte controls, and change feedback into one workspace.
- The component inspector mixed immediate facts with longer explanation. Summaries and specifications now lead; Architecture notes expand on request, and a related action opens an experiment or signal story.
- Guided stories competed with the component inspector. Story mode now uses that inspector area for its explanation and controls. Component selection returns to Explore, and completed stories offer an explicit restart.
- Editing had no recovery action. A bounded undo history covers pixel and byte changes, presets, and reset. Session progress also marks the parts already inspected.

## Evidence and limits

All 15 automated model/data tests pass. Browser checks confirmed that bit 7 changes a selected byte from `$00` to `$80` while retaining focus on its button; Undo restores `$00` and disables when history is empty. The screen preview's Right Arrow moves the patch from X = 240 to 248. In the editor, Right Arrow followed by Space toggles pixel (249, 160). Entering X = 481 produces coordinate validation.

Desktop and 390-pixel phone viewport review confirmed readable layout without horizontal overflow. Browser checks also covered assembled/open visibility, all three journeys through completion and restart (7, 6, and 5 stages), Play/Pause, preset undo, and contextual navigation from RAM into the pixel workspace. A label hit-area bug found during review was fixed and retested: each button now encloses only its visible label, with the leader outside the hit area. No browser errors were observed.

These observations do not establish complete assistive-technology, cross-browser, or historical-emulation coverage. Model tests check bitmap behavior and data consistency; browser inspection checks the interface that exposes those models.
