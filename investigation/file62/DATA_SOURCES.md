# BTCX File 62 — provenance and reproducibility

Source case: https://github.com/suebtwist/btcx-files/issues/12

## Included in your investigation branch

| File | Bytes | Identity |
| --- | ---: | --- |
| ../../20180208_1142.bin | 24,859,995 | Original upstream source retained by your fork |
| data/file62.splat | 5,892,736 | Contributor Git blob SHA-1: 461f56d8d5d3e05daa63bae7c84524f666b7af09 |
| data/file62.ply | 45,670,235 | Contributor Git blob SHA-1: b03f134079e7396f3aef074e05380442bfe25243 |

The contributor published the exported binary objects in https://github.com/suebtwist/btcx-files/pull/13 and the fork https://github.com/benvan/btcx-files/tree/file62-gaussian-splat/discoveries/20180208_1142. These files in your branch preserve their exact Git object identities. The original repo also contains 003_state.bin, 306_state.bin, sample bins, hex dumps, parse_btcx.py, and a root index.html; these remain untouched.

## Decoder evidence reported publicly

- Decoder output: 184,148 records × 27 float32 = 19,887,984 bytes.
- Decoder output SHA-256, as reported in issue #12: c90d15fd2194817fa727c191351cb85a08eabf8b7011a5bfd53527c49150c82d
- Original input SHA-256, reported there: c945b02e56ee9ecc649149c854f235cfd305a896d86e38a334a97f6111e57fae
- Eight separator bytes: 80 BA 77 A7 2C C5 C4 14.
- XOR with A5: 25 1F D2 02 89 60 61 B1.
- Four little-endian LFSR initial states: 1F25, 02D2, 6089, B161.
- The .splat stores XYZ floats, XYZ scale floats, RGBA bytes, and quaternion bytes in 32-byte records. The .ply retains degree-3 spherical harmonics and is higher fidelity.

Those SHA-256 hashes apply to the listed files, not to the SPLAT or PLY and are published community results; this branch did not independently calculate them. Git blob SHAs are Git source identifiers, not SHA-256 file checksums. The browser calculates SHA-256 of the loaded SPLAT when possible.

## Reconstructed object claims

A published 1,414-splat selection uses strict bounds: 6 < X < 7.9, -4.6 < Y < -1, 21 < Z < 24.

The fog-removed zoom selection removes points for which 15 < Z < 32 and atan2(X,Z) > 2 degrees, explicitly preserving the selected figure. This may favor the appearance of the figure. Published reports mention a farther structure around depth 55–115 and an obscured rectangle around depth 46; identities remain unknown.

The camera origin and positive Z forward axis are inferred, not recovered historical camera metadata. All distances are scene units, not meters.

## Viewer test plan

In investigation/file62/index.html select the wide unmasked view first and save a screenshot. Capture a copy of the camera settings. Change the rendering mode but not camera/FOV to compare unmasked, figure excluded, and fog removed views. The comparison setting renders two halves with identical camera orientation, one unmasked and one with the selected 1,414-point box excluded.

Fixed experimental fly-through cameras (X,Y held at 6.95,-2.8): eye Z=18, Z=20, Z=22.5, Z=27, and look back from Z=27. Vertical FOV 38 degrees. These are experimental poses and are not part of the original captured data.

## Rendering scope

The included WebGL2 program implements an elliptical anisotropic Gaussian approximation using quaternion rotation, scale, pinhole perspective, and depth-sorted alpha blending. It uses the SPLAT degree-0 colors, not PLY degree-3 view-dependent harmonics, and is NOT pixel-identical to the original CPU renderer. Apparent walls, people or openings require further geometric validation. Flying through translucent Gaussian splats is not proof of a solid passage.

For full PLY appearance, import data/file62.ply into https://superspl.at/editor.

## Linked primary investigation material

- Original issue, source comments and evidence: https://github.com/suebtwist/btcx-files/issues/12
- Contributor export pull request: https://github.com/suebtwist/btcx-files/pull/13
- Contributor renderer/decoder source ZIP: https://github.com/user-attachments/files/34353897/file62-code.zip
- Published report PDF: https://github.com/user-attachments/files/34211501/btcx-file62-report.pdf
- Source's exact masking and renderer discussion: https://github.com/suebtwist/btcx-files/issues/12#issuecomment-6623406095

## Provenance discrepancy

Contributor README and PR describe a different input filename, 20180213_0417.bin, while the case and independent checks identify 20180208_1142.bin. Both names must remain visible in the record until origin and filename history are resolved.

No conclusion is warranted about the supposed mining-software origin, scene authenticity, or the identity of the dark object.
