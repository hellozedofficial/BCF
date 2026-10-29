import express from 'express';
import pool from '../config/db.js';
import { saveNewsImage, saveEditorImage, deleteFileByUrl } from '../utils/fileStorage.js';

const router = express.Router();

/**
 * Generate URL-friendly slug
 */
function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensure unique slug in database
 */
async function ensureUniqueSlug(desiredSlug, currentId = null) {
  let base = slugify(desiredSlug) || 'post';
  let candidate = base;
  let counter = 1;

  while (true) {
    const query = currentId
      ? 'SELECT id FROM news WHERE slug = ? AND id != ?'
      : 'SELECT id FROM news WHERE slug = ?';
    const params = currentId ? [candidate, currentId] : [candidate];
    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return candidate;
    }
    candidate = `${base}-${counter}`;
    counter++;
  }
}

/**
 * Upload image for rich editor
 * POST /api/news/upload-image
 */
router.post('/upload-image', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    const savedUrl = await saveEditorImage(image, 'editor_content');
    if (!savedUrl) {
      return res.status(500).json({ success: false, message: 'Failed to process image' });
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: savedUrl
    });
  } catch (error) {
    console.error('Error uploading editor image:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/news
 * Query filters: ?type=News|Blog, ?status=Published|Draft, ?search=..., ?category=...
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, category, search, limit } = req.query;
    let query = 'SELECT * FROM news WHERE 1=1';
    const params = [];

    if (type && ['News', 'Blog'].includes(type)) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status && ['Published', 'Draft'].includes(status)) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY is_pinned DESC, publish_date DESC, id DESC';

    if (limit && !isNaN(parseInt(limit, 10))) {
      query += ` LIMIT ${parseInt(limit, 10)}`;
    }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/news/:slugOrId
 * Fetch single article by slug or numeric ID, and increment views_count
 */
router.get('/:slugOrId', async (req, res) => {
  try {
    const param = req.params.slugOrId;
    const isNumeric = /^\d+$/.test(param);

    let query = isNumeric
      ? 'SELECT * FROM news WHERE id = ? OR slug = ? LIMIT 1'
      : 'SELECT * FROM news WHERE slug = ? LIMIT 1';
    let params = isNumeric ? [parseInt(param, 10), param] : [param];

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const item = rows[0];

    // Increment views count asynchronously
    pool.query('UPDATE news SET views_count = views_count + 1 WHERE id = ?', [item.id]).catch(() => {});

    // Also get related articles (same type or category, excluding current)
    const [related] = await pool.query(
      'SELECT id, title, type, slug, image_url, category, publish_date FROM news WHERE id != ? AND status = "Published" AND (type = ? OR category = ?) ORDER BY publish_date DESC LIMIT 4',
      [item.id, item.type, item.category]
    );

    res.json({
      success: true,
      data: item,
      related: related || []
    });
  } catch (error) {
    console.error('Error fetching article details:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/news
 * Create new News or Blog
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      type = 'News',
      slug,
      image,
      image_url,
      summary,
      category = 'Announcement',
      content,
      author = 'BCF Media Cell',
      publish_date,
      is_pinned = false,
      status = 'Published'
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const finalType = type === 'Blog' ? 'Blog' : 'News';
    const finalSlug = await ensureUniqueSlug(slug || title);

    // Save image if base64 provided, else use existing URL
    let finalImageUrl = image_url || null;
    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      finalImageUrl = await saveNewsImage(image, `news_${finalSlug}`);
    }

    // Auto-extract short summary if not provided
    let finalSummary = summary;
    if (!finalSummary) {
      const stripped = content.replace(/<[^>]*>/g, '').trim();
      finalSummary = stripped.length > 200 ? stripped.substring(0, 197) + '...' : stripped;
    }

    const finalDate = publish_date || new Date().toISOString().split('T')[0];

    const [result] = await pool.query(
      `INSERT INTO news 
       (title, type, slug, image_url, summary, category, content, author, publish_date, is_pinned, status, views_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        title.trim(),
        finalType,
        finalSlug,
        finalImageUrl,
        finalSummary,
        category,
        content,
        author || 'BCF Media Cell',
        finalDate,
        Boolean(is_pinned),
        status === 'Draft' ? 'Draft' : 'Published'
      ]
    );

    res.status(201).json({
      success: true,
      message: `${finalType} published successfully`,
      data: {
        id: result.insertId,
        title,
        type: finalType,
        slug: finalSlug,
        image_url: finalImageUrl
      }
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/news/:id
 * Update existing News or Blog
 */
router.put('/:id', async (req, res) => {
  try {
    const newsId = parseInt(req.params.id, 10);
    const [existing] = await pool.query('SELECT * FROM news WHERE id = ?', [newsId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'News item not found' });
    }

    const current = existing[0];
    const {
      title = current.title,
      type = current.type,
      slug = current.slug,
      image,
      image_url = current.image_url,
      summary = current.summary,
      category = current.category,
      content = current.content,
      author = current.author,
      publish_date = current.publish_date,
      is_pinned = current.is_pinned,
      status = current.status
    } = req.body;

    let finalSlug = current.slug;
    if (slug && slug !== current.slug) {
      finalSlug = await ensureUniqueSlug(slug, newsId);
    } else if (!current.slug) {
      finalSlug = await ensureUniqueSlug(title, newsId);
    }

    let finalImageUrl = image_url;
    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      finalImageUrl = await saveNewsImage(image, `news_${finalSlug}`);
      if (current.image_url && current.image_url.startsWith('/uploads/news/')) {
        deleteFileByUrl(current.image_url);
      }
    }

    let finalSummary = summary;
    if (!finalSummary && content) {
      const stripped = content.replace(/<[^>]*>/g, '').trim();
      finalSummary = stripped.length > 200 ? stripped.substring(0, 197) + '...' : stripped;
    }

    await pool.query(
      `UPDATE news SET 
        title = ?,
        type = ?,
        slug = ?,
        image_url = ?,
        summary = ?,
        category = ?,
        content = ?,
        author = ?,
        publish_date = ?,
        is_pinned = ?,
        status = ?
      WHERE id = ?`,
      [
        title.trim(),
        type === 'Blog' ? 'Blog' : 'News',
        finalSlug,
        finalImageUrl,
        finalSummary,
        category,
        content,
        author,
        publish_date,
        Boolean(is_pinned),
        status === 'Draft' ? 'Draft' : 'Published',
        newsId
      ]
    );

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: { id: newsId, slug: finalSlug, image_url: finalImageUrl }
    });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * DELETE /api/news/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const newsId = parseInt(req.params.id, 10);
    const [existing] = await pool.query('SELECT image_url FROM news WHERE id = ?', [newsId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'News item not found' });
    }

    if (existing[0].image_url && existing[0].image_url.startsWith('/uploads/news/')) {
      deleteFileByUrl(existing[0].image_url);
    }

    await pool.query('DELETE FROM news WHERE id = ?', [newsId]);
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
