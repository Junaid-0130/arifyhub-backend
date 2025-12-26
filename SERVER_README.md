# AR Scan App - Express Server

Node.js Express server with Firebase integration for handling 3D model uploads and retrieval.

## Features

- **POST /uploadResult**: Upload model files or URLs, save to Firebase Storage, store metadata in Firestore
- **GET /model/:id**: Retrieve model URL if active, or return "Access Disabled" if inactive
- Firebase Storage integration for file storage
- Firestore integration for model metadata
- Unique ID generation using UUID

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

You need to set up Firebase Admin SDK credentials:

#### Option A: Service Account JSON File (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Save the JSON file as `firebase-service-account.json` in the project root
5. Add the file path to `.env`:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

#### Option B: Environment Variable

1. Copy the service account JSON content
2. Add it to `.env` as a single line (escape quotes):
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `FIREBASE_STORAGE_BUCKET`: Your Firebase Storage bucket name (e.g., `your-project-id.appspot.com`)
- `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT`: Firebase credentials
- `PORT`: Server port (default: 3000)

### 4. Firebase Storage Rules

Update your Firebase Storage rules to allow uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /models/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null; // Or adjust based on your needs
    }
  }
}
```

### 5. Firestore Security Rules

Update your Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /models/{modelId} {
      allow read: if true; // Or restrict as needed
      allow write: if request.auth != null; // Or adjust based on your needs
    }
  }
}
```

## Running the Server

### Development (with auto-reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### POST /uploadResult

Upload a model file or provide a URL.

**Request (File Upload):**
```bash
curl -X POST http://localhost:3000/uploadResult \
  -F "model=@path/to/model.glb"
```

**Request (URL):**
```bash
curl -X POST http://localhost:3000/uploadResult \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/model.glb"}'
```

**Response:**
```json
{
  "success": true,
  "id": "unique-uuid-here",
  "url": "https://storage.googleapis.com/bucket/models/uuid.glb",
  "message": "Model uploaded successfully"
}
```

### GET /model/:id

Retrieve a model by ID.

**Request:**
```bash
curl http://localhost:3000/model/unique-uuid-here
```

**Response (Active):**
```json
{
  "id": "unique-uuid-here",
  "url": "https://storage.googleapis.com/bucket/models/uuid.glb",
  "active": true
}
```

**Response (Inactive):**
```json
{
  "error": "Access Disabled"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Firestore Data Structure

Models are stored in the `models` collection with the following structure:

```javascript
{
  id: "unique-uuid",
  url: "https://storage.googleapis.com/...",
  active: true,
  createdAt: Timestamp,
  fileName: "models/uuid.glb" // or URL if uploaded via URL
}
```

## Integration with Kiri

The server accepts requests from Kiri in two formats:

1. **File Upload**: Multipart form data with `model` field
2. **URL**: JSON body with `url` field

Both methods will:
- Generate a unique ID
- Save to Firebase Storage (if file) or use provided URL
- Store metadata in Firestore with `active: true`

## Error Handling

- **400**: Bad request (missing file/URL)
- **403**: Access disabled (model exists but inactive)
- **404**: Model not found
- **500**: Server error

## Security Notes

- Keep `firebase-service-account.json` secure and never commit it
- Adjust Firebase Storage and Firestore rules based on your security requirements
- Consider adding authentication middleware for production use
- File size limit is set to 50MB (configurable in `server.js`)



