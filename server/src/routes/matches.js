import express from 'express';
import pool from '../config/db.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';
import { requireAdminAuth, attachOptionalAdminAuth, forbidUmpireOnly } from './auth.js';

const router = express.Router();
router.use(attachOptionalAdminAuth);

function isAdminRequest(req) {
  return Boolean(req.admin);
}

function assertUmpireOwnsMatch(req, match) {
  if (!req.admin?.umpire_access_only) return true;
  const linkedUmpireId = Number(req.admin.linked_umpire_id || 0);
  if (!linkedUmpireId) return false;
  return Number(match?.umpire_id || 0) === linkedUmpireId;
}

// GET matches (live, scheduled, completed)
router.get('/', async (req, res) => {
  try {
    const { status, tournament_id } = req.query;
    const isAdmin = isAdminRequest(req);
    let query = `
      SELECT m.*, t.title AS tournament_title, t.is_published AS tournament_is_published,
             t.board_limit AS tournament_board_limit, t.points_limit AS tournament_points_limit,
             p1.photo_url AS player1_photo, p2.photo_url AS player2_photo
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdmin) {
      query += ' AND (m.tournament_id IS NULL OR COALESCE(t.is_published, 1) = 1)';
    } else if (req.admin?.umpire_access_only) {
      query += ' AND m.umpire_id = ?';
      params.push(Number(req.admin.linked_umpire_id || -1));
    }
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

// Bulk assign umpire to multiple matches
router.put('/bulk-assign-umpire', requireAdminAuth, forbidUmpireOnly, async (req, res) => {
  try {
    const { match_ids, umpire_id, umpire_name } = req.body;
    if (!Array.isArray(match_ids) || match_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'match_ids must be a non-empty array' });
    }

    let resolvedUmpireName = umpire_name;
    if (umpire_id && !resolvedUmpireName) {
      const [uRows] = await pool.query('SELECT name FROM umpires WHERE id = ?', [umpire_id]);
      if (uRows.length > 0) {
        resolvedUmpireName = uRows[0].name;
      }
    }

    await pool.query(
      `UPDATE matches 
       SET umpire_id = ?, umpire_name = ? 
       WHERE id IN (?)`,
      [umpire_id || null, resolvedUmpireName || null, match_ids]
    );

    await cacheDel('matches:list:*');

    res.json({
      success: true,
      message: `Umpire successfully assigned to ${match_ids.length} matches`,
      umpire_id: umpire_id || null,
      umpire_name: resolvedUmpireName || null
    });
  } catch (error) {
    console.error('Error bulk assigning umpire:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT update match score (live score tracking, auto winner calculation, progression & schedule)
router.put('/:id/score', requireAdminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const matchId = parseInt(req.params.id, 10);
    const {
      player1_score,
      player2_score,
      current_board,
      boards_played,
      extra_boards,
      status,
      winner_id,
      stream_url,
      scheduled_at,
      board_number,
      toss_winner_id,
      toss_choice,
      toss_decision,
      umpire_id,
      umpire_name
    } = req.body;

    const [currentMatches] = await connection.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (currentMatches.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    const currentMatch = currentMatches[0];
    if (!assertUmpireOwnsMatch(req, currentMatch)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Access denied: match is not assigned to your umpire profile' });
    }
    const tournamentId = currentMatch.tournament_id;

    const streamUrlVal = stream_url !== undefined ? stream_url : null;
    const scheduledAtVal = scheduled_at !== undefined ? (scheduled_at ? new Date(scheduled_at) : null) : undefined;

    const finalStatus = status !== undefined ? status : currentMatch.status;
    const finalP1Score = player1_score !== undefined ? Number(player1_score) : Number(currentMatch.player1_score || 0);
    const finalP2Score = player2_score !== undefined ? Number(player2_score) : Number(currentMatch.player2_score || 0);

    // Auto-determine winner if match is completed and winner_id not explicitly set
    let finalWinnerId = winner_id !== undefined ? (winner_id ? Number(winner_id) : null) : currentMatch.winner_id;
    if (finalStatus === 'Completed' && winner_id === undefined && !currentMatch.winner_id) {
      if (finalP1Score > finalP2Score && currentMatch.player1_id) {
        finalWinnerId = currentMatch.player1_id;
      } else if (finalP2Score > finalP1Score && currentMatch.player2_id) {
        finalWinnerId = currentMatch.player2_id;
      } else {
        finalWinnerId = null; // Draw
      }
    }

    const tossWinnerVal = toss_winner_id !== undefined ? (toss_winner_id ? Number(toss_winner_id) : null) : null;
    const tossChoiceVal = toss_choice !== undefined ? toss_choice : null;
    const tossDecisionVal = toss_decision !== undefined ? toss_decision : null;
    const umpireIdVal = !req.admin?.umpire_access_only && umpire_id !== undefined ? (umpire_id ? Number(umpire_id) : null) : null;
    const umpireNameVal = !req.admin?.umpire_access_only && umpire_name !== undefined ? umpire_name : null;

    await connection.query(
      `UPDATE matches 
       SET player1_score = COALESCE(?, player1_score),
           player2_score = COALESCE(?, player2_score),
           current_board = COALESCE(?, current_board),
           boards_played = COALESCE(?, boards_played),
           extra_boards = COALESCE(?, extra_boards),
           status = COALESCE(?, status),
           winner_id = ?,
           stream_url = CASE WHEN ? IS NOT NULL THEN ? ELSE stream_url END,
           scheduled_at = CASE WHEN ? IS NOT NULL THEN ? ELSE scheduled_at END,
           board_number = COALESCE(?, board_number),
           toss_winner_id = CASE WHEN ? IS NOT NULL THEN ? ELSE toss_winner_id END,
           toss_choice = CASE WHEN ? IS NOT NULL THEN ? ELSE toss_choice END,
           toss_decision = CASE WHEN ? IS NOT NULL THEN ? ELSE toss_decision END,
           umpire_id = CASE WHEN ? IS NOT NULL THEN ? ELSE umpire_id END,
           umpire_name = CASE WHEN ? IS NOT NULL THEN ? ELSE umpire_name END
       WHERE id = ?`,
      [
        player1_score,
        player2_score,
        current_board,
        boards_played,
        extra_boards,
        status,
        finalWinnerId,
        streamUrlVal,
        streamUrlVal,
        scheduledAtVal !== undefined ? scheduledAtVal : null,
        scheduledAtVal !== undefined ? scheduledAtVal : null,
        board_number,
        tossWinnerVal,
        tossWinnerVal,
        tossChoiceVal,
        tossChoiceVal,
        tossDecisionVal,
        tossDecisionVal,
        umpireIdVal,
        umpireIdVal,
        umpireNameVal,
        umpireNameVal,
        matchId
      ]
    );

    // If winner is declared and status is Completed, handle bracket progression
    if (finalWinnerId && finalStatus === 'Completed' && tournamentId) {
      const { computeNextRoundProgression } = await import('../utils/carromBracket.js');
      const [allTournamentMatches] = await connection.query(
        'SELECT * FROM matches WHERE tournament_id = ? ORDER BY round_level ASC, match_order ASC, id ASC',
        [tournamentId]
      );

      let winnerName = '';
      let loserId = null;
      let loserName = '';

      if (Number(finalWinnerId) === Number(currentMatch.player1_id)) {
        winnerName = currentMatch.player1_name ? currentMatch.player1_name.replace(/\[#\d+\]\s*/, '') : '';
        loserId = currentMatch.player2_id;
        loserName = currentMatch.player2_name ? currentMatch.player2_name.replace(/\[#\d+\]\s*/, '') : '';
      } else if (Number(finalWinnerId) === Number(currentMatch.player2_id)) {
        winnerName = currentMatch.player2_name ? currentMatch.player2_name.replace(/\[#\d+\]\s*/, '') : '';
        loserId = currentMatch.player1_id;
        loserName = currentMatch.player1_name ? currentMatch.player1_name.replace(/\[#\d+\]\s*/, '') : '';
      }

      const updates = computeNextRoundProgression(
        allTournamentMatches,
        matchId,
        finalWinnerId,
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
    await cacheDel(`match:${matchId}:*`);
    await cacheDel('matches:list:*');

    res.json({ success: true, message: 'Match score updated', winner_id: finalWinnerId });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating match score:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
});

// GET score events for a match (real-time timeline with Redis caching)
router.get('/:id/events', async (req, res) => {
  try {
    const matchId = parseInt(req.params.id, 10);
    const cacheKey = `match:${matchId}:events`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let [events] = await pool.query(
      `SELECT e.*, p.photo_url, p.player_id AS bcf_player_id
       FROM match_score_events e
       LEFT JOIN players p ON e.player_id = p.id
       WHERE e.match_id = ?
       ORDER BY e.created_at ASC, e.id ASC`,
      [matchId]
    );

    const [matchRows] = await pool.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (matchRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    const match = matchRows[0];
    const currentBoard = match.current_board || 1;

    // Graceful backfill: If match already has scores but events are empty, create baseline strikes
    if (events.length === 0 && (match.player1_score > 0 || match.player2_score > 0)) {
      try {
        const p1Score = Number(match.player1_score) || 0;
        const p2Score = Number(match.player2_score) || 0;
        const p1Name = (match.player1_name || 'Player 1').replace(/\[#\d+\]\s*/, '');
        const p2Name = (match.player2_name || 'Player 2').replace(/\[#\d+\]\s*/, '');

        if (p1Score > 0) {
          const isQueen = p1Score >= 3;
          await pool.query(
            `INSERT INTO match_score_events (match_id, board_number, player_slot, player_id, player_name, points, is_queen, action_type)
             VALUES (?, ?, 1, ?, ?, ?, ?, ?)`,
            [matchId, currentBoard, match.player1_id, p1Name, p1Score, isQueen ? 1 : 0, isQueen ? 'queen' : 'score']
          );
        }
        if (p2Score > 0) {
          await pool.query(
            `INSERT INTO match_score_events (match_id, board_number, player_slot, player_id, player_name, points, is_queen, action_type)
             VALUES (?, ?, 2, ?, ?, ?, 0, 'score')`,
            [matchId, currentBoard, match.player2_id, p2Name, p2Score]
          );
        }

        const [reloadedEvents] = await pool.query(
          `SELECT e.*, p.photo_url, p.player_id AS bcf_player_id
           FROM match_score_events e
           LEFT JOIN players p ON e.player_id = p.id
           WHERE e.match_id = ?
           ORDER BY e.created_at ASC, e.id ASC`,
          [matchId]
        );
        events = reloadedEvents;
      } catch (backfillErr) {
        console.warn('Could not auto-backfill events:', backfillErr.message);
      }
    }

    const queenClaimedInBoard = events.some(
      (e) => Number(e.board_number) === Number(currentBoard) && (e.is_queen === 1 || e.is_queen === true)
    );

    const payload = {
      success: true,
      data: events,
      queen_claimed_current_board: queenClaimedInBoard,
      current_board: currentBoard
    };

    // Cache in Redis for fast sub-millisecond retrieval (10s TTL)
    await cacheSet(cacheKey, payload, 10);

    res.json(payload);
  } catch (error) {
    console.error('Error fetching match score events:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST score event (turn-by-turn with single Queen constraint)
router.post('/:id/events', requireAdminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const matchId = parseInt(req.params.id, 10);
    const { player_slot, points = 1, is_queen = false } = req.body;

    const [matches] = await connection.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (matches.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    const match = matches[0];
    if (!assertUmpireOwnsMatch(req, match)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Access denied: match is not assigned to your umpire profile' });
    }
    const currentBoard = Number(match.current_board) || 1;
    const slot = Number(player_slot);
    const parsedPts = parseInt(points, 10);
    const pts = Number.isNaN(parsedPts) || parsedPts === 0 ? 1 : parsedPts;
    const isQueen = Boolean(is_queen) && pts > 0;

    // ICF Rule: Only ONE Queen per board
    if (isQueen) {
      const [existingQueen] = await connection.query(
        'SELECT id, player_name FROM match_score_events WHERE match_id = ? AND board_number = ? AND is_queen = 1',
        [matchId, currentBoard]
      );
      if (existingQueen.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Queen (+3) already claimed by ${existingQueen[0].player_name} in Board #${currentBoard}. Under ICF rules, only one Queen is awarded per board.`
        });
      }
    }

    const playerId = slot === 1 ? match.player1_id : match.player2_id;
    const rawPlayerName = slot === 1 ? match.player1_name : match.player2_name;
    const playerName = (rawPlayerName || `Player ${slot}`).replace(/\[#\d+\]\s*/, '');

    // Insert score event
    const actionType = isQueen ? 'queen' : (pts < 0 ? 'fine' : 'point');
    const [result] = await connection.query(
      `INSERT INTO match_score_events (match_id, board_number, player_slot, player_id, player_name, points, is_queen, action_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [matchId, currentBoard, slot, playerId, playerName, pts, isQueen ? 1 : 0, actionType]
    );

    // Update player's match score (never drop below 0)
    const scoreCol = slot === 1 ? 'player1_score' : 'player2_score';
    const newScore = Math.max(0, (Number(match[scoreCol]) || 0) + pts);

    await connection.query(
      `UPDATE matches SET ${scoreCol} = ? WHERE id = ?`,
      [newScore, matchId]
    );

    await connection.commit();
    await cacheDel(`match:${matchId}:*`);

    // Fetch updated events
    const [updatedEvents] = await pool.query(
      `SELECT e.*, p.photo_url, p.player_id AS bcf_player_id
       FROM match_score_events e
       LEFT JOIN players p ON e.player_id = p.id
       WHERE e.match_id = ?
       ORDER BY e.created_at ASC, e.id ASC`,
      [matchId]
    );

    res.json({
      success: true,
      message: isQueen
        ? 'Queen (+3) recorded'
        : (pts < 0 ? `${pts} fine point recorded` : `+${pts} point recorded`),
      data: {
        eventId: result.insertId,
        events: updatedEvents,
        player1_score: slot === 1 ? newScore : match.player1_score,
        player2_score: slot === 2 ? newScore : match.player2_score
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording score event:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
});

// POST undo last score event
router.post('/:id/events/undo', requireAdminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const matchId = parseInt(req.params.id, 10);
    const [matches] = await connection.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (matches.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    const match = matches[0];
    if (!assertUmpireOwnsMatch(req, match)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Access denied: match is not assigned to your umpire profile' });
    }

    // Find the latest score event
    const [latestEvents] = await connection.query(
      'SELECT * FROM match_score_events WHERE match_id = ? ORDER BY id DESC LIMIT 1',
      [matchId]
    );

    if (latestEvents.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'No score events recorded yet to undo' });
    }

    const lastEvent = latestEvents[0];
    const slot = Number(lastEvent.player_slot);
    const pts = Number(lastEvent.points) || 0;
    const scoreCol = slot === 1 ? 'player1_score' : 'player2_score';
    const currentScore = Number(match[scoreCol]) || 0;
    const newScore = Math.max(0, currentScore - pts);

    // Delete the event
    await connection.query('DELETE FROM match_score_events WHERE id = ?', [lastEvent.id]);

    // Update match score
    await connection.query(
      `UPDATE matches SET ${scoreCol} = ? WHERE id = ?`,
      [newScore, matchId]
    );

    await connection.commit();
    await cacheDel(`match:${matchId}:*`);

    // Fetch remaining events
    const [remainingEvents] = await pool.query(
      `SELECT e.*, p.photo_url, p.player_id AS bcf_player_id
       FROM match_score_events e
       LEFT JOIN players p ON e.player_id = p.id
       WHERE e.match_id = ?
       ORDER BY e.created_at ASC, e.id ASC`,
      [matchId]
    );

    res.json({
      success: true,
      message: `Undone last score: -${pts} pts for ${lastEvent.player_name}`,
      data: {
        undoneEvent: lastEvent,
        events: remainingEvents,
        player1_score: slot === 1 ? newScore : match.player1_score,
        player2_score: slot === 2 ? newScore : match.player2_score
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error undoing score event:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
});

// POST create new match
router.post('/', requireAdminAuth, forbidUmpireOnly, async (req, res) => {
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
router.delete('/:id', requireAdminAuth, forbidUmpireOnly, async (req, res) => {
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
