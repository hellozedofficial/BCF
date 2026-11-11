import express from 'express';
import pool from '../config/db.js';
import { saveBase64Image } from '../utils/fileStorage.js';
import { requireAdminAuth } from './auth.js';

const router = express.Router();

const DEFAULT_GROUP_ORDERS = {
  'president': 1,
  'vice presidents': 2,
  'vice president': 2,
  'general secretary': 3,
  'joint secretaries': 4,
  'joint secretary': 4,
  'treasurer': 5,
  'executive members': 6,
  'executive member': 6,
  'advisors & patrons': 7,
  'advisors': 7
};

function resolveGroupFields(designation = '', groupNameInput, groupOrderInput) {
  let finalGroup = (groupNameInput || '').trim();
  if (!finalGroup) {
    const d = (designation || '').toLowerCase();
    if (d.includes('vice') && d.includes('president')) finalGroup = 'Vice Presidents';
    else if (d.includes('president')) finalGroup = 'President';
    else if (d.includes('general') && d.includes('secretary')) finalGroup = 'General Secretary';
    else if ((d.includes('joint') || d.includes('assistant')) && d.includes('secretary')) finalGroup = 'Joint Secretaries';
    else if (d.includes('treasurer')) finalGroup = 'Treasurer';
    else if (d.includes('advisor') || d.includes('patron')) finalGroup = 'Advisors & Patrons';
    else finalGroup = 'Executive Members';
  }

  let finalGroupOrder = parseInt(groupOrderInput, 10);
  if (isNaN(finalGroupOrder) || finalGroupOrder <= 0) {
    finalGroupOrder = DEFAULT_GROUP_ORDERS[finalGroup.toLowerCase()] || 6;
  }

  return { group_name: finalGroup, group_order: finalGroupOrder };
}

/**
 * GET /api/committee
 * Fetch all committee members ordered by group_order and display_order
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM committee ORDER BY COALESCE(group_order, 99) ASC, COALESCE(display_order, 0) ASC, id ASC'
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[API /committee GET error]:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/committee/reorder
 * Bulk update group_name, group_order, and display_order for drag-and-drop sorting
 */
router.put('/reorder', requireAdminAuth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required for reordering' });
    }

    for (const item of items) {
      const memberId = parseInt(item.id, 10);
      if (!memberId) continue;

      const updates = [];
      const params = [];

      if (item.group_name !== undefined && String(item.group_name).trim()) {
        updates.push('group_name = ?');
        params.push(String(item.group_name).trim());
      }
      if (item.group_order !== undefined && !isNaN(parseInt(item.group_order, 10))) {
        updates.push('group_order = ?');
        params.push(parseInt(item.group_order, 10));
      }
      if (item.display_order !== undefined && !isNaN(parseInt(item.display_order, 10))) {
        updates.push('display_order = ?');
        params.push(parseInt(item.display_order, 10));
      }

      if (updates.length > 0) {
        params.push(memberId);
        await pool.query(`UPDATE committee SET ${updates.join(', ')} WHERE id = ?`, params);
      }
    }

    const [rows] = await pool.query(
      'SELECT * FROM committee ORDER BY COALESCE(group_order, 99) ASC, COALESCE(display_order, 0) ASC, id ASC'
    );

    res.json({
      success: true,
      message: 'Committee order updated successfully',
      data: rows
    });
  } catch (error) {
    console.error('[API /committee/reorder PUT error]:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder committee members', error: error.message });
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
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const {
      name,
      designation,
      position,
      group_name,
      group_order,
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

    const resolvedGroup = resolveGroupFields(finalDesignation, group_name, group_order);

    // Check if this group already exists in DB to inherit its group_order if not explicitly provided
    let finalGroupOrder = resolvedGroup.group_order;
    if (group_order === undefined || group_order === null || group_order === '') {
      const [existingGroup] = await pool.query(
        'SELECT group_order FROM committee WHERE group_name = ? LIMIT 1',
        [resolvedGroup.group_name]
      );
      if (existingGroup.length > 0 && existingGroup[0].group_order) {
        finalGroupOrder = existingGroup[0].group_order;
      }
    }

    let savedImageUrl = (image_url || photo || '').trim() || null;
    if (savedImageUrl && savedImageUrl.startsWith('data:image/')) {
      savedImageUrl = await saveBase64Image(savedImageUrl, 'committee', 'comm');
    }

    const [result] = await pool.query(
      `INSERT INTO committee (name, designation, group_name, group_order, organization, contact_email, phone, image_url, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalName,
        finalDesignation,
        resolvedGroup.group_name,
        finalGroupOrder,
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
router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      designation,
      position,
      group_name,
      group_order,
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
    const updatedDesignation =
      designation !== undefined
        ? designation.trim()
        : position !== undefined
        ? position.trim()
        : existing[0].designation;
    const updatedGroupName =
      group_name !== undefined && String(group_name).trim()
        ? String(group_name).trim()
        : existing[0].group_name || resolveGroupFields(updatedDesignation).group_name;
    const updatedGroupOrder =
      group_order !== undefined && !isNaN(parseInt(group_order, 10))
        ? parseInt(group_order, 10)
        : existing[0].group_order || resolveGroupFields(updatedDesignation, updatedGroupName).group_order;
    const updatedOrg = organization !== undefined ? organization.trim() : existing[0].organization;
    const updatedEmail =
      contact_email !== undefined
        ? contact_email.trim()
        : email !== undefined
        ? email.trim()
        : existing[0].contact_email;
    const updatedPhone = phone !== undefined ? phone.trim() : existing[0].phone;
    const updatedOrder =
      display_order !== undefined ? parseInt(display_order, 10) || 0 : existing[0].display_order;

    await pool.query(
      `UPDATE committee
       SET name = ?, designation = ?, group_name = ?, group_order = ?, organization = ?, contact_email = ?, phone = ?, image_url = ?, display_order = ?
       WHERE id = ?`,
      [
        updatedName,
        updatedDesignation,
        updatedGroupName,
        updatedGroupOrder,
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
router.delete('/:id', requireAdminAuth, async (req, res) => {
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
