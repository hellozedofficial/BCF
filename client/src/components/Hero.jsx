import React, { useState, useEffect } from 'react';
import MorphSlider from './MorphSlider';
import { API_BASE, SERVER_BASE } from '../config/api';

const DEFAULT_SLIDES = [
  {
    image: 'https://scontent.fdac39-1.fna.fbcdn.net/v/t39.30808-6/795730795_122268866522146195_6889713579055724524_n.jpg?stp=cp6_dst-jpg_tt6&cstp=mx2048x1536&ctp=s2048x1536&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=Lo9WJN22wtIQ7kNvwH2NQdq&_nc_oc=AdpjgwDGPKUeNMThAFyqcL4pILxkVXdhf9VrDSCeLbOJ5J8xev4FBybFd3GN1Xd3siQ&_nc_zt=23&_nc_ht=scontent.fdac39-1.fna&_nc_gid=HUR-7ChUqk37jy-ttSv6Xw&_nc_ss=7b2a8&oh=00_AQOiN9z1psW0bDnG1V0G3xsqKTL9NucdIUnUK9qn8varHQ&oe=6AD522F4',
    caption: '1st Executive Meeting 2026'
  },
  {
    image: 'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
    caption: 'BCF Premier Carrom League • 16 District Franchises'
  },
  {
    image: 'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
    caption: 'National Squad World Championship Training Camp • Precision & White Slams'
  },
  {
    image: 'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop',
    caption: 'Grassroots Talent Identification & All-District Youth Championship'
  }
];

export default function Hero() {
  const [sliderItems, setSliderItems] = useState(DEFAULT_SLIDES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchBanners() {
      try {
        const res = await fetch(`${API_BASE}/banners?status=Active`);
        if (!res.ok) throw new Error('Failed to fetch banners');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          const formatted = data.data.map((b) => {
            let img = b.image_url;
            if (img && !img.startsWith('http://') && !img.startsWith('https://') && !img.startsWith('data:')) {
              img = `${SERVER_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
            }
            const caption = b.title + (b.subtitle ? ` • ${b.subtitle}` : '');
            return {
              image: img,
              caption: caption
            };
          });
          setSliderItems(formatted);
        }
      } catch (err) {
        console.warn('[HERO] Using fallback slides:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchBanners();
    return () => { isMounted = false; };
  }, []);

  return (
    <section style={{
      padding: '24px 0 32px 0',
      background: 'var(--bg-base)'
    }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        {/* Strictly 16:9 Banner Container */}
        <div className="hero-banner-box">
          <MorphSlider
            items={sliderItems}
            autoplay={true}
            autoplayDelay={4.5}
            transition="melt"
            duration={1.2}
            intensity={0.55}
            scale={2.2}
            radius={16}
            showCaptions={true}
            showControls={true}
            showIndicators={true}
          />
        </div>
      </div>
    </section>
  );
}
