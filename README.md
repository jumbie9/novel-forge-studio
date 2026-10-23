
# Novel Forge Studio — GitHub Pages edition v10

This build is prepared for GitHub Pages hosting.

## What changed in v10

- Same dark hosted editor layout
- Prompt-first image workflow
- **Description box** with two main actions:
  - **Get Images** → loads matching entries from a virtual 1,000,000+ image recipe catalog and fetches legal reference images from Wikimedia Commons
  - **Generate** → sends the prompt to a hard-coded HTTPS image-generation backend URL
- Preview panel, download, and add-to-project buttons
- `sample-maya.png` included as a sample realistic character image

## Important note about GitHub Pages

GitHub Pages can host the editor UI, but it cannot run the image model itself.
The Generate button is wired to a hard-coded API variable in `studio-v10.js`:

```js
window.NOVEL_FORGE_IMAGE_API = 'https://YOUR-IMAGE-BACKEND.example/api/generate-image'
```

Replace that placeholder URL with your real HTTPS backend endpoint.

## Publish to GitHub Pages

1. Upload these files to your repository root.
2. Ensure `index.html` is in the root.
3. In GitHub repository settings, enable Pages from the `main` branch and `/(root)`.
4. Open your site URL.

## Backend response format expected by Generate

Return JSON in either of these shapes:

```json
{"data_url":"data:image/png;base64,..."}
```

or

```json
{"image_base64":"...","mime_type":"image/png"}
```

## Legal web references

The Get Images action uses Wikimedia Commons for open-license reference results. Those are not automatically imported into your project.
