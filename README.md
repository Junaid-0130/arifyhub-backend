# AR Scan App

A web application for viewing 3D models in Augmented Reality using `<model-viewer>`.

## Project Structure

```
ar-scan-app/
├── index.html          # Homepage with navigation
├── viewer.html         # AR model viewer page
├── upload.html         # Upload page (placeholder)
├── assets/
│   └── models/         # Directory for 3D model files
└── README.md
```

## Getting Started

1. **Add a 3D Model**: Place a `.glb` or `.gltf` model file in the `assets/models/` directory. The viewer is currently configured to load `sample.glb`.

2. **Open the App**: Open `index.html` in a web browser.

3. **View in AR**: 
   - Navigate to the "View in AR" page
   - Click the "View in AR" button
   - Make sure you're on a device with AR capabilities:
     - iOS: Safari browser
     - Android: Chrome browser (ARCore compatible devices)
     - Desktop: Limited AR support (WebXR)

## Features

- **Homepage**: Beautiful landing page with navigation cards
- **AR Viewer**: Interactive 3D model viewer with AR capabilities
- **Upload Page**: Placeholder for future model upload functionality

## Supported Model Formats

- GLB (recommended)
- GLTF

## Browser Compatibility

- iOS Safari 12.1+
- Android Chrome 81+
- Desktop Chrome/Edge (WebXR support)

## Notes

- The app uses Google's `<model-viewer>` web component
- AR features require a device with ARCore (Android) or ARKit (iOS) support
- For best results, use GLB format models optimized for web



