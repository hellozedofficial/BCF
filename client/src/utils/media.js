/**
 * Video & Live Stream Embed Helpers for BCF Client Portal
 * Handles YouTube (standard, share, live, shorts), Facebook Video/Live, Vimeo
 */

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // Match formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  const regExp = /(?:youtube\.com\/(?:watch\?.*v=|live\/|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = cleanUrl.match(regExp);
  return match && match[1] ? match[1] : null;
}

export function getEmbedUrl(rawUrl, options = {}) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (!url) return null;

  const { autoplay = true, mute = false } = options;

  // 1. YouTube
  const ytId = extractYouTubeId(url);
  if (ytId) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1'
    });
    if (mute) params.append('mute', '1');
    return `https://www.youtube-nocookie.com/embed/${ytId}?${params.toString()}`;
  }

  // 2. Facebook Video / Live
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=${autoplay ? 'true' : 'false'}`;
  }

  // 3. Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=${autoplay ? '1' : '0'}`;
  }

  // 4. Raw Embed / Direct valid http(s) URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return null;
}

