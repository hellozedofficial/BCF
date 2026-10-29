import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

/**
 * Ensures directory exists
 */
function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Save Base64 image to disk compressed with Sharp (< 500 KB target)
 * @param {string} base64String - Data URI or raw base64 string
 * @param {string} subDir - Subfolder inside uploads (e.g. 'players/photos', 'players/nids')
 * @param {string} prefix - Filename prefix (e.g. 'photo_BCF20261001')
 * @returns {Promise<string|null>} Relative URL path e.g. '/uploads/players/photos/xyz.jpg'
 */
export async function saveBase64Image(base64String, subDir = 'players/photos', prefix = 'img') {
  if (!base64String || typeof base64String !== 'string') return null;

  // If already an existing upload URL, keep as is
  if (base64String.startsWith('/uploads/') || base64String.startsWith('http')) {
    return base64String;
  }

  try {
    const rawData = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(rawData, 'base64');
    if (!buffer || buffer.length === 0) return null;

    const targetDir = path.join(UPLOADS_ROOT, subDir);
    ensureDirSync(targetDir);

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    const fullPath = path.join(targetDir, filename);

    const isPhoto = subDir.includes('photos') || prefix.includes('photo');

    if (isPhoto) {
      // Strictly crop to 1:1 square with center anchor
      await sharp(buffer)
        .resize({ width: 800, height: 800, fit: 'cover', position: 'center' })
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .toFile(fullPath);
    } else {
      // Compress documents/NID keeping aspect ratio inside 1600x1600
      await sharp(buffer)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toFile(fullPath);
    }

    return `/uploads/${subDir}/${filename}`;
  } catch (err) {
    console.error(`[FILE STORAGE ERROR] Failed to save image to ${subDir}:`, err.message);
    return null;
  }
}

/**
 * Save Base64 Banner image to disk with 16:9 optimization
 * @param {string} base64String - Data URI or raw base64 string
 * @param {string} prefix - Filename prefix (e.g. 'banner')
 * @returns {Promise<string|null>} Relative URL path e.g. '/uploads/banners/xyz.webp'
 */
export async function saveBannerImage(base64String, prefix = 'banner') {
  if (!base64String || typeof base64String !== 'string') return null;

  if (base64String.startsWith('/uploads/') || base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return base64String;
  }

  try {
    const rawData = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(rawData, 'base64');
    if (!buffer || buffer.length === 0) return null;

    const targetDir = path.join(UPLOADS_ROOT, 'banners');
    ensureDirSync(targetDir);

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
    const fullPath = path.join(targetDir, filename);

    await sharp(buffer)
      .resize({ width: 1920, height: 1080, fit: 'cover', position: 'center' })
      .webp({ quality: 86 })
      .toFile(fullPath);

    return `/uploads/banners/${filename}`;
  } catch (err) {
    console.error('[FILE STORAGE] Error saving banner image:', err);
    return null;
  }
}

/**
 * Save Base64 News Featured/Cover image (16:9 / 1200x675 webp)
 * @param {string} base64String 
 * @param {string} prefix 
 * @returns {Promise<string|null>}
 */
export async function saveNewsImage(base64String, prefix = 'news_cover') {
  if (!base64String || typeof base64String !== 'string') return null;

  if (base64String.startsWith('/uploads/') || base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return base64String;
  }

  try {
    const rawData = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(rawData, 'base64');
    if (!buffer || buffer.length === 0) return null;

    const targetDir = path.join(UPLOADS_ROOT, 'news');
    ensureDirSync(targetDir);

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
    const fullPath = path.join(targetDir, filename);

    await sharp(buffer)
      .resize({ width: 1200, height: 675, fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(fullPath);

    return `/uploads/news/${filename}`;
  } catch (err) {
    console.error('[FILE STORAGE] Error saving news cover image:', err);
    return null;
  }
}

/**
 * Save Base64 Rich Editor inline image (inside 1600x1600 webp)
 * @param {string} base64String 
 * @param {string} prefix 
 * @returns {Promise<string|null>}
 */
export async function saveEditorImage(base64String, prefix = 'editor_inline') {
  if (!base64String || typeof base64String !== 'string') return null;

  if (base64String.startsWith('/uploads/') || base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return base64String;
  }

  try {
    const rawData = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(rawData, 'base64');
    if (!buffer || buffer.length === 0) return null;

    const targetDir = path.join(UPLOADS_ROOT, 'news/editor');
    ensureDirSync(targetDir);

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
    const fullPath = path.join(targetDir, filename);

    await sharp(buffer)
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(fullPath);

    return `/uploads/news/editor/${filename}`;
  } catch (err) {
    console.error('[FILE STORAGE] Error saving editor image:', err);
    return null;
  }
}

/**
 * Save Base64 Club Logo (square/contain up to 512x512 webp preserving transparency)
 * @param {string} base64String 
 * @param {string} prefix 
 * @returns {Promise<string|null>}
 */
export async function saveClubLogo(base64String, prefix = 'club_logo') {
  if (!base64String || typeof base64String !== 'string') return null;

  if (base64String.startsWith('/uploads/') || base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return base64String;
  }

  try {
    const rawData = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(rawData, 'base64');
    if (!buffer || buffer.length === 0) return null;

    const targetDir = path.join(UPLOADS_ROOT, 'clubs');
    ensureDirSync(targetDir);

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
    const fullPath = path.join(targetDir, filename);

    await sharp(buffer)
      .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(fullPath);

    return `/uploads/clubs/${filename}`;
  } catch (err) {
    console.error('[FILE STORAGE] Error saving club logo:', err);
    return null;
  }
}

/**
 * Delete a file given its public URL or relative path
 * @param {string} fileUrl e.g. '/uploads/players/photos/photo_123.jpg'
 */
export function deleteFileByUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  try {
    // Strip domain if full URL provided
    const cleanPath = fileUrl.replace(/^https?:\/\/[^/]+/, '');
    if (!cleanPath.startsWith('/uploads/')) return;

    const relativePath = cleanPath.replace(/^\/uploads\//, '');
    const fullPath = path.join(UPLOADS_ROOT, relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[FILE STORAGE] Successfully deleted file: ${fullPath}`);
    }
  } catch (err) {
    console.error(`[FILE STORAGE DELETE ERROR] Could not delete ${fileUrl}:`, err.message);
  }
}

/**
 * Delete multiple files by URLs
 * @param {Array<string>} urls
 */
export function deletePlayerFiles(urls = []) {
  if (!Array.isArray(urls)) return;
  for (const url of urls) {
    if (url) deleteFileByUrl(url);
  }
}
