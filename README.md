# Temple Path

A Three.js browser prototype for patient-paced movement gameplay. Six alternating left/right fist-clench prompts collect coins from the matching side of the temple path. Every prompt freezes simulation time, character animation, camera and coin positions. No time limit or failure penalty. Escape pauses and resumes during travel, prompts or pickups. Switching away pauses automatically.

## Run
Use Node 22.13+ and pnpm 10.29.2. Install dependencies, then run `pnpm dev`. `pnpm build` produces the deployment build. Tests: `node --experimental-strip-types --test tests/session.test.mjs`.

## Inputs
L = simulate a left-fist clench. R = simulate a right-fist clench. Mouse buttons provide equivalent controls. Key repeats and inputs outside the expected prompt are ignored. Future sensors can call `confirmMovement` through the same input boundary. No patient data is collected or saved.

## Validation and limits
State tests cover indefinite pauses, resuming mid-pickup, incorrect and duplicate inputs, six-coin completion, and large frame deltas. Hardware frame-rate profiling has not been performed. Balanced graphics caps pixel ratio at 1.25; high caps it at 1.75. Assets are served locally with no runtime third-party asset requests.

This is a playable visual prototype, not a photorealistic final art pass. The environment uses scanned PBR textures and constructed ruins; foliage is simplified and the human model is a temporary Mixamo soldier. The coin pickup is a simple in-world animation and would benefit from bespoke motion capture for a finished realistic result. Clinical efficacy is outside this prototype's scope.

## Asset provenance
- `public/assets/runner.glb`: Three.js Soldier example, from Mixamo. https://threejs.org/examples/webgl_animation_skinning_blending.html and https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf . Retain asset attribution and review Mixamo licensing before commercial distribution.
- Stone diffuse and OpenGL normal: Poly Haven `rock_boulder_dry`, 1K, CC0. https://polyhaven.com/a/rock_boulder_dry
- Ground diffuse and OpenGL normal: Poly Haven `forest_ground_04`, 1K, CC0. https://polyhaven.com/a/forest_ground_04

The optional WebMCP control surface is feature-detected. Registration, state read-back, valid movement, rejected incorrect movement, and rest/resume were verified in the in-app browser.

