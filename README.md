# Novel Forge Studio — GitHub Pages edition

This repository is laid out for GitHub Pages: `index.html` is in the repository root.

## Publish
1. Create a GitHub repository (for example, `novel-forge-studio`).
2. Upload all files and the `optional-ai-backend` folder **from inside this directory**, not the ZIP itself. Keep `index.html` in the repository root.
3. In repository **Settings → Pages**, select **Deploy from a branch**, **main**, and **/(root)**, then Save.
4. Visit `https://YOUR-USERNAME.github.io/novel-forge-studio/` (replace the placeholders).

The editor runs in the browser on desktop and Android. It does not run a Ren'Py executable in GitHub Pages; use the Ren'Py engine to play/build exported source. Save project backups regularly. Browser local storage is not shared between devices.

## Realistic image generator

The editor works online, but GitHub Pages **cannot run Python or image model inference**. Its image generator requires a separate HTTPS inference endpoint reachable by the browser. Enter that service's HTTPS `/api/generate-image` URL in **Image Generator → Realistic AI generator connection**. A server must support CORS for your GitHub Pages origin and use server-side authentication, rate limiting, and abuse prevention. Do **not** put secret keys in this public repository or in browser JavaScript.

The `optional-ai-backend` folder contains local development server source, not a public-production deployment. It binds to loopback, does not implement hosted authentication/CORS, and requires separately downloaded model weights and a compatible GPU. It is *not* a ready-to-deploy public AI endpoint. Public hosting needs operational security controls and suitable GPU hosting.

The million-entry procedural catalog contains image *recipes*, not one million realistic images. The included sample Maya image is a static example. Web reference searches are user-initiated; verify license and attribution before reuse.

## Notes
- GitHub Pages is a **public** web host; don't commit private stories, secrets, or images you lack rights to publish.
- GitHub Pages is not a backend or GPU service.
- After export, Ren'Py launcher/SDK is needed to turn the generated files into a tested desktop or Android game.
