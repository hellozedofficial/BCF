import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET all divisions
router.get('/divisions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM divisions ORDER BY id ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching divisions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET districts (with optional division_id filter)
router.get('/districts', async (req, res) => {
  try {
    const { division_id } = req.query;
    let query = `
      SELECT d.*, dv.name as division_name, dv.bn_name as division_bn_name
      FROM districts d
      LEFT JOIN divisions dv ON d.division_id = dv.id
    `;
    const params = [];

    if (division_id) {
      query += ' WHERE d.division_id = ?';
      params.push(division_id);
    }

    query += ' ORDER BY d.id ASC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET upazilas (with optional district_id filter)
router.get('/upazilas', async (req, res) => {
  try {
    const { district_id } = req.query;
    let query = `
      SELECT u.*, d.name as district_name, d.bn_name as district_bn_name
      FROM upazilas u
      LEFT JOIN districts d ON u.district_id = d.id
    `;
    const params = [];

    if (district_id) {
      query += ' WHERE u.district_id = ?';
      params.push(district_id);
    }

    query += ' ORDER BY u.id ASC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching upazilas:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET unions (with optional upazila_id filter)
router.get('/unions', async (req, res) => {
  try {
    const { upazila_id, limit = 500, offset = 0 } = req.query;
    let query = `
      SELECT un.*, u.name as upazila_name, u.bn_name as upazila_bn_name
      FROM unions un
      LEFT JOIN upazilas u ON un.upazila_id = u.id
    `;
    const params = [];

    if (upazila_id) {
      query += ' WHERE un.upazila_id = ?';
      params.push(upazila_id);
    }

    query += ' ORDER BY un.id ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching unions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET geocode summary stats
router.get('/stats', async (req, res) => {
  try {
    const [[divCount]] = await pool.query('SELECT COUNT(*) as count FROM divisions');
    const [[distCount]] = await pool.query('SELECT COUNT(*) as count FROM districts');
    const [[upzCount]] = await pool.query('SELECT COUNT(*) as count FROM upazilas');
    const [[unionCount]] = await pool.query('SELECT COUNT(*) as count FROM unions');

    res.json({
      success: true,
      data: {
        total_divisions: divCount.count,
        total_districts: distCount.count,
        total_upazilas: upzCount.count,
        total_unions: unionCount.count
      }
    });
  } catch (error) {
    console.error('Error fetching geocode stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
