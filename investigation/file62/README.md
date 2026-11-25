# BTCX File 62 — browser investigation

This directory contains the complete public File 62 decoded exports, an independent Gaussian-splat viewer, reproducible source checks, and an evidence ledger.

## Open the viewer

After this branch is merged into main and GitHub Pages publishes successfully, open:

https://orbiterdevelopment.github.io/btcx-files/investigation/file62/

If the Pages workflow fails on a new fork, visit repository Settings → Pages and select GitHub Actions as the build source, then rerun the Publish BTCX File 62 Explorer workflow.

The browser downloads the 5.89 MB SPLAT from the SAME repository website; it does not require Python, Colab, SuperSplat, or an external service. WebGL2 with hardware acceleration is required. Chrome is recommended. If auto-load fails, use the in-app local file picker or the external viewer link.

## Sources gathered

- data/file62.splat — packed 32-byte-per-record Gaussian splats, 5,892,736 bytes, 184,148 records.
- data/file62.ply — high-fidelity Gaussian splat data with degree-3 spherical harmonics, 45,670,235 bytes.
- ../../20180208_1142.bin — original first 24.86 MB sample from the source repository.
- data/analysis-summary.json — verified region statistics from the GitHub Actions run.
- analyze.py — pure Python reproduction of figure selection, source SHA-256, Git object hashes, opacity statistics and point-center connectivity.
- DATA_SOURCES.md — file identity, published decoding details, provenance contradictions, and investigation limits.
- index.html / viewer.js — real-time GPU anisotropic Gaussian-splat viewer.

Original material: https://github.com/suebtwist/btcx-files/issues/12
Published exports: https://github.com/suebtwist/btcx-files/pull/13
Contributor's full renderer/decoder code (linked, not copied): https://github.com/user-attachments/files/34353897/file62-code.zip
Contributor's report PDF (linked, not copied): https://github.com/user-attachments/files/34211501/btcx-file62-report.pdf

## What to test

Use full unmasked view before trying masks. For the supposed figure, choose "Figure — origin, aimed at region", save a PNG, and then use side-by-side comparison. Keep the same camera and FOV. The viewer also offers a fixed experimental fly-through Z = 18, 20, 22.5, 27 and a backward view.

To distinguish a humanoid, architecture, and cloud-shaped artifacts, evaluate geometry across small controlled angular changes, inspect splat-scale and opacity, and compare matched regional controls. Do not treat flying through Gaussian splats as evidence of physical walls or a true recording.

## Verification

The automated GitHub workflow ran successfully with the actual binary data and confirmed: correct source checksums, 184,148 records, 1,414 splats in the published box, 23,758 splats in the published zoom fog-removal rule, and neighboring-control statistics. View the results at:

https://github.com/orbiterdevelopment/btcx-files/actions/runs/45570878866

To re-run locally with Python 3 (no packages required):

    python3 investigation/file62/analyze.py

To check the JavaScript syntax:

    node --check investigation/file62/viewer.js

## Important limitations

- This renderer is independently implemented with WebGL2 and is not a pixel-identical reproduction of the original investigator's CPU renderer.
- The .splat format omits degree-3 SH, so the PLY in SuperSplat remains the higher-fidelity visual reference.
- Its 3D point positions and possible buildings are not validated as real physical locations.
- The source's claimed 2018 Bitcoin-mining provenance is unverified.
- The "figure" classification is tentative and subject to selection bias.
- GitHub Pages is not yet enabled for this fork until the deployment is confirmed.

Keep all interpretations separate from source byte-level observations.
