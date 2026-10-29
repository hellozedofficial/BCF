import express from 'express';
import pool from '../config/db.js';
import { saveBase64Image } from '../utils/fileStorage.js';

const router = express.Router();

/**
 * GET /api/committee
 * Fetch all committee members ordered by display_order
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM committee ORDER BY display_order ASC, id ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[API /committee GET error]:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/committee/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM committee WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee member not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[API /committee/:id GET error]:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/committee
 * Create new committee member
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      designation,
      position,
      organization = 'Bangladesh Carrom Federation',
      contact_email,
      email,
      phone,
      image_url,
      photo,
      display_order = 0
    } = req.body;

    const finalName = (name || '').trim();
    const finalDesignation = (designation || position || '').trim();
    const finalEmail = (contact_email || email || '').trim();

    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Member name is required' });
    }
    if (!finalDesignation) {
      return res.status(400).json({ success: false, message: 'Position / Designation is required' });
    }

    let savedImageUrl = (image_url || photo || '').trim() || null;
    if (savedImageUrl && savedImageUrl.startsWith('data:image/')) {
      savedImageUrl = await saveBase64Image(savedImageUrl, 'committee', 'comm');
    }

    const [result] = await pool.query(
      `INSERT INTO committee (name, designation, organization, contact_email, phone, image_url, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        finalName,
        finalDesignation,
        (organization || 'Bangladesh Carrom Federation').trim(),
        finalEmail || null,
        (phone || '').trim() || null,
        savedImageUrl,
        parseInt(display_order, 10) || 0
      ]
    );

    const [created] = await pool.query('SELECT * FROM committee WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Committee member added successfully',
      data: created[0]
    });
  } catch (error) {
    console.error('[API /committee POST error]:', error);
    res.status(500).json({ success: false, message: 'Failed to create committee member', error: error.message });
  }
});

/**
 * PUT /api/committee/:id
 * Update committee member
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      designation,
      position,
      organization,
      contact_email,
      email,
      phone,
      image_url,
      photo,
      display_order
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM committee WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee member not found' });
    }

    let savedImageUrl = image_url !== undefined ? image_url : (photo !== undefined ? photo : existing[0].image_url);
    if (savedImageUrl && savedImageUrl.startsWith('data:image/')) {
      savedImageUrl = await saveBase64Image(savedImageUrl, 'committee', 'comm');
    }

    const updatedName = name !== undefined ? name.trim() : existing[0].name;
    const updatedDesignation = designation !== undefined ? designation.trim() : (position !== undefined ? position.trim() : existing[0].designation);
    const updatedOrg = organization !== undefined ? organization.trim() : existing[0].organization;
    const updatedEmail = contact_email !== undefined ? contact_email.trim() : (email !== undefined ? email.trim() : existing[0].contact_email);
    const updatedPhone = phone !== undefined ? phone.trim() : existing[0].phone;
    const updatedOrder = display_order !== undefined ? parseInt(display_order, 10) || 0 : existing[0].display_order;

    await pool.query(
      `UPDATE committee
       SET name = ?, designation = ?, organization = ?, contact_email = ?, phone = ?, image_url = ?, display_order = ?
       WHERE id = ?`,
      [
        updatedName,
        updatedDesignation,
        updatedOrg,
        updatedEmail || null,
        updatedPhone || null,
        savedImageUrl,
        updatedOrder,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM committee WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Committee member updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('[API /committee/:id PUT error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update committee member', error: error.message });
  }
});

/**
 * DELETE /api/committee/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM committee WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Committee member not found' });
    }

    await pool.query('DELETE FROM committee WHERE id = ?', [id]);
    res.json({ success: true, message: 'Committee member deleted successfully', id: parseInt(id, 10) });
  } catch (error) {
    console.error('[API /committee/:id DELETE error]:', error);
    res.status(500).json({ success: false, message: 'Failed to delete committee member', error: error.message });
  }
});

export default router;
