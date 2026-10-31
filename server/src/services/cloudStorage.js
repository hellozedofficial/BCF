import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import pool from '../config/db.js';

let s3ClientInstance = null;
let currentConfig = null;

/**
 * Get active storage configuration (merged from DB and .env)
 */
export async function getStorageConfig() {
  if (currentConfig) {
    return currentConfig;
  }

  // 1. Defaults from .env
  let config = {
    enabled: process.env.B2_ENABLED !== 'false',
    keyId: process.env.B2_KEY_ID || '003f1a3b7e63fc10000000002',
    applicationKey: process.env.B2_APPLICATION_KEY || 'K003AYDIgU36ILLrye8Pn1+u4TG5Igg',
    region: process.env.B2_REGION || 'eu-central-003',
    bucket: process.env.B2_BUCKET || 'bangladeshcarromcdn',
    endpoint: process.env.B2_ENDPOINT || 'https://s3.eu-central-003.backblazeb2.com',
    cdnUrl: (process.env.B2_URL || 'https://f003.backblazeb2.com/file/bangladeshcarromcdn').replace(/\/+$/, '')
  };

  // 2. Check if DB has stored custom settings
  try {
    const [rows] = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'cloud_storage_config' LIMIT 1"
    );
    if (rows && rows.length > 0 && rows[0].setting_value) {
      const dbConfig = JSON.parse(rows[0].setting_value);
      config = { ...config, ...dbConfig };
    }
  } catch (err) {
    // Database might not be ready or table not created yet, ignore
  }

  currentConfig = config;
  return config;
}

/**
 * Initialize or get cached S3 client instance
 */
export async function getS3Client() {
  const config = await getStorageConfig();

  if (!config.enabled || !config.keyId || !config.applicationKey) {
    return null;
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey
      }
    });
  }

  return s3ClientInstance;
}

/**
 * Upload a raw buffer directly to Cloud Object Storage
 * @param {Buffer} buffer - File binary data
 * @param {string} key - Object key inside bucket (e.g. 'players/photos/photo_123.jpg')
 * @param {string} contentType - MIME type (e.g. 'image/jpeg', 'image/webp')
 * @returns {Promise<{ success: boolean, url: string, key: string }>}
 */
export async function uploadBufferToCloud(buffer, key, contentType = 'application/octet-stream') {
  const config = await getStorageConfig();
  const client = await getS3Client();

  if (!client || !config.enabled) {
    throw new Error('Cloud storage is not enabled or credentials are missing');
  }

  // Normalize key (no leading slash)
  const cleanKey = key.replace(/^\/+/, '');

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: cleanKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable'
  });

  await client.send(command);

  const publicUrl = `${config.cdnUrl}/${cleanKey}`;
  return {
    success: true,
    url: publicUrl,
    key: cleanKey
  };
}

/**
 * Delete a file from Cloud Object Storage
 * @param {string} keyOrUrl - Full CDN URL or bucket key
 */
export async function deleteFileFromCloud(keyOrUrl) {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') return;

  try {
    const config = await getStorageConfig();
    const client = await getS3Client();
    if (!client) return;

    let key = keyOrUrl;
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      const cdnBase = config.cdnUrl.replace(/\/+$/, '');
      if (keyOrUrl.startsWith(cdnBase)) {
        key = keyOrUrl.substring(cdnBase.length).replace(/^\/+/, '');
      } else {
        // Try to match bucket name in URL
        const bucketMatch = keyOrUrl.split(`/${config.bucket}/`)[1];
        if (bucketMatch) {
          key = bucketMatch;
        } else {
          return; // Not a cloud storage file of this bucket
        }
      }
    }

    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key
    });

    await client.send(command);
    console.log(`[CLOUD STORAGE] Successfully deleted object: ${key}`);
  } catch (err) {
    console.error(`[CLOUD STORAGE DELETE ERROR] Failed to delete ${keyOrUrl}:`, err.message);
  }
}

/**
 * Test connectivity and upload/delete latency with specified or active credentials
 */
export async function testCloudStorageConnection(customConfig = null) {
  const config = customConfig || (await getStorageConfig());

  if (!config.keyId || !config.applicationKey || !config.bucket || !config.endpoint) {
    return {
      success: false,
      message: 'All connection credentials (Key ID, Application Key, Bucket, Endpoint) are required.'
    };
  }

  const testClient = new S3Client({
    endpoint: config.endpoint,
    region: config.region || 'eu-central-003',
    credentials: {
      accessKeyId: config.keyId,
      secretAccessKey: config.applicationKey
    }
  });

  const testKey = `.probe_test_${Date.now()}.txt`;
  const startTime = Date.now();

  try {
    // 1. Put object probe
    await testClient.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: testKey,
        Body: Buffer.from('Bangladesh Carrom Federation Storage Test Probe OK'),
        ContentType: 'text/plain'
      })
    );

    const latencyMs = Date.now() - startTime;

    // 2. Clean up probe
    await testClient.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: testKey
      })
    );

    return {
      success: true,
      latency: latencyMs,
      message: `Connection verified successfully! Round-trip latency: ${latencyMs}ms.`
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to connect to cloud storage provider.'
    };
  }
}

/**
 * Get sanitized storage settings for Admin UI (masked secrets)
 */
export async function getSanitizedStorageSettings() {
  const config = await getStorageConfig();

  // Mask applicationKey for security
  let maskedKey = '';
  if (config.applicationKey) {
    const len = config.applicationKey.length;
    maskedKey = len > 8
      ? `${config.applicationKey.slice(0, 4)}••••••••${config.applicationKey.slice(-4)}`
      : '••••••••';
  }

  return {
    enabled: Boolean(config.enabled),
    keyId: config.keyId || '',
    applicationKey: maskedKey,
    hasApplicationKey: Boolean(config.applicationKey),
    region: config.region || 'eu-central-003',
    bucket: config.bucket || '',
    endpoint: config.endpoint || '',
    cdnUrl: config.cdnUrl || ''
  };
}

/**
 * Update storage settings from Admin Settings panel
 */
export async function updateStorageSettings(newSettings) {
  const existing = await getStorageConfig();

  const updated = {
    enabled: newSettings.enabled !== undefined ? Boolean(newSettings.enabled) : existing.enabled,
    keyId: (newSettings.keyId || existing.keyId || '').trim(),
    // Keep old applicationKey if unchanged / masked
    applicationKey:
      newSettings.applicationKey && !newSettings.applicationKey.includes('•')
        ? newSettings.applicationKey.trim()
        : existing.applicationKey,
    region: (newSettings.region || existing.region || 'eu-central-003').trim(),
    bucket: (newSettings.bucket || existing.bucket || '').trim(),
    endpoint: (newSettings.endpoint || existing.endpoint || '').trim(),
    cdnUrl: (newSettings.cdnUrl || existing.cdnUrl || '').trim().replace(/\/+$/, '')
  };

  // Upsert into system_settings table
  await pool.query(
    `INSERT INTO system_settings (setting_key, setting_value, category)
     VALUES ('cloud_storage_config', ?, 'storage')
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), category = 'storage'`,
    [JSON.stringify(updated)]
  );

  // Invalidate cache and recreate client
  currentConfig = updated;
  s3ClientInstance = null;

  return getSanitizedStorageSettings();
}

export default {
  getStorageConfig,
  getS3Client,
  uploadBufferToCloud,
  deleteFileFromCloud,
  testCloudStorageConnection,
  getSanitizedStorageSettings,
  updateStorageSettings
};

