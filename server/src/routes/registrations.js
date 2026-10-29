import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, t.title as tournament_title 
      FROM registrations r
      LEFT JOIN tournaments t ON r.tournament_id = t.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { full_name, email, phone, district, club_name = '', category = 'Senior Men', tournament_id = null, notes = '' } = req.body;
    if (!full_name || !email || !phone || !district) {
      return res.status(400).json({ success: false, message: 'Full name, email, phone, and district are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO registrations (full_name, email, phone, district, club_name, category, tournament_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone, district, club_name, category, tournament_id || null, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully to Bangladesh Carrom Federation.',
      data: { id: result.insertId, full_name, status: 'Pending' }
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ success: false, message: 'Server error submitting registration', error: error.message });
  }
});

// PUT update registration status (Approve / Reject)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const [result] = await pool.query('UPDATE registrations SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    res.json({ success: true, message: `Registration status updated to ${status}` });
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE registration
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM registrations WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    res.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
