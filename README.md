# Interactive Multi-Marker AR — HCI project

## Files

- `index.html`: page, AR.js scene, three marker definitions and procedural 3D objects.
- `style.css`: responsive layout and touch-friendly controls.
- `script.js`: camera permission flow, marker feedback, selection, rotation and reset.
- `assets/markers/`: marker assets can be stored here.
- `assets/models/`: no models are required; all three objects are built from A-Frame primitives.

## External dependencies and marker files

A-Frame 1.4.2 and AR.js 3.4.5 are loaded from pinned CDN URLs in `index.html`; internet access is required. Hiro and Kanji are AR.js preset markers. The third marker's Letter A `.patt` file is loaded from the AR.js repository remotely, not stored locally in this project. Its matching preview image is at https://raw.githack.com/AR-js-org/AR.js/master/three.js/examples/marker-training/examples/pattern-files/pattern-letterA.png . Hiro image: https://raw.githack.com/AR-js-org/AR.js/master/data/images/hiro.png . Kanji image: https://raw.githack.com/AR-js-org/AR.js/master/data/images/kanji.png . Keep the marker artwork square, uncropped, and high contrast.

For a local Letter A pattern file, download `pattern-letterA.patt` from the same AR.js marker-training `pattern-files` directory into `assets/markers/`, then change the third marker URL in `index.html` to `assets/markers/pattern-letterA.patt`.

## VS Code local setup

1. Unzip this folder and open it in VS Code using **File → Open Folder**.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html` → **Open with Live Server**. It should open a localhost URL. Do not use a direct `file://` URL.
4. Allow camera access. For laptop testing, display or print each marker and use the computer webcam.

## GitHub Pages

Upload `index.html`, `style.css`, `script.js`, `README.md`, and `assets/` while preserving the paths. In repository **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/(root)`, then Save. Wait for deployment and open the HTTPS page in Chrome on Android or Safari on iPhone. Avoid Messenger's in-app browser when testing camera access.

## Important

This project has not been verified on your specific phone in this environment. Real-device testing is still required for camera permission, AR.js video startup, all marker detections, control behavior and small-screen layout. The Letter A marker pattern and all libraries require internet while using their remote URLs.
