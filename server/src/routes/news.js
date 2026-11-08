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
 * Extract YouTube Video ID from any YouTube URL format
 */
function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Decode HTML entities in meta tag URLs (e.g. &amp; -> &)
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#x26;/gi, '&')
    .replace(/&#38;/g, '&')
    .replace(/&#x3a;/gi, ':')
    .replace(/&#x2f;/gi, '/')
    .replace(/&quot;/g, '"');
}

// In-memory cache for video dimensions/aspect-ratio metadata
const videoMetaCache = new Map();

/**
 * Resolve exact video dimensions, aspect ratio, and orientation for YouTube (Videos/Shorts) & Facebook (Videos/Reels/Watch)
 */
async function resolveVideoMeta(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') return null;
  const cleanUrl = videoUrl.trim();
  if (!cleanUrl) return null;

  if (videoMetaCache.has(cleanUrl)) {
    return videoMetaCache.get(cleanUrl);
  }

  // 1. YouTube Video or YouTube Shorts
  const ytId = extractYouTubeId(cleanUrl);
  if (ytId) {
    const isShortUrl = /\/shorts\//i.test(cleanUrl);
    let width = isShortUrl ? 405 : 1280;
    let height = 720;

    try {
      const watchResp = await fetch(`https://www.youtube.com/watch?v=${ytId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (watchResp.ok) {
        const html = await watchResp.text();
        const wMatch = html.match(/<meta[^>]+property=["']og:video:width["'][^>]+content=["'](\d+)["']/i);
        const hMatch = html.match(/<meta[^>]+property=["']og:video:height["'][^>]+content=["'](\d+)["']/i);
        if (wMatch && hMatch) {
          const w = parseInt(wMatch[1], 10);
          const h = parseInt(hMatch[1], 10);
          if (w > 0 && h > 0) {
            width = w;
            height = h;
          }
        }
      }
    } catch (e) {
      // keep fallback dimensions
    }

    if (isShortUrl && width > height) {
      width = 405;
      height = 720;
    }

    const aspectRatio = Number((width / height).toFixed(4));
    const meta = {
      platform: 'youtube',
      videoId: ytId,
      width,
      height,
      aspectRatio,
      isVertical: height > width,
      isShort: isShortUrl || height > width
    };
    videoMetaCache.set(cleanUrl, meta);
    return meta;
  }

  // 2. Facebook Video / Reel / Watch
  const isFacebook = /(?:facebook\.com|fb\.watch|fb\.gg)/i.test(cleanUrl);
  if (isFacebook) {
    const isReelUrl = /\/(?:reel|share\/r)\//i.test(cleanUrl);
    let width = isReelUrl ? 500 : 1280;
    let height = isReelUrl ? 889 : 720;
    let pluginThumbUrl = null;

    try {
      const pluginResp = await fetch(
        `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=false`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      );
      if (pluginResp.ok) {
        const html = await pluginResp.text();
        const dwMatch = html.match(/data-video-width=["'](\d+)["']/i);
        const dhMatch = html.match(/data-video-height=["'](\d+)["']/i);
        const pbMatch = html.match(/padding-bottom:\s*([\d.]+)%/i);

        if (dwMatch && dhMatch) {
          const w = parseInt(dwMatch[1], 10);
          const h = parseInt(dhMatch[1], 10);
          if (w > 0 && h > 0) {
            width = w;
            height = h;
          }
        } else if (pbMatch) {
          const pct = parseFloat(pbMatch[1]);
          if (pct > 0) {
            width = 1000;
            height = Math.round(10 * pct);
          }
        }

        const imgMatch = html.match(/<img[^>]+class=["'][^"']*\bimg\b[^"']*["'][^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
          pluginThumbUrl = decodeHtmlEntities(imgMatch[1]);
        }
      }
    } catch (e) {
      // keep fallback
    }

    const aspectRatio = Number((width / height).toFixed(4));
    const meta = {
      platform: 'facebook',
      width,
      height,
      aspectRatio,
      isVertical: height > width,
      isReel: isReelUrl || height > width,
      pluginThumbUrl
    };
    videoMetaCache.set(cleanUrl, meta);
    return meta;
  }

  return null;
}

/**
 * Resolve thumbnail URL from a YouTube or Facebook video link
 */
async function resolveVideoThumbnail(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') return null;
  const cleanUrl = videoUrl.trim();
  const meta = await resolveVideoMeta(cleanUrl);

  // 1. Check YouTube
  const ytId = extractYouTubeId(cleanUrl);
  if (ytId) {
    const maxRes = `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`;
    const hqRes = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    try {
      const headRes = await fetch(maxRes, { method: 'HEAD' });
      if (headRes.ok) {
        return { ...(meta || {}), platform: 'youtube', videoId: ytId, thumbnailUrl: maxRes };
      }
    } catch (e) {
      // ignore and fallback to hqdefault
    }
    return { ...(meta || {}), platform: 'youtube', videoId: ytId, thumbnailUrl: hqRes };
  }

  // 2. Check Facebook Video / Reel / Watch
  const isFacebook = /(?:facebook\.com|fb\.watch|fb\.gg)/i.test(cleanUrl);
  if (isFacebook) {
    let rawThumbUrl = null;

    // Try fetching OpenGraph metadata with crawler User-Agent first
    const userAgents = [
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ];

    for (const ua of userAgents) {
      if (rawThumbUrl) break;
      try {
        const resp = await fetch(cleanUrl, {
          headers: {
            'User-Agent': ua,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          },
          redirect: 'follow'
        });
        if (resp.ok) {
          const html = await resp.text();
          const ogMatch =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
            html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
          if (ogMatch && ogMatch[1]) {
            const candidate = decodeHtmlEntities(ogMatch[1]);
            if (candidate && !candidate.includes('fb_icon') && !candidate.includes('rsrc.php')) {
              rawThumbUrl = candidate;
              break;
            }
          }
        }
      } catch (e) {
        // try next UA
      }
    }

    if (!rawThumbUrl && meta?.pluginThumbUrl) {
      rawThumbUrl = meta.pluginThumbUrl;
    }

    // Fallback: extract numeric FB video ID and try graph picture endpoint
    if (!rawThumbUrl) {
      const fbIdMatch =
        cleanUrl.match(/\/videos\/(?:[^/]+\/)?(\d+)/i) ||
        cleanUrl.match(/\/reel\/(\d+)/i) ||
        cleanUrl.match(/[?&]v=(\d+)/i);
      if (fbIdMatch && fbIdMatch[1]) {
        try {
          const graphPic = `https://graph.facebook.com/${fbIdMatch[1]}/picture?type=large`;
          const picRes = await fetch(graphPic, { redirect: 'follow' });
          if (picRes.ok && picRes.headers.get('content-type')?.startsWith('image/')) {
            rawThumbUrl = picRes.url || graphPic;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (rawThumbUrl) {
      // Download the FB image and save to our storage so expiring FB CDN tokens never break the cover image
      try {
        const imgResp = await fetch(rawThumbUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });
        if (imgResp.ok) {
          const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await imgResp.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const dataUri = `data:${contentType};base64,${base64}`;
          const savedUrl = await saveNewsImage(dataUri, 'fb_video_cover');
          if (savedUrl) {
            return { ...(meta || {}), platform: 'facebook', thumbnailUrl: savedUrl };
          }
        }
      } catch (e) {
        // Fallback to rawThumbUrl if download fails
      }
      return { ...(meta || {}), platform: 'facebook', thumbnailUrl: rawThumbUrl };
    }
  }

  return null;
}

/**
 * GET /api/news/video-meta?url=...
 * Fast video dimension & aspect ratio resolver for YouTube (Videos/Shorts) & Facebook (Videos/Reels)
 */
router.get('/video-meta', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, message: 'Video URL is required' });
    }
    const meta = await resolveVideoMeta(url);
    if (!meta) {
      return res.status(404).json({ success: false, message: 'Unsupported video URL' });
    }
    res.json({ success: true, ...meta });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resolve video metadata', error: error.message });
  }
});

/**
 * GET /api/news/video-thumbnail?url=...
 * Auto-fetch cover thumbnail from YouTube or Facebook video URL
 */
router.get('/video-thumbnail', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, message: 'Video URL is required' });
    }

    const info = await resolveVideoThumbnail(url);
    if (!info || !info.thumbnailUrl) {
      return res.status(404).json({
        success: false,
        message: 'Could not extract a thumbnail from this video link. You can still upload a custom cover image.'
      });
    }

    res.json({
      success: true,
      platform: info.platform,
      videoId: info.videoId || null,
      thumbnailUrl: info.thumbnailUrl,
      width: info.width || null,
      height: info.height || null,
      aspectRatio: info.aspectRatio || null,
      isVertical: Boolean(info.isVertical)
    });
  } catch (error) {
    console.error('Error fetching video thumbnail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch video thumbnail', error: error.message });
  }
});

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

    // Attach video_meta if item has video_url so the client renders exact aspect ratio immediately
    if (item.video_url && item.video_url.trim()) {
      try {
        item.video_meta = await resolveVideoMeta(item.video_url);
      } catch (e) {
        item.video_meta = null;
      }
    }

    // Increment views count asynchronously
    pool.query('UPDATE news SET views_count = views_count + 1 WHERE id = ?', [item.id]).catch(() => {});

    // Also get related articles (same type or category, excluding current)
    const [related] = await pool.query(
      'SELECT id, title, type, slug, image_url, video_url, category, publish_date FROM news WHERE id != ? AND status = "Published" AND (type = ? OR category = ?) ORDER BY publish_date DESC LIMIT 4',
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
      video_url,
      summary,
      category = 'Announcement',
      content,
      author = 'BCF Media Cell',
      publish_date,
      is_pinned = false,
      status = 'Published'
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const safeContent = typeof content === 'string' ? content : '';
    const finalType = type === 'Blog' ? 'Blog' : 'News';
    const finalSlug = await ensureUniqueSlug(slug || title);
    const finalVideoUrl = video_url && typeof video_url === 'string' && video_url.trim() ? video_url.trim() : null;

    // Save image if base64 provided, else use existing URL
    let finalImageUrl = image_url || null;
    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      finalImageUrl = await saveNewsImage(image, `news_${finalSlug}`);
    } else if (!finalImageUrl && finalVideoUrl) {
      const thumbInfo = await resolveVideoThumbnail(finalVideoUrl);
      if (thumbInfo?.thumbnailUrl) {
        finalImageUrl = thumbInfo.thumbnailUrl;
      }
    }

    // Auto-extract short summary if not provided
    let finalSummary = summary;
    if (!finalSummary && safeContent) {
      const stripped = safeContent.replace(/<[^>]*>/g, '').trim();
      finalSummary = stripped.length > 200 ? stripped.substring(0, 197) + '...' : stripped;
    }

    const finalDate = publish_date || new Date().toISOString().split('T')[0];

    const [result] = await pool.query(
      `INSERT INTO news 
       (title, type, slug, image_url, video_url, summary, category, content, author, publish_date, is_pinned, status, views_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        title.trim(),
        finalType,
        finalSlug,
        finalImageUrl,
        finalVideoUrl,
        finalSummary || null,
        category,
        safeContent,
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
        image_url: finalImageUrl,
        video_url: finalVideoUrl
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
      video_url = current.video_url,
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

    const finalVideoUrl =
      video_url === undefined
        ? current.video_url
        : video_url && typeof video_url === 'string' && video_url.trim()
        ? video_url.trim()
        : null;

    let finalImageUrl = image_url;
    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      finalImageUrl = await saveNewsImage(image, `news_${finalSlug}`);
      if (current.image_url) {
        deleteFileByUrl(current.image_url);
      }
    } else if (!finalImageUrl && finalVideoUrl) {
      const thumbInfo = await resolveVideoThumbnail(finalVideoUrl);
      if (thumbInfo?.thumbnailUrl) {
        finalImageUrl = thumbInfo.thumbnailUrl;
      }
    }

    const safeContent = content === undefined ? (current.content || '') : (content || '');
    let finalSummary = summary;
    if (!finalSummary && safeContent) {
      const stripped = safeContent.replace(/<[^>]*>/g, '').trim();
      finalSummary = stripped.length > 200 ? stripped.substring(0, 197) + '...' : stripped;
    }

    await pool.query(
      `UPDATE news SET 
        title = ?,
        type = ?,
        slug = ?,
        image_url = ?,
        video_url = ?,
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
        finalVideoUrl,
        finalSummary || null,
        category,
        safeContent,
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
      data: { id: newsId, slug: finalSlug, image_url: finalImageUrl, video_url: finalVideoUrl }
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

    if (existing[0].image_url) {
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
