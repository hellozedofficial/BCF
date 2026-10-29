import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET matches (live, scheduled, completed)
router.get('/', async (req, res) => {
  try {
    const { status, tournament_id } = req.query;
    let query = `
      SELECT m.*, t.title AS tournament_title 
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }
    if (tournament_id) {
      query += ' AND m.tournament_id = ?';
      params.push(tournament_id);
    }

    query += ' ORDER BY CASE WHEN m.status = "Live" THEN 1 WHEN m.status = "Scheduled" THEN 2 ELSE 3 END, m.scheduled_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT update match score (live score tracking)
router.put('/:id/score', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const matchId = parseInt(req.params.id, 10);
    const { player1_score, player2_score, current_board, boards_played, status, winner_id } = req.body;

    const [currentMatches] = await connection.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (currentMatches.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    const currentMatch = currentMatches[0];
    const tournamentId = currentMatch.tournament_id;

    await connection.query(
      `UPDATE matches 
       SET player1_score = COALESCE(?, player1_score),
           player2_score = COALESCE(?, player2_score),
           current_board = COALESCE(?, current_board),
           boards_played = COALESCE(?, boards_played),
           status = COALESCE(?, status),
           winner_id = COALESCE(?, winner_id)
       WHERE id = ?`,
      [player1_score, player2_score, current_board, boards_played, status, winner_id, matchId]
    );

    // If winner is declared and status is Completed, handle bracket progression
    if (winner_id && status === 'Completed' && tournamentId) {
      const { computeNextRoundProgression } = await import('../utils/carromBracket.js');
      const [allTournamentMatches] = await connection.query(
        'SELECT * FROM matches WHERE tournament_id = ? ORDER BY round_level ASC, match_order ASC, id ASC',
        [tournamentId]
      );

      let winnerName = '';
      let loserId = null;
      let loserName = '';

      if (winner_id === currentMatch.player1_id) {
        winnerName = currentMatch.player1_name ? currentMatch.player1_name.replace(/\[#\d+\]\s*/, '') : '';
        loserId = currentMatch.player2_id;
        loserName = currentMatch.player2_name ? currentMatch.player2_name.replace(/\[#\d+\]\s*/, '') : '';
      } else if (winner_id === currentMatch.player2_id) {
        winnerName = currentMatch.player2_name ? currentMatch.player2_name.replace(/\[#\d+\]\s*/, '') : '';
        loserId = currentMatch.player1_id;
        loserName = currentMatch.player1_name ? currentMatch.player1_name.replace(/\[#\d+\]\s*/, '') : '';
      }

      const updates = computeNextRoundProgression(
        allTournamentMatches,
        matchId,
        winner_id,
        winnerName,
        loserId,
        loserName
      );

      if (updates && updates.length > 0) {
        for (const u of updates) {
          if (u.field === 'player1') {
            await connection.query(
              'UPDATE matches SET player1_id = ?, player1_name = ? WHERE id = ?',
              [u.playerId, u.playerName, u.matchId]
            );
          } else if (u.field === 'player2') {
            await connection.query(
              'UPDATE matches SET player2_id = ?, player2_name = ? WHERE id = ?',
              [u.playerId, u.playerName, u.matchId]
            );
          }
        }
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Match score updated' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating match score:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
});

// POST create new match
router.post('/', async (req, res) => {
  try {
    const {
      tournament_id,
      player1_id,
      player2_id,
      player1_name,
      player2_name,
      round_name = 'Round 1',
      board_number = 1,
      status = 'Scheduled',
      stream_url = '',
      scheduled_at = new Date()
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO matches (tournament_id, player1_id, player2_id, player1_name, player2_name, round_name, board_number, status, stream_url, scheduled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tournament_id || null, player1_id || null, player2_id || null, player1_name, player2_name, round_name, board_number, status, stream_url, scheduled_at]
    );

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE match
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM matches WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    res.json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
