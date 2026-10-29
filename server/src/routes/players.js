import express from 'express';
import pool from '../config/db.js';
import { saveBase64Image, deletePlayerFiles } from '../utils/fileStorage.js';

const router = express.Router();

// GET all players with optional filtering (gender, category, search)
router.get('/', async (req, res) => {
  try {
    const { gender, category, search, status } = req.query;
    let query = 'SELECT * FROM players WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (gender && gender !== 'All') {
      query += ' AND gender = ?';
      params.push(gender);
    }
    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (full_name LIKE ? OR club_name LIKE ? OR district LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY national_rank ASC, rating_points DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ success: false, message: 'Server error fetching players', error: error.message });
  }
});

// GET single player by ID or player_id (e.g. BCF2026100002)
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    const isNumeric = /^\d+$/.test(param);

    // Query player by numeric id OR player_id
    const [rows] = await pool.query(
      `SELECT p.*,
              pr.name_bn,
              pr.dob,
              pr.player_since,
              pr.father_name,
              pr.mother_name,
              pr.present_street,
              pr.present_zip,
              pr.nid_number
       FROM players p
       LEFT JOIN player_registrations pr ON (p.registration_id = pr.id OR p.player_id = pr.player_id)
       WHERE ${isNumeric ? 'p.id = ? OR p.player_id = ?' : 'p.player_id = ? OR p.id = ?'}
       LIMIT 1`,
      [param, param]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    const player = rows[0];

    // If client/public view requested and player is not Active, return 404
    if (req.query.public === 'true' && player.status !== 'Active') {
      return res.status(404).json({ success: false, message: 'Athlete profile is inactive or not found' });
    }

    // Fetch matches involving this player
    let matches = [];
    try {
      const [matchRows] = await pool.query(
        `SELECT m.*, t.title as tournament_title, t.edition as tournament_edition
         FROM matches m
         LEFT JOIN tournaments t ON m.tournament_id = t.id
         WHERE m.player1_name LIKE ? OR m.player2_name LIKE ?
         ORDER BY m.scheduled_at DESC
         LIMIT 10`,
        [`%${player.full_name}%`, `%${player.full_name}%`]
      );
      matches = matchRows;
    } catch (mErr) {
      console.warn('Error fetching player matches:', mErr.message);
    }

    // Fetch club info if assigned to a club
    let club = null;
    if (player.club_name && player.club_name !== 'Independent' && player.club_name !== 'Individual') {
      try {
        const [clubRows] = await pool.query(
          'SELECT id, name, logo_url, district, division, status FROM clubs WHERE name = ? LIMIT 1',
          [player.club_name]
        );
        if (clubRows.length > 0) club = clubRows[0];
      } catch (cErr) {
        console.warn('Error fetching player club:', cErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        ...player,
        matches,
        club
      }
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST create player
router.post('/', async (req, res) => {
  try {
    const {
      full_name,
      nickname = '',
      gender = 'Men',
      category = 'Senior',
      club_name = '',
      division = '',
      district = 'Dhaka',
      dominant_hand = 'Right Hand',
      playing_style = 'All-Rounder',
      carrom_board_preference = 'Championship 29x29 Standard',
      national_rank = null,
      rating_points = 1200,
      matches_played = 0,
      matches_won = 0,
      white_slams = 0,
      black_slams = 0,
      photo_url = '',
      status = 'Active',
      phone = '',
      email = ''
    } = req.body;

    if (!full_name) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    let savedPhotoUrl = photo_url;
    if (photo_url && photo_url.startsWith('data:')) {
      savedPhotoUrl = await saveBase64Image(photo_url, 'players/photos', 'player');
    }

    // Determine current max rank if not specified
    let effectiveRank = national_rank;
    if (!effectiveRank) {
      const [rankResult] = await pool.query('SELECT MAX(national_rank) as maxRank FROM players WHERE gender = ?', [gender]);
      effectiveRank = (rankResult[0].maxRank || 0) + 1;
    }

    const [result] = await pool.query(
      `INSERT INTO players (
        full_name, nickname, gender, category, club_name, division, district,
        dominant_hand, playing_style, carrom_board_preference,
        national_rank, rating_points, matches_played, matches_won,
        white_slams, black_slams, photo_url, status, phone, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name, nickname, gender, category, club_name, division, district,
        dominant_hand, playing_style, carrom_board_preference,
        effectiveRank, rating_points, matches_played, matches_won,
        white_slams, black_slams, savedPhotoUrl, status, phone, email
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Player registered successfully',
      data: { id: result.insertId, full_name, national_rank: effectiveRank, photo_url: savedPhotoUrl }
    });
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ success: false, message: 'Server error adding player', error: error.message });
  }
});

// PUT update player
router.put('/:id', async (req, res) => {
  try {
    const {
      full_name,
      nickname,
      gender,
      category,
      club_name,
      division,
      district,
      dominant_hand,
      playing_style,
      carrom_board_preference,
      national_rank,
      rating_points,
      matches_played,
      matches_won,
      white_slams,
      black_slams,
      photo_url,
      status,
      phone,
      email
    } = req.body;

    let savedPhotoUrl = photo_url;
    if (photo_url && photo_url.startsWith('data:')) {
      savedPhotoUrl = await saveBase64Image(photo_url, 'players/photos', `player_${req.params.id}`);
    }

    const [result] = await pool.query(
      `UPDATE players SET 
        full_name = COALESCE(?, full_name),
        nickname = COALESCE(?, nickname),
        gender = COALESCE(?, gender),
        category = COALESCE(?, category),
        club_name = COALESCE(?, club_name),
        division = COALESCE(?, division),
        district = COALESCE(?, district),
        dominant_hand = COALESCE(?, dominant_hand),
        playing_style = COALESCE(?, playing_style),
        carrom_board_preference = COALESCE(?, carrom_board_preference),
        national_rank = COALESCE(?, national_rank),
        rating_points = COALESCE(?, rating_points),
        matches_played = COALESCE(?, matches_played),
        matches_won = COALESCE(?, matches_won),
        white_slams = COALESCE(?, white_slams),
        black_slams = COALESCE(?, black_slams),
        photo_url = COALESCE(?, photo_url),
        status = COALESCE(?, status),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email)
      WHERE id = ?`,
      [
        full_name, nickname, gender, category, club_name, division, district,
        dominant_hand, playing_style, carrom_board_preference,
        national_rank, rating_points, matches_played, matches_won,
        white_slams, black_slams, savedPhotoUrl, status, phone, email,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Player not found' });
    }

    res.json({ success: true, message: 'Player updated successfully', photo_url: savedPhotoUrl });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE player (Cascades to player_registrations and deletes all disk image files)
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    // 1. Fetch player
    const [players] = await conn.query('SELECT * FROM players WHERE id = ?', [id]);
    if (players.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
    const player = players[0];

    // 2. Fetch linked registration if available
    let regImages = [];
    let regId = player.registration_id;
    if (!regId && player.player_id) {
      const [r] = await conn.query('SELECT id, photo_url, nid_front_url, nid_back_url FROM player_registrations WHERE player_id = ?', [player.player_id]);
      if (r.length > 0) {
        regId = r[0].id;
        regImages = [r[0].photo_url, r[0].nid_front_url, r[0].nid_back_url];
      }
    } else if (regId) {
      const [r] = await conn.query('SELECT photo_url, nid_front_url, nid_back_url FROM player_registrations WHERE id = ?', [regId]);
      if (r.length > 0) {
        regImages = [r[0].photo_url, r[0].nid_front_url, r[0].nid_back_url];
      }
    } else if (player.email) {
      const [r] = await conn.query('SELECT id, photo_url, nid_front_url, nid_back_url FROM player_registrations WHERE email = ?', [player.email]);
      if (r.length > 0) {
        regId = r[0].id;
        regImages = [r[0].photo_url, r[0].nid_front_url, r[0].nid_back_url];
      }
    }

    // 3. Delete physical image files from disk
    const allImagesToDelete = [player.photo_url, ...regImages].filter(Boolean);
    deletePlayerFiles(allImagesToDelete);

    // 4. Delete linked registration if found
    if (regId) {
      await conn.query('DELETE FROM player_registrations WHERE id = ?', [regId]);
    } else if (player.player_id) {
      await conn.query('DELETE FROM player_registrations WHERE player_id = ?', [player.player_id]);
    }

    // 5. Delete player from players table
    await conn.query('DELETE FROM players WHERE id = ?', [id]);

    await conn.commit();
    res.json({
      success: true,
      message: 'Player and all associated registration records & image files deleted successfully.'
    });
  } catch (error) {
    await conn.rollback();
    console.error('Error deleting player:', error);
    res.status(500).json({ success: false, message: 'Server error deleting player', error: error.message });
  } finally {
    conn.release();
  }
});

export default router;
