# Novel Forge Studio v12 — GitHub Pages + optional shared cloud library

Preserves the v11 editor, image generator, and local IndexedDB library. Adds **Cloud Library** with optional Cloudflare R2 synchronization.

## Update GitHub Pages
Upload the new `studio-v12.js` and updated `index.html` from this package, plus any missing v11 files. Preserve any existing custom Cloudflare image-generator URL in `studio-v10.js`.

## Configure cloud storage
1. In Cloudflare, create an R2 bucket named `novel-forge-images-library`. Check current billing and free-tier terms; R2 may require billing setup.
2. Create another Worker, named `novel-forge-library`, separate from your existing `novel-forge-images` generation Worker.
3. Replace the new Worker's code with `cloudflare-library-worker/worker.js`.
4. In the new Worker's Settings > Bindings, add **R2 bucket** binding called `IMAGES`, selecting the newly created bucket.
5. In Settings > Variables and secrets, add an encrypted **secret** named `LIBRARY_TOKEN` with a long random passphrase. **Never put this in GitHub.**
6. Deploy the Worker and test `/api/health`.
7. Open GitHub Pages > **Cloud Library**, enter the new Worker root URL and your passphrase, click **Connect / Refresh**. You can upload all previously saved local-library images, then fetch them from another device.

This stores cloud images separately from GitHub. R2 is not an included million-photo collection. The million-entry character recipe catalog is still virtual, not a million stored photographs.

## Important cautions
- Your `LIBRARY_TOKEN` is requested from the browser and held in session storage; use the shared library as a private personal tool, not a fully public multi-user platform. Anyone with the token can access the images. A production multi-user product needs proper accounts and authorization, request limits, audit logs, backups and lifecycle controls.
- CORS is not authentication. Do not expose R2 public bucket links if images are intended to be private.
- Avoid loading millions of images into the browser; this app lists 50 at a time.
- Uploaded images must be yours or legally licensed; online reference-image search does not grant reuse rights.
- Existing Cloudflare image generation is separate. Upload a generated image to the local library first, then sync it to the cloud.
