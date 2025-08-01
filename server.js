import express from 'express';
import { render } from '@antv/gpt-vis-ssr';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3000;
const IMAGES_DIR = './images';

// S3 Configuration
const S3_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  bucketName: process.env.S3_BUCKET_NAME,
  customDomain: process.env.S3_CUSTOM_DOMAIN,
  endpoint: process.env.S3_ENDPOINT, // For MinIO or custom S3 endpoints
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' // For MinIO compatibility
};

// Check if S3 is configured
const isS3Configured = () => {
  return S3_CONFIG.accessKeyId && 
         S3_CONFIG.secretAccessKey && 
         S3_CONFIG.bucketName; // Region is optional for MinIO
};

// Initialize S3 client if configured
let s3Client = null;
if (isS3Configured()) {
  const clientConfig = {
    region: S3_CONFIG.region,
    credentials: {
      accessKeyId: S3_CONFIG.accessKeyId,
      secretAccessKey: S3_CONFIG.secretAccessKey
    }
  };

  // Add endpoint for MinIO or custom S3 services
  if (S3_CONFIG.endpoint) {
    clientConfig.endpoint = S3_CONFIG.endpoint;
    clientConfig.forcePathStyle = S3_CONFIG.forcePathStyle;
  }

  s3Client = new S3Client(clientConfig);
  
  const serviceType = S3_CONFIG.endpoint ? 'MinIO/Custom S3' : 'AWS S3';
  console.log(`✅ ${serviceType} storage configured`);
} else {
  console.log('📁 Using local storage (S3 not configured)');
}

// Upload file to S3
async function uploadToS3(buffer, filename) {
  if (!s3Client) {
    throw new Error('S3 client not configured');
  }

  const key = `charts/${filename}`;
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    ACL: 'public-read'
  });

  await s3Client.send(command);

  // Return URL based on configuration
  if (S3_CONFIG.customDomain) {
    // Custom domain (CDN or custom endpoint)
    return `${S3_CONFIG.customDomain}/${key}`;
  } else if (S3_CONFIG.endpoint) {
    // MinIO or custom S3 endpoint
    const endpointUrl = new URL(S3_CONFIG.endpoint);
    if (S3_CONFIG.forcePathStyle) {
      return `${S3_CONFIG.endpoint}/${S3_CONFIG.bucketName}/${key}`;
    } else {
      return `${endpointUrl.protocol}//${S3_CONFIG.bucketName}.${endpointUrl.host}/${key}`;
    }
  } else {
    // Standard AWS S3 URL
    return `https://${S3_CONFIG.bucketName}.s3.${S3_CONFIG.region}.amazonaws.com/${key}`;
  }
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Ensure images directory exists
async function ensureImagesDir() {
  try {
    await fs.access(IMAGES_DIR);
  } catch {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
  }
}

// Generate chart image endpoint
app.post('/api/gpt-vis', async (req, res) => {
  try {
    const options = req.body;
    
    // Validate request
    if (!options || typeof options !== 'object') {
      return res.status(400).json({
        success: false,
        errorMessage: 'Invalid options provided'
      });
    }

    // Add source identifier
    const chartOptions = {
      ...options,
      source: 'dify-plugin-visualization'
    };

    // Generate chart using gpt-vis-ssr
    const vis = await render(chartOptions);
    const buffer = vis.toBuffer();

    // Generate unique filename
    const filename = `chart-${uuidv4()}.png`;
    
    let imageUrl, localPath;

    if (isS3Configured()) {
      // Upload to S3
      try {
        imageUrl = await uploadToS3(buffer, filename);
        localPath = null; // No local path for S3 storage
        
        console.log(`📤 Chart uploaded to S3: ${imageUrl}`);
      } catch (s3Error) {
        console.error('S3 upload failed, falling back to local storage:', s3Error);
        
        // Fallback to local storage
        await ensureImagesDir();
        const filepath = path.join(IMAGES_DIR, filename);
        await fs.writeFile(filepath, buffer);
        imageUrl = `/images/${filename}`;
        localPath = filepath;
      }
    } else {
      // Save to local storage
      await ensureImagesDir();
      const filepath = path.join(IMAGES_DIR, filename);
      await fs.writeFile(filepath, buffer);
      imageUrl = `/images/${filename}`;
      localPath = filepath;
      
      console.log(`💾 Chart saved locally: ${filepath}`);
    }

    // Return success response
    const response = {
      success: true,
      resultObj: imageUrl,
      message: 'Chart generated successfully',
      storage: isS3Configured() ? 's3' : 'local'
    };

    // Add local path only for local storage
    if (localPath) {
      response.localPath = localPath;
    }

    res.json(response);

  } catch (error) {
    console.error('Chart generation error:', error);
    
    res.status(500).json({
      success: false,
      errorMessage: error.message || 'Failed to generate chart',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Serve images
app.use('/images', express.static(IMAGES_DIR));

// Health check endpoint
app.get('/health', (_, res) => {
  const healthInfo = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    storage: isS3Configured() ? 's3' : 'local',
    s3Config: isS3Configured() ? {
      region: S3_CONFIG.region,
      bucket: S3_CONFIG.bucketName,
      customDomain: S3_CONFIG.customDomain || null,
      endpoint: S3_CONFIG.endpoint || null,
      forcePathStyle: S3_CONFIG.forcePathStyle || false,
      serviceType: S3_CONFIG.endpoint ? 'MinIO/Custom' : 'AWS S3'
    } : null
  };
  
  res.json(healthInfo);
});

// Error handling middleware
app.use((err, _, res, __) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    errorMessage: 'Internal server error'
  });
});

// 404 handler
app.use((_, res) => {
  res.status(404).json({
    success: false,
    errorMessage: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  try {
    await ensureImagesDir();
    
    app.listen(PORT, () => {
      console.log(`🚀 GPT-Vis SSR Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Chart API: POST http://localhost:${PORT}/api/gpt-vis`);
      
      if (isS3Configured()) {
        const serviceType = S3_CONFIG.endpoint ? 'MinIO/Custom S3' : 'AWS S3';
        console.log(`☁️  ${serviceType} Storage: ${S3_CONFIG.bucketName}`);
        
        if (S3_CONFIG.endpoint) {
          console.log(`🔗 Endpoint: ${S3_CONFIG.endpoint}`);
          console.log(`📁 Path Style: ${S3_CONFIG.forcePathStyle ? 'Enabled (MinIO)' : 'Disabled'}`);
        } else {
          console.log(`🌍 Region: ${S3_CONFIG.region}`);
        }
        
        if (S3_CONFIG.customDomain) {
          console.log(`🌐 Custom Domain: ${S3_CONFIG.customDomain}`);
        }
      } else {
        console.log(`📁 Local Storage: ${path.resolve(IMAGES_DIR)}`);
        console.log(`🖼️  Images served at: http://localhost:${PORT}/images/`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();