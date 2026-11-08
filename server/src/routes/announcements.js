import express from 'express';
import pool from '../config/db.js';
import { saveBannerImage, deleteFileByUrl } from '../utils/fileStorage.js';

const router = express.Router();

/**
 * GET /api/announcements
 * List all announcements (for Admin CMS)
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM announcements ORDER BY is_published DESC, updated_at DESC, id DESC'
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[API /announcements GET error]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch announcements', error: error.message });
  }
});

/**
 * GET /api/announcements/active
 * Returns the latest active/published announcement for the client website modal
 */
router.get('/active', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM announcements WHERE is_published = 1 ORDER BY updated_at DESC, id DESC LIMIT 1'
    );
    res.json({
      success: true,
      data: rows.length > 0 ? rows[0] : null
    });
  } catch (error) {
    console.error('[API /announcements/active GET error]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active announcement', error: error.message });
  }
});

/**
 * POST /api/announcements
 * Create a new popup announcement
 */
router.post('/', async (req, res) => {
  try {
    const {
      title = '',
      content = '',
      image_url = '',
      link_url = '',
      button_text = 'Learn More',
      is_published = 1
    } = req.body;

    if (!title?.trim() && !content?.trim() && !image_url?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least announcement text, a title, or a banner image.'
      });
    }

    let savedImageUrl = image_url ? image_url.trim() : null;
    if (savedImageUrl && savedImageUrl.startsWith('data:image')) {
      savedImageUrl = await saveBannerImage(savedImageUrl, 'announcement');
    }

    const publishedFlag = is_published === false || is_published === 0 || is_published === '0' ? 0 : 1;

    const [result] = await pool.query(
      `INSERT INTO announcements (title, content, image_url, link_url, button_text, is_published)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title ? title.trim() : null,
        content ? content.trim() : null,
        savedImageUrl || null,
        link_url ? link_url.trim() : null,
        button_text ? button_text.trim() : 'Learn More',
        publishedFlag
      ]
    );

    const [created] = await pool.query('SELECT * FROM announcements WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: created[0]
    });
  } catch (error) {
    console.error('[API /announcements POST error]:', error);
    res.status(500).json({ success: false, message: 'Failed to create announcement', error: error.message });
  }
});

/**
 * PUT /api/announcements/:id
 * Update an existing popup announcement
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      image_url,
      link_url,
      button_text,
      is_published
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    let savedImageUrl = existing[0].image_url;
    if (image_url !== undefined) {
      if (!image_url || !image_url.trim()) {
        if (existing[0].image_url) {
          deleteFileByUrl(existing[0].image_url);
        }
        savedImageUrl = null;
      } else if (image_url.startsWith('data:image')) {
        const uploaded = await saveBannerImage(image_url, 'announcement');
        if (uploaded) {
          if (existing[0].image_url) {
            deleteFileByUrl(existing[0].image_url);
          }
          savedImageUrl = uploaded;
        }
      } else {
        savedImageUrl = image_url.trim();
      }
    }

    const publishedFlag =
      is_published === undefined || is_published === null
        ? existing[0].is_published
        : is_published === false || is_published === 0 || is_published === '0'
        ? 0
        : 1;

    await pool.query(
      `UPDATE announcements
       SET title = ?,
           content = ?,
           image_url = ?,
           link_url = ?,
           button_text = ?,
           is_published = ?
       WHERE id = ?`,
      [
        title !== undefined ? (title ? title.trim() : null) : existing[0].title,
        content !== undefined ? (content ? content.trim() : null) : existing[0].content,
        savedImageUrl,
        link_url !== undefined ? (link_url ? link_url.trim() : null) : existing[0].link_url,
        button_text !== undefined ? (button_text ? button_text.trim() : 'Learn More') : existing[0].button_text,
        publishedFlag,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('[API /announcements/:id PUT error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update announcement', error: error.message });
  }
});

/**
 * PATCH /api/announcements/:id/publish
 * Toggle publish / unpublish status
 */
router.patch('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    const [existing] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const publishedFlag =
      is_published === undefined
        ? (existing[0].is_published ? 0 : 1)
        : (is_published === false || is_published === 0 || is_published === '0' ? 0 : 1);

    await pool.query('UPDATE announcements SET is_published = ? WHERE id = ?', [publishedFlag, id]);

    const [updated] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);

    res.json({
      success: true,
      message: publishedFlag ? 'Announcement published on website' : 'Announcement unpublished',
      data: updated[0]
    });
  } catch (error) {
    console.error('[API /announcements/:id/publish PATCH error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update announcement status', error: error.message });
  }
});

/**
 * DELETE /api/announcements/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (existing[0].image_url) {
      deleteFileByUrl(existing[0].image_url);
    }

    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);

    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('[API /announcements/:id DELETE error]:', error);
    res.status(500).json({ success: false, message: 'Failed to delete announcement', error: error.message });
  }
});

export default router;
