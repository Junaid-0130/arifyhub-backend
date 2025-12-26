
/**
 * AR Scan App - Express Server
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy env.template to .env: cp env.template .env
 *    (On Windows: copy env.template .env)
 * 2. Edit .env and fill in your Firebase configuration (OPTIONAL)
 * 3. Install dependencies: npm install
 * 4. Start server: npm start
 * 
 * Firebase is optional - server will use JSON fallback if Firebase is not configured
 */
console.log("🔥 THIS server.js IS RUNNING");
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const path = require("path");

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// JSON fallback registry file path
const REGISTRY_FILE = path.join(__dirname, 'models-registry.json');

/**
 * JSON Registry Helper Functions
 * Used when Firebase is not configured
 */

// Read models from JSON registry
async function readJsonRegistry() {
  try {
    const data = await fs.readFile(REGISTRY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty registry
    if (error.code === 'ENOENT') {
      return { models: [] };
    }
    throw error;
  }
}

// Write models to JSON registry
async function writeJsonRegistry(data) {
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Get model from JSON registry by ID
async function getModelFromJson(id) {
  const registry = await readJsonRegistry();
  return registry.models.find(model => model.id === id) || null;
}

// Save model to JSON registry
async function saveModelToJson(modelData) {
  const registry = await readJsonRegistry();
  const existingIndex = registry.models.findIndex(m => m.id === modelData.id);
  
  if (existingIndex >= 0) {
    registry.models[existingIndex] = modelData;
  } else {
    registry.models.push(modelData);
  }
  
  await writeJsonRegistry(registry);
}

// Get all models from JSON registry
async function getAllModelsFromJson() {
  const registry = await readJsonRegistry();
  return registry.models.map(model => ({
    id: model.id,
    modelUrl: model.modelUrl || model.url,
    active: model.active,
    createdAt: model.createdAt
  }));
}

// Initialize Firebase Admin (OPTIONAL)
// Server will use JSON fallback if Firebase is not configured
// Server MUST start even if Firebase initialization fails
let db = null;
let bucket = null;
let firebaseInitialized = false;

// Safely attempt Firebase initialization
// Never throw errors or exit - always fall back to JSON
try {
  // Only attempt initialization if Firebase Admin is available and not already initialized
  if (admin && !admin.apps.length) {
    let serviceAccount = null;
    let storageBucket = null;

    // Option 1: Use service account JSON from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
      } catch (parseError) {
        // Silently fall back - don't log here, will log below
      }
    } 
    // Option 2: Use service account file path
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
      } catch (requireError) {
        // Silently fall back - don't log here, will log below
      }
    } 
    // Option 3: Use default credentials (for Firebase hosting/Cloud Run)
    else if (process.env.FIREBASE_STORAGE_BUCKET) {
      storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
      // Will use default credentials from environment
    }

    // Initialize Firebase if we have the required configuration
    if (storageBucket) {
      try {
        const initConfig = {
          storageBucket: storageBucket
        };

        if (serviceAccount) {
          initConfig.credential = admin.credential.cert(serviceAccount);
        }

        admin.initializeApp(initConfig);

        // Initialize Firestore and Storage
        db = admin.firestore();
        bucket = admin.storage().bucket();
        firebaseInitialized = true;

        console.log('✓ Firebase initialized successfully');
        console.log(`  - Firestore: Connected`);
        console.log(`  - Storage Bucket: ${storageBucket}`);
      } catch (initError) {
        // Firebase initialization failed - use JSON fallback
        console.warn('⚠ Warning: Firebase initialization failed:', initError.message);
        console.warn('⚠ Falling back to JSON file storage (models-registry.json)');
        console.warn('⚠ File uploads will not work without Firebase Storage');
        firebaseInitialized = false;
      }
    } else {
      // No Firebase configuration provided - use JSON fallback
      console.warn('⚠ Warning: Firebase not configured');
      console.warn('⚠ Using JSON file storage (models-registry.json)');
      console.warn('⚠ File uploads will not work without Firebase Storage');
      console.warn('⚠ To enable Firebase, configure FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_STORAGE_BUCKET in .env');
      firebaseInitialized = false;
    }
  }
} catch (error) {
  // Catch any unexpected errors during Firebase setup
  // Never throw - always continue with JSON fallback
  console.warn('⚠ Warning: Firebase setup encountered an error:', error.message);
  console.warn('⚠ Falling back to JSON file storage (models-registry.json)');
  console.warn('⚠ File uploads will not work without Firebase Storage');
  firebaseInitialized = false;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept GLB, GLTF, and other 3D model formats
    const allowedExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only 3D model files are allowed.'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/**
 * POST /uploadResult
 * Receives model file or URL from Kiri/React Native app
 * - If file: Uploads to Firebase Storage (requires Firebase)
 * - If URL: Uses provided URL (works with or without Firebase)
 * Generates unique ID and stores in Firestore or JSON registry
 */
app.post('/uploadResult', upload.single('model'), async (req, res) => {
  try {
    let modelUrl;
    let fileName;

    // Check if file was uploaded or URL was provided
    if (req.file) {
      // Handle file upload - requires Firebase Storage
      if (!firebaseInitialized) {
        return res.status(503).json({
          error: 'File uploads require Firebase Storage',
          message: 'Please configure Firebase to upload files. URL uploads work without Firebase.'
        });
      }

      const fileExtension = path.extname(req.file.originalname);
      fileName = `models/${uuidv4()}${fileExtension}`;
      const file = bucket.file(fileName);

      // Upload file to Firebase Storage
      const stream = file.createWriteStream({
        metadata: {
          contentType: req.file.mimetype || 'application/octet-stream',
          metadata: {
            originalName: req.file.originalname
          }
        }
      });

      await new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(req.file.buffer);
      });

      // Make file publicly accessible
      await file.makePublic();

      // Get public URL
      modelUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    } else if (req.body.url) {
      // Handle URL (from Kiri or React Native app) - works without Firebase
      modelUrl = req.body.url;
      fileName = req.body.url; // Store URL as fileName reference
    } else {
      return res.status(400).json({
        error: 'Either a file or URL must be provided'
      });
    }

    // Generate unique ID
    const modelId = uuidv4();

    // Store model data
    const modelData = {
      id: modelId,
      modelUrl: modelUrl,
      active: true,
      fileName: fileName,
      createdAt: new Date().toISOString()
    };

    // Store in Firestore if available, otherwise use JSON registry
    if (firebaseInitialized) {
      const firestoreData = {
        ...modelData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('models').doc(modelId).set(firestoreData);
    } else {
      await saveModelToJson(modelData);
    }

    res.status(200).json({
      success: true,
      id: modelId,
      url: modelUrl,
      message: 'Model uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload model',
      message: error.message
    });
  }
});

/**
 * GET /model/:id
 * Model Registry Access Control
 * - If model exists AND active=true → return modelUrl
 * - If model exists AND active=false → return { error: "Access Disabled" }
 * - If model does not exist → return 404
 * 
 * Uses Firestore if available, otherwise falls back to JSON registry
 */
app.get('/model/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let modelData = null;

    // Try Firestore first if available
    if (firebaseInitialized) {
      try {
        const modelDoc = await db.collection('models').doc(id).get();
        if (modelDoc.exists) {
          const data = modelDoc.data();
          modelData = {
            id: data.id || id,
            modelUrl: data.modelUrl || data.url,
            active: data.active
          };
        }
      } catch (firestoreError) {
        console.warn('Firestore read error, falling back to JSON:', firestoreError.message);
      }
    }

    // Fallback to JSON registry if Firestore didn't return a result
    if (!modelData) {
      modelData = await getModelFromJson(id);
      if (modelData) {
        // Ensure consistent field names
        modelData = {
          id: modelData.id,
          modelUrl: modelData.modelUrl || modelData.url,
          active: modelData.active
        };
      }
    }

    // Model does not exist
    if (!modelData) {
      return res.status(404).json({
        error: 'Model not found'
      });
    }

    // Check if model is active
    if (!modelData.active) {
      return res.status(403).json({
        error: 'Access Disabled'
      });
    }

    // Model exists and is active - return modelUrl
    res.status(200).json({
      modelUrl: modelData.modelUrl
    });

  } catch (error) {
    console.error('Get model error:', error);
    res.status(500).json({
      error: 'Failed to retrieve model',
      message: error.message
    });
  }
});

// ===============================
// QR CODE GENERATION ROUTE
// ===============================
const QRCode = require("qrcode");

app.get("/qr/:id", async (req, res) => {
  const { id } = req.params;

  const viewerUrl = `${req.protocol}://${req.get("host")}/viewer.html?id=${id}`;

  try {
    const qr = await QRCode.toDataURL(viewerUrl);
    res.json({
      id,
      viewerUrl,
      qr
    });
  } catch (error) {
    console.error("QR generation failed:", error);
    res.status(500).json({ error: "QR generation failed" });
  }
});

/**
 * GET /models
 * Admin endpoint: List all models with their IDs and active status
 * Uses Firestore if available, otherwise falls back to JSON registry
 */
app.get('/models', async (req, res) => {
  try {
    let models = [];

    // Try Firestore first if available
    if (firebaseInitialized) {
      try {
        const modelsSnapshot = await db.collection('models').get();
        models = modelsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.id || doc.id,
            modelUrl: data.modelUrl || data.url,
            active: data.active !== undefined ? data.active : true,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
          };
        });
      } catch (firestoreError) {
        console.warn('Firestore read error, falling back to JSON:', firestoreError.message);
        // Fall through to JSON fallback
      }
    }

    // If Firebase is not initialized or Firestore returned no results, use JSON fallback
    if (!firebaseInitialized || models.length === 0) {
      try {
        const jsonModels = await getAllModelsFromJson();
        // Only use JSON models if we don't have Firebase models, or if Firebase failed
        if (!firebaseInitialized || models.length === 0) {
          models = jsonModels;
        }
      } catch (jsonError) {
        console.warn('JSON registry read error:', jsonError.message);
        // Continue with empty array if both fail
      }
    }

    res.status(200).json({ models });

  } catch (error) {
    console.error('Get all models error:', error);
    res.status(500).json({
      error: 'Failed to retrieve models',
      message: error.message
    });
  }
});

/**
 * PATCH /model/:id
 * Admin endpoint: Update model active status
 * Updates in Firestore if available, otherwise updates JSON registry
 */
app.patch('/model/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    // Validate active status
    if (typeof active !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'active must be a boolean value'
      });
    }

    // Get existing model data
    let modelData = null;

    // Try Firestore first if available
    if (firebaseInitialized) {
      try {
        const modelDoc = await db.collection('models').doc(id).get();
        if (modelDoc.exists) {
          modelData = modelDoc.data();
        }
      } catch (firestoreError) {
        console.warn('Firestore read error, falling back to JSON:', firestoreError.message);
      }
    }

    // Fallback to JSON registry if Firestore didn't return a result
    if (!modelData) {
      modelData = await getModelFromJson(id);
    }

    // Model does not exist
    if (!modelData) {
      return res.status(404).json({
        error: 'Model not found'
      });
    }

    // Update active status
    modelData.active = active;

    // Update in Firestore if available, otherwise update JSON registry
    if (firebaseInitialized) {
      try {
        await db.collection('models').doc(id).update({
          active: active
        });
      } catch (firestoreError) {
        console.warn('Firestore update error, falling back to JSON:', firestoreError.message);
        await saveModelToJson(modelData);
      }
    } else {
      await saveModelToJson(modelData);
    }

    res.status(200).json({
      success: true,
      id: modelData.id,
      active: active,
      message: `Model ${active ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Update model error:', error);
    res.status(500).json({
      error: 'Failed to update model',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  if (!firebaseInitialized) {
    console.log(`Using JSON storage: ${REGISTRY_FILE}`);
  }
});

module.exports = app;
