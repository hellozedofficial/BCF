import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

/**
 * GET /api/about
 * Retrieve about section and federation info
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cms_about WHERE id = 1');
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          id: 1,
          badge: 'Official National Authority',
          headline: 'Governing Carrom Excellence Across Bangladesh',
          story_p1: 'Founded in 1990 and officially recognized by the National Sports Council (NSC), the Bangladesh Carrom Federation (BCF) stands as the country’s apex governing authority, affiliated with the International Carrom Federation (ICF) and the Asian Carrom Federation (ACF).',
          story_p2: 'From grooming grassroots striker prodigies across 64 districts to organizing the marquee National Championship and Premier League, BCF empowers titleholders, certifies tournament referees, and proudly waves the Bangladesh flag on the world stage.',
          history_story: 'The Bangladesh Carrom Federation was established with a singular mission: transform carrom from an informal neighborhood pastime into a disciplined, professional, and internationally competitive sport. Over three decades, BCF has produced South Asian champions, established standardized playing regulations conforming to ICF norms, and integrated technology with live digital boards and referee academies.',
          mission: 'To nurture talent from grassroots schools and district clubs, provide institutional backing for national athletes, and maintain high standards of sportsmanship and ethical governance.',
          vision: 'To establish Bangladesh as a dominant force in world carrom championships and make carrom an accessible, revered, and technologically modern national sport.',
          office_address: 'National Sports Council (NSC) Tower, 62/3 Purana Paltan, Dhaka-1000',
          official_colors: 'Bangladesh Bottle Green & Gold',
          bounce_images: [
            'https://images.unsplash.com/photo-1767619834318-63184920c4b1?q=80&w=2531&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1620741212042-191b98df5e47?q=80&w=2340&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1652558973276-7c57960f50cd?q=80&w=1974&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1652558973232-f1c4ca08528a?q=80&w=1974&auto=format&fit=crop'
          ]
        }
      });
    }

    const data = rows[0];
    if (typeof data.bounce_images === 'string') {
      try {
        data.bounce_images = JSON.parse(data.bounce_images);
      } catch (e) {
        data.bounce_images = [];
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('[API /about GET error]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch about data', error: error.message });
  }
});

/**
 * PUT /api/about
 * Update about CMS settings
 */
router.put('/', async (req, res) => {
  try {
    const {
      badge,
      headline,
      story_p1,
      story_p2,
      history_story,
      mission,
      vision,
      office_address,
      official_colors,
      bounce_images
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM cms_about WHERE id = 1');

    const formattedBounceImages = Array.isArray(bounce_images)
      ? JSON.stringify(bounce_images)
      : (typeof bounce_images === 'string' ? bounce_images : (existing[0]?.bounce_images || '[]'));

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO cms_about (id, badge, headline, story_p1, story_p2, history_story, mission, vision, office_address, official_colors, bounce_images)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          badge || 'Official National Authority',
          headline || 'Governing Carrom Excellence Across Bangladesh',
          story_p1 || '',
          story_p2 || '',
          history_story || '',
          mission || '',
          vision || '',
          office_address || '',
          official_colors || '',
          formattedBounceImages
        ]
      );
    } else {
      await pool.query(
        `UPDATE cms_about
         SET badge = ?, headline = ?, story_p1 = ?, story_p2 = ?, history_story = ?, mission = ?, vision = ?, office_address = ?, official_colors = ?, bounce_images = ?
         WHERE id = 1`,
        [
          badge !== undefined ? badge : existing[0].badge,
          headline !== undefined ? headline : existing[0].headline,
          story_p1 !== undefined ? story_p1 : existing[0].story_p1,
          story_p2 !== undefined ? story_p2 : existing[0].story_p2,
          history_story !== undefined ? history_story : existing[0].history_story,
          mission !== undefined ? mission : existing[0].mission,
          vision !== undefined ? vision : existing[0].vision,
          office_address !== undefined ? office_address : existing[0].office_address,
          official_colors !== undefined ? official_colors : existing[0].official_colors,
          formattedBounceImages
        ]
      );
    }

    const [updated] = await pool.query('SELECT * FROM cms_about WHERE id = 1');
    const result = updated[0];
    if (typeof result.bounce_images === 'string') {
      try {
        result.bounce_images = JSON.parse(result.bounce_images);
      } catch (e) {
        result.bounce_images = [];
      }
    }

    res.json({
      success: true,
      message: 'About & Story information updated successfully',
      data: result
    });
  } catch (error) {
    console.error('[API /about PUT error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update about data', error: error.message });
  }
});

export default router;
