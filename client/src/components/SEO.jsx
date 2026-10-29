import { useEffect } from 'react';

/**
 * Dynamic SEO Head Manager for SPA
 * Injects meta tags, OpenGraph, Twitter Cards, Canonical URL, and JSON-LD structured data
 */
export default function SEO({
  title,
  description,
  image,
  type = 'article',
  publishedTime,
  author,
  category,
  slug,
  schema
}) {
  useEffect(() => {
    // 1. Document Title
    const siteName = 'Bangladesh Carrom Federation (BCF)';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    document.title = fullTitle;

    // Helper to set or update meta tag
    const setMeta = (attr, key, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    const defaultDesc =
      'Official media bulletin and editorial portal of the Bangladesh Carrom Federation (BCF). National championships, master player tactics, and federation news.';
    const finalDesc = description || defaultDesc;
    setMeta('name', 'description', finalDesc);
    if (author) setMeta('name', 'author', author);

    // 3. OpenGraph / Facebook Tags
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    setMeta('property', 'og:site_name', siteName);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', finalDesc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', currentUrl);
    if (image) setMeta('property', 'og:image', image);
    if (publishedTime) setMeta('property', 'article:published_time', publishedTime);
    if (category) setMeta('property', 'article:section', category);

    // 4. Twitter Card Tags
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', finalDesc);
    if (image) setMeta('name', 'twitter:image', image);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // 6. JSON-LD Structured Data
    let scriptTag = document.querySelector('script[data-schema="bcf-seo"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      scriptTag.setAttribute('data-schema', 'bcf-seo');
      document.head.appendChild(scriptTag);
    }

    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'NewsArticle' : 'WebPage',
      headline: title || siteName,
      description: finalDesc,
      image: image ? [image] : undefined,
      datePublished: publishedTime,
      url: currentUrl,
      author: {
        '@type': 'Organization',
        name: author || 'Bangladesh Carrom Federation'
      },
      publisher: {
        '@type': 'SportsOrganization',
        name: siteName,
        url: window.location.origin,
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/logo.png`
        }
      }
    };

    scriptTag.textContent = JSON.stringify(schema || defaultSchema);

    // Cleanup on unmount (restore defaults)
    return () => {
      document.title = siteName;
    };
  }, [title, description, image, type, publishedTime, author, category, slug, schema]);

  return null;
}
