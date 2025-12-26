# AR Scan App - React Native Mobile

React Native mobile app for uploading 3D models and generating QR codes.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update API URLs in:
   - `screens/UploadScreen.js` - Set `API_BASE_URL` to your backend server
   - `screens/ResultScreen.js` - Set `VIEWER_BASE_URL` to your viewer.html URL

3. Start the app:
```bash
npm start
```

## Features

- **UploadScreen**: Upload model URL to backend
- **ResultScreen**: Display QR code pointing to viewer.html?id=MODEL_ID

## Backend Integration

The app connects to the Express backend:
- `POST /uploadResult` - Uploads model URL and receives model ID
- QR code points to `viewer.html?id=MODEL_ID`

## Development

- Uses Expo for React Native development
- Configure API URLs for your environment
- Test with mock URLs for now (scanning not implemented yet)



