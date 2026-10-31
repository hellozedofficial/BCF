import express from 'express';
import { requireAdminAuth } from './auth.js';
import {
  getSanitizedStorageSettings,
  updateStorageSettings,
  testCloudStorageConnection
} from '../services/cloudStorage.js';

const router = express.Router();

// All settings routes require admin authentication
router.use(requireAdminAuth);

/**
 * GET /api/settings/storage
 * Get current cloud storage configuration (with masked secrets)
 */
router.get('/storage', async (req, res) => {
  try {
    const settings = await getSanitizedStorageSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('[SETTINGS GET STORAGE ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve storage settings',
      error: error.message
    });
  }
});

/**
 * PUT /api/settings/storage
 * Update cloud storage configuration
 */
router.put('/storage', async (req, res) => {
  try {
    const {
      enabled,
      keyId,
      applicationKey,
      region,
      bucket,
      endpoint,
      cdnUrl
    } = req.body;

    const updated = await updateStorageSettings({
      enabled,
      keyId,
      applicationKey,
      region,
      bucket,
      endpoint,
      cdnUrl
    });

    res.json({
      success: true,
      message: 'Storage settings updated successfully',
      settings: updated
    });
  } catch (error) {
    console.error('[SETTINGS UPDATE STORAGE ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update storage settings',
      error: error.message
    });
  }
});

/**
 * POST /api/settings/storage/test
 * Test cloud storage connectivity & credentials
 */
router.post('/storage/test', async (req, res) => {
  try {
    const customConfig = req.body && Object.keys(req.body).length > 0 ? req.body : null;
    const result = await testCloudStorageConnection(customConfig);

    if (result.success) {
      res.json({
        success: true,
        latency: result.latency,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('[SETTINGS TEST STORAGE ERROR]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Connection test failed'
    });
  }
});

export default router;

