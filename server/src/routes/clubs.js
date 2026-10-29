import express from 'express';
import pool from '../config/db.js';
import { saveClubLogo, deleteFileByUrl } from '../utils/fileStorage.js';

const router = express.Router();

// GET all clubs (supports optional status, division, district, and search query filters)
router.get('/', async (req, res) => {
  try {
    const { status, division, district, q } = req.query;
    let query = 'SELECT * FROM clubs WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (division && division !== 'all') {
      query += ' AND division = ?';
      params.push(division);
    }

    if (district && district !== 'all') {
      query += ' AND district = ?';
      params.push(district);
    }

    if (q) {
      query += ' AND (name LIKE ? OR president LIKE ? OR district LIKE ? OR division LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY status ASC, total_registered_players DESC, name ASC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET single club by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clubs WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching club:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST create club
router.post('/', async (req, res) => {
  try {
    const {
      name,
      division = '',
      division_id = null,
      district,
      district_id = null,
      address = '',
      president = '',
      president_phone = '',
      president_email = '',
      contact_email = '',
      contact_phone = '',
      established_year = null,
      total_registered_players = 0,
      logo = null,
      logo_url = null,
      status = 'Active'
    } = req.body;

    if (!name || !district) {
      return res.status(400).json({ success: false, message: 'Club name and district are required' });
    }

    // Process logo if base64 provided
    let finalLogoUrl = logo_url;
    if (logo) {
      const savedLogo = await saveClubLogo(logo, `club_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)}`);
      if (savedLogo) {
        finalLogoUrl = savedLogo;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO clubs 
        (name, division, division_id, district, district_id, address, president, 
         president_phone, president_email, contact_email, contact_phone, 
         established_year, total_registered_players, logo_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        division || null,
        division_id ? Number(division_id) : null,
        district.trim(),
        district_id ? Number(district_id) : null,
        address ? address.trim() : null,
        president ? president.trim() : null,
        president_phone ? president_phone.trim() : (contact_phone ? contact_phone.trim() : null),
        president_email ? president_email.trim() : (contact_email ? contact_email.trim() : null),
        contact_email ? contact_email.trim() : (president_email ? president_email.trim() : null),
        contact_phone ? contact_phone.trim() : (president_phone ? president_phone.trim() : null),
        established_year ? Number(established_year) : null,
        total_registered_players ? Number(total_registered_players) : 0,
        finalLogoUrl || null,
        status || 'Active'
      ]
    );

    const [createdRows] = await pool.query('SELECT * FROM clubs WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Club registered successfully',
      data: createdRows[0]
    });
  } catch (error) {
    console.error('Error adding club:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT update club
router.put('/:id', async (req, res) => {
  try {
    const clubId = req.params.id;
    const [existing] = await pool.query('SELECT * FROM clubs WHERE id = ?', [clubId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const currentClub = existing[0];
    const {
      name = currentClub.name,
      division = currentClub.division,
      division_id = currentClub.division_id,
      district = currentClub.district,
      district_id = currentClub.district_id,
      address = currentClub.address,
      president = currentClub.president,
      president_phone = currentClub.president_phone,
      president_email = currentClub.president_email,
      contact_email = currentClub.contact_email,
      contact_phone = currentClub.contact_phone,
      established_year = currentClub.established_year,
      total_registered_players = currentClub.total_registered_players,
      logo = undefined,
      logo_url = currentClub.logo_url,
      status = currentClub.status
    } = req.body;

    let finalLogoUrl = logo_url;

    // If new base64 image uploaded
    if (logo && typeof logo === 'string' && logo.startsWith('data:image')) {
      const savedLogo = await saveClubLogo(logo, `club_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)}`);
      if (savedLogo) {
        if (currentClub.logo_url && currentClub.logo_url !== savedLogo) {
          deleteFileByUrl(currentClub.logo_url);
        }
        finalLogoUrl = savedLogo;
      }
    } else if (logo === null || logo_url === null) {
      if (currentClub.logo_url) {
        deleteFileByUrl(currentClub.logo_url);
      }
      finalLogoUrl = null;
    }

    await pool.query(
      `UPDATE clubs SET 
        name = ?, division = ?, division_id = ?, district = ?, district_id = ?, 
        address = ?, president = ?, president_phone = ?, president_email = ?, 
        contact_email = ?, contact_phone = ?, established_year = ?, 
        total_registered_players = ?, logo_url = ?, status = ?
       WHERE id = ?`,
      [
        name ? name.trim() : currentClub.name,
        division || null,
        division_id ? Number(division_id) : null,
        district ? district.trim() : currentClub.district,
        district_id ? Number(district_id) : null,
        address !== undefined ? (address ? address.trim() : null) : currentClub.address,
        president !== undefined ? (president ? president.trim() : null) : currentClub.president,
        president_phone !== undefined ? (president_phone ? president_phone.trim() : null) : currentClub.president_phone,
        president_email !== undefined ? (president_email ? president_email.trim() : null) : currentClub.president_email,
        contact_email !== undefined ? (contact_email ? contact_email.trim() : null) : currentClub.contact_email,
        contact_phone !== undefined ? (contact_phone ? contact_phone.trim() : null) : currentClub.contact_phone,
        established_year ? Number(established_year) : null,
        total_registered_players !== undefined ? Number(total_registered_players) : currentClub.total_registered_players,
        finalLogoUrl,
        status || currentClub.status,
        clubId
      ]
    );

    const [updatedRows] = await pool.query('SELECT * FROM clubs WHERE id = ?', [clubId]);

    res.json({
      success: true,
      message: 'Club updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Error updating club:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PATCH toggle or update status
router.patch('/:id/status', async (req, res) => {
  try {
    const clubId = req.params.id;
    const { status } = req.body;

    const [existing] = await pool.query('SELECT * FROM clubs WHERE id = ?', [clubId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    let nextStatus = status;
    if (!nextStatus) {
      nextStatus = existing[0].status === 'Active' ? 'Inactive' : 'Active';
    }

    await pool.query('UPDATE clubs SET status = ? WHERE id = ?', [nextStatus, clubId]);

    res.json({
      success: true,
      message: `Club status updated to ${nextStatus}`,
      data: { id: Number(clubId), status: nextStatus }
    });
  } catch (error) {
    console.error('Error toggling club status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE club
router.delete('/:id', async (req, res) => {
  try {
    const clubId = req.params.id;
    const [existing] = await pool.query('SELECT * FROM clubs WHERE id = ?', [clubId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    if (existing[0].logo_url) {
      deleteFileByUrl(existing[0].logo_url);
    }

    await pool.query('DELETE FROM clubs WHERE id = ?', [clubId]);

    res.json({ success: true, message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Error deleting club:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
