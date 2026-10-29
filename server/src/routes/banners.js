import express from 'express';
import pool from '../config/db.js';
import { saveBannerImage, deleteFileByUrl } from '../utils/fileStorage.js';

const router = express.Router();

/**
 * GET /api/banners
 * Optional query: ?status=Active or ?all=true
 */
router.get('/', async (req, res) => {
  try {
    const { status, all } = req.query;
    let query = 'SELECT * FROM banners';
    const params = [];

    if (!all && status) {
      query += ' WHERE status = ?';
      params.push(status);
    } else if (!all) {
      // By default if called by frontend without query params, return active banners
      query += " WHERE status = 'Active'";
    }

    query += ' ORDER BY order_num ASC, created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[API /banners GET error]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch banners', error: error.message });
  }
});

/**
 * GET /api/banners/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[API /banners/:id GET error]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch banner', error: error.message });
  }
});

/**
 * POST /api/banners
 * Create new CMS banner
 */
router.post('/', async (req, res) => {
  try {
    const { title, subtitle, image_url, link_url, order_num = 0, status = 'Active' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Banner title is required' });
    }

    if (!image_url || !image_url.trim()) {
      return res.status(400).json({ success: false, message: 'Banner image is required' });
    }

    // Save image to disk if it's base64
    let savedImageUrl = image_url;
    if (image_url.startsWith('data:image')) {
      savedImageUrl = await saveBannerImage(image_url, 'banner');
      if (!savedImageUrl) {
        return res.status(400).json({ success: false, message: 'Invalid banner image format' });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO banners (title, subtitle, image_url, link_url, order_num, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title.trim(), subtitle ? subtitle.trim() : null, savedImageUrl, link_url ? link_url.trim() : null, parseInt(order_num, 10) || 0, status]
    );

    const [created] = await pool.query('SELECT * FROM banners WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: created[0]
    });
  } catch (error) {
    console.error('[API /banners POST error]:', error);
    res.status(500).json({ success: false, message: 'Failed to create banner', error: error.message });
  }
});

/**
 * PUT /api/banners/:id
 * Update existing CMS banner
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image_url, link_url, order_num = 0, status = 'Active' } = req.body;

    const [existing] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    let savedImageUrl = image_url || existing[0].image_url;
    if (image_url && image_url.startsWith('data:image')) {
      savedImageUrl = await saveBannerImage(image_url, 'banner');
      if (!savedImageUrl) {
        savedImageUrl = existing[0].image_url;
      } else if (existing[0].image_url && existing[0].image_url.startsWith('/uploads/banners/')) {
        // Remove previous local file
        deleteFileByUrl(existing[0].image_url);
      }
    }

    await pool.query(
      `UPDATE banners
       SET title = ?, subtitle = ?, image_url = ?, link_url = ?, order_num = ?, status = ?
       WHERE id = ?`,
      [
        title ? title.trim() : existing[0].title,
        subtitle !== undefined ? (subtitle ? subtitle.trim() : null) : existing[0].subtitle,
        savedImageUrl,
        link_url !== undefined ? (link_url ? link_url.trim() : null) : existing[0].link_url,
        order_num !== undefined ? parseInt(order_num, 10) || 0 : existing[0].order_num,
        status || existing[0].status,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('[API /banners/:id PUT error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update banner', error: error.message });
  }
});

/**
 * DELETE /api/banners/:id
 * Delete banner and remove uploaded asset
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (existing[0].image_url && existing[0].image_url.startsWith('/uploads/banners/')) {
      deleteFileByUrl(existing[0].image_url);
    }

    await pool.query('DELETE FROM banners WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('[API /banners/:id DELETE error]:', error);
    res.status(500).json({ success: false, message: 'Failed to delete banner', error: error.message });
  }
});

export default router;
