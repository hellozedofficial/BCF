import express from 'express';
import pool from '../config/db.js';
import { saveBase64Image } from '../utils/fileStorage.js';

const router = express.Router();

/**
 * Generate unique 6-digit Umpire ID (e.g. BCF-U-100001)
 */
async function generateUniqueUmpireId() {
  const [lastRow] = await pool.query('SELECT id, umpire_id FROM umpires ORDER BY id DESC LIMIT 1');
  const nextNum = 100001 + (lastRow[0]?.id || 0);
  return `BCF-U-${nextNum}`;
}

// GET all umpires with optional search and filters
router.get('/', async (req, res) => {
  try {
    const { status, gender, search } = req.query;
    let query = `
      SELECT u.*,
             (SELECT COUNT(*) FROM matches m WHERE m.umpire_id = u.id) AS assigned_matches_count
      FROM umpires u
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      query += ' AND u.status = ?';
      params.push(status);
    }
    if (gender && gender !== 'All') {
      query += ' AND u.gender = ?';
      params.push(gender);
    }
    if (search) {
      query += ' AND (u.name LIKE ? OR u.umpire_id LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.nid_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY u.id DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching umpires:', error);
    res.status(500).json({ success: false, message: 'Server error fetching umpires', error: error.message });
  }
});

// GET single umpire by ID or umpire_id
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    const [rows] = await pool.query(
      `SELECT u.*,
              (SELECT COUNT(*) FROM matches m WHERE m.umpire_id = u.id) AS assigned_matches_count
       FROM umpires u 
       WHERE u.id = ? OR u.umpire_id = ?`,
      [param, param]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Umpire not found' });
    }

    // Get recent matches officiated
    const [matches] = await pool.query(
      `SELECT m.*, t.title as tournament_title 
       FROM matches m
       LEFT JOIN tournaments t ON m.tournament_id = t.id
       WHERE m.umpire_id = ?
       ORDER BY m.id DESC LIMIT 10`,
      [rows[0].id]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        recent_matches: matches
      }
    });
  } catch (error) {
    console.error('Error fetching umpire detail:', error);
    res.status(500).json({ success: false, message: 'Server error fetching umpire detail', error: error.message });
  }
});

// POST create new umpire
router.post('/', async (req, res) => {
  try {
    const {
      name,
      name_bangla,
      email,
      phone,
      photo_url,
      joined_date,
      nid_number,
      dob,
      gender,
      status,
      grade,
      federation_id
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Umpire name is required' });
    }

    // Save profile photo if provided in base64
    let savedPhotoUrl = null;
    if (photo_url) {
      savedPhotoUrl = await saveBase64Image(photo_url, 'umpires/photos', 'umpire');
    }

    // Auto-generate 6-digit unique Umpire Federation ID
    const uniqueUmpireId = await generateUniqueUmpireId();
    const finalFedId = federation_id && federation_id.trim() ? federation_id.trim() : uniqueUmpireId;

    const [result] = await pool.query(
      `INSERT INTO umpires (
        umpire_id, name, name_bangla, email, phone, photo_url,
        joined_date, nid_number, dob, gender, status, grade, federation_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uniqueUmpireId,
        name.trim(),
        name_bangla ? name_bangla.trim() : null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        savedPhotoUrl,
        joined_date || null,
        nid_number ? nid_number.trim() : null,
        dob || null,
        gender || 'Male',
        status || 'Active',
        grade || 'National Referee',
        finalFedId
      ]
    );

    const [createdRows] = await pool.query('SELECT * FROM umpires WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Umpire registered successfully',
      data: createdRows[0]
    });
  } catch (error) {
    console.error('Error creating umpire:', error);
    res.status(500).json({ success: false, message: 'Server error creating umpire', error: error.message });
  }
});

// PUT update umpire
router.put('/:id', async (req, res) => {
  try {
    const umpireId = req.params.id;
    const {
      name,
      name_bangla,
      email,
      phone,
      photo_url,
      joined_date,
      nid_number,
      dob,
      gender,
      status,
      grade,
      federation_id
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM umpires WHERE id = ?', [umpireId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Umpire not found' });
    }

    let savedPhotoUrl = existing[0].photo_url;
    if (photo_url && photo_url !== existing[0].photo_url) {
      savedPhotoUrl = await saveBase64Image(photo_url, 'umpires/photos', 'umpire');
    }

    await pool.query(
      `UPDATE umpires SET
        name = COALESCE(?, name),
        name_bangla = CASE WHEN ? IS NOT NULL THEN ? ELSE name_bangla END,
        email = CASE WHEN ? IS NOT NULL THEN ? ELSE email END,
        phone = CASE WHEN ? IS NOT NULL THEN ? ELSE phone END,
        photo_url = COALESCE(?, photo_url),
        joined_date = CASE WHEN ? IS NOT NULL THEN ? ELSE joined_date END,
        nid_number = CASE WHEN ? IS NOT NULL THEN ? ELSE nid_number END,
        dob = CASE WHEN ? IS NOT NULL THEN ? ELSE dob END,
        gender = COALESCE(?, gender),
        status = COALESCE(?, status),
        grade = COALESCE(?, grade),
        federation_id = CASE WHEN ? IS NOT NULL THEN ? ELSE federation_id END
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        name_bangla !== undefined ? (name_bangla ? name_bangla.trim() : null) : null,
        name_bangla !== undefined ? (name_bangla ? name_bangla.trim() : null) : null,
        email !== undefined ? (email ? email.trim() : null) : null,
        email !== undefined ? (email ? email.trim() : null) : null,
        phone !== undefined ? (phone ? phone.trim() : null) : null,
        phone !== undefined ? (phone ? phone.trim() : null) : null,
        savedPhotoUrl,
        joined_date !== undefined ? joined_date : null,
        joined_date !== undefined ? joined_date : null,
        nid_number !== undefined ? (nid_number ? nid_number.trim() : null) : null,
        nid_number !== undefined ? (nid_number ? nid_number.trim() : null) : null,
        dob !== undefined ? dob : null,
        dob !== undefined ? dob : null,
        gender,
        status,
        grade,
        federation_id !== undefined ? (federation_id ? federation_id.trim() : null) : null,
        federation_id !== undefined ? (federation_id ? federation_id.trim() : null) : null,
        umpireId
      ]
    );

    const [updatedRows] = await pool.query('SELECT * FROM umpires WHERE id = ?', [umpireId]);
    res.json({
      success: true,
      message: 'Umpire profile updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Error updating umpire:', error);
    res.status(500).json({ success: false, message: 'Server error updating umpire', error: error.message });
  }
});

// DELETE umpire
router.delete('/:id', async (req, res) => {
  try {
    const umpireId = req.params.id;
    const [existing] = await pool.query('SELECT * FROM umpires WHERE id = ?', [umpireId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Umpire not found' });
    }

    // Unassign matches where this umpire was assigned
    await pool.query('UPDATE matches SET umpire_id = NULL, umpire_name = NULL WHERE umpire_id = ?', [umpireId]);

    await pool.query('DELETE FROM umpires WHERE id = ?', [umpireId]);
    res.json({ success: true, message: 'Umpire removed successfully' });
  } catch (error) {
    console.error('Error deleting umpire:', error);
    res.status(500).json({ success: false, message: 'Server error deleting umpire', error: error.message });
  }
});

export default router;
