import express from 'express';
import pool from '../config/db.js';
import {
  generateTournamentCode,
  generateKnockoutFixtures,
  generateRoundRobinFixtures,
  computeNextRoundProgression
} from '../utils/carromBracket.js';

const router = express.Router();

// Helper to ensure unique tournament code
async function createUniqueTournamentCode() {
  let code = generateTournamentCode();
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 10) {
    const [rows] = await pool.query('SELECT id FROM tournaments WHERE tournament_code = ?', [code]);
    if (rows.length === 0) {
      exists = false;
    } else {
      code = generateTournamentCode();
      attempts++;
    }
  }
  return code;
}

// GET all tournaments
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM tournaments WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (title LIKE ? OR tournament_code LIKE ? OR venue LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY start_date DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET single tournament with matches and participants
router.get('/:id', async (req, res) => {
  try {
    const [tourneys] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [req.params.id]);
    if (tourneys.length === 0) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const [matches] = await pool.query(
      'SELECT * FROM matches WHERE tournament_id = ? ORDER BY round_level ASC, match_order ASC, id ASC',
      [req.params.id]
    );

    const [participants] = await pool.query(
      `SELECT tp.*, p.full_name, p.national_rank, p.rating_points, p.club_name, p.district, p.photo_url, p.player_id as bcf_player_id
       FROM tournament_participants tp
       JOIN players p ON tp.player_id = p.id
       WHERE tp.tournament_id = ?
       ORDER BY tp.seed_number ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...tourneys[0],
        participants,
        matches
      }
    });
  } catch (error) {
    console.error('Error fetching tournament detail:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET bracket view for a tournament
router.get('/:id/bracket', async (req, res) => {
  try {
    const [tourneys] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [req.params.id]);
    if (tourneys.length === 0) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const [matches] = await pool.query(
      `SELECT 
        m.*,
        p1.player_id AS player1_code,
        p1.photo_url AS player1_photo,
        p1.district AS player1_district,
        p1.club_name AS player1_club,
        p1.gender AS player1_gender,
        p1.category AS player1_category,
        p1.rating_points AS player1_rating,
        p1.matches_won AS player1_won,
        (COALESCE(p1.white_slams, 0) + COALESCE(p1.black_slams, 0)) AS player1_slams,
        p1.national_rank AS player1_rank,
        
        p2.player_id AS player2_code,
        p2.photo_url AS player2_photo,
        p2.district AS player2_district,
        p2.club_name AS player2_club,
        p2.gender AS player2_gender,
        p2.category AS player2_category,
        p2.rating_points AS player2_rating,
        p2.matches_won AS player2_won,
        (COALESCE(p2.white_slams, 0) + COALESCE(p2.black_slams, 0)) AS player2_slams,
        p2.national_rank AS player2_rank
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      WHERE m.tournament_id = ?
      ORDER BY m.round_level ASC, m.match_order ASC, m.id ASC`,
      [req.params.id]
    );

    const [participants] = await pool.query(
      `SELECT tp.*, p.full_name, p.national_rank, p.rating_points, p.club_name, p.district, p.photo_url, p.player_id as bcf_player_id
       FROM tournament_participants tp
       JOIN players p ON tp.player_id = p.id
       WHERE tp.tournament_id = ?
       ORDER BY tp.seed_number ASC`,
      [req.params.id]
    );

    // Group matches by round_level / round_name for easy frontend rendering
    const roundsMap = {};
    matches.forEach(m => {
      const level = m.round_level || 1;
      if (!roundsMap[level]) {
        roundsMap[level] = {
          level: level,
          name: m.round_name.split(' - ')[0] || m.round_name,
          matches: []
        };
      }
      roundsMap[level].matches.push(m);
    });

    const rounds = Object.values(roundsMap).sort((a, b) => a.level - b.level);

    res.json({
      success: true,
      data: {
        tournament: tourneys[0],
        participants,
        rounds,
        matches
      }
    });
  } catch (error) {
    console.error('Error fetching tournament bracket:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST new tournament with selected players & official draw logic
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      title,
      edition = '2026',
      venue,
      start_date,
      end_date,
      category = 'National Championship',
      format = 'Knockout',
      seeding_type = 'Seeded',
      board_limit = 8,
      points_limit = 25,
      prize_pool = '৳ 5,00,000',
      registration_deadline = null,
      status = 'Upcoming',
      description = '',
      tournament_code,
      selected_player_ids = []
    } = req.body;

    if (!title || !venue || !start_date || !end_date) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Title, venue, start_date and end_date are required' });
    }

    const code = tournament_code || (await createUniqueTournamentCode());
    const totalParticipants = selected_player_ids.length;

    const [tourneyResult] = await connection.query(
      `INSERT INTO tournaments (
        tournament_code, title, edition, venue, start_date, end_date,
        category, format, seeding_type, board_limit, points_limit, total_participants,
        prize_pool, registration_deadline, status, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code, title, edition, venue, start_date, end_date,
        category, format, seeding_type, board_limit, points_limit, totalParticipants,
        prize_pool, registration_deadline, status, description
      ]
    );

    const tournamentId = tourneyResult.insertId;

    // If players are selected, create participants and generate fixtures
    if (selected_player_ids && selected_player_ids.length >= 2) {
      // Fetch selected player records
      const [playerRows] = await connection.query(
        'SELECT id, full_name, national_rank, rating_points, club_name, district FROM players WHERE id IN (?)',
        [selected_player_ids]
      );

      // Generate fixtures using Carrom Pairing Engine
      let fixtureData;
      if (format === 'RoundRobin') {
        fixtureData = generateRoundRobinFixtures(playerRows, {
          seeding_type,
          startDate: start_date,
          board_limit
        });
      } else {
        fixtureData = generateKnockoutFixtures(playerRows, {
          seeding_type,
          startDate: start_date
        });
      }

      // Insert participants with assigned seeds
      for (const p of fixtureData.participants) {
        await connection.query(
          `INSERT INTO tournament_participants (tournament_id, player_id, seed_number, status)
           VALUES (?, ?, ?, 'Registered')`,
          [tournamentId, p.player_id, p.seed_number]
        );
      }

      // Insert matches
      for (const m of fixtureData.matches) {
        await connection.query(
          `INSERT INTO matches (
            tournament_id, round_name, board_number, match_order, round_level,
            player1_id, player2_id, player1_name, player2_name,
            player1_score, player2_score, boards_played, current_board,
            winner_id, status, scheduled_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tournamentId, m.round_name, m.board_number, m.match_order, m.round_level,
            m.player1_id, m.player2_id, m.player1_name, m.player2_name,
            0, 0, 0, 1,
            m.winner_id, m.status, m.scheduled_at
          ]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Tournament and official fixtures created successfully',
      data: {
        id: tournamentId,
        tournament_code: code,
        title,
        total_participants: totalParticipants
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating tournament:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
});

// POST re-generate fixtures for an existing tournament
router.post('/:id/generate-fixtures', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const tournamentId = req.params.id;
    const { seeding_type = 'Seeded', selected_player_ids = [] } = req.body;

    const [tourneys] = await connection.query('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
    if (tourneys.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    const tournament = tourneys[0];

    let playerIdsToUse = selected_player_ids;

    // If no players passed in body, use existing participants
    if (!playerIdsToUse || playerIdsToUse.length === 0) {
      const [existingParts] = await connection.query(
        'SELECT player_id FROM tournament_participants WHERE tournament_id = ?',
        [tournamentId]
      );
      playerIdsToUse = existingParts.map(p => p.player_id);
    }

    if (playerIdsToUse.length < 2) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'At least 2 players are required to generate fixtures' });
    }

    // Fetch players
    const [players] = await connection.query(
      'SELECT id, full_name, national_rank, rating_points, club_name, district FROM players WHERE id IN (?)',
      [playerIdsToUse]
    );

    // Generate fixtures based on tournament format
    let fixtureData;
    if ((tournament.format || '').toLowerCase() === 'roundrobin') {
      fixtureData = generateRoundRobinFixtures(players, {
        seeding_type: seeding_type || tournament.seeding_type || 'Seeded',
        startDate: tournament.start_date,
        board_limit: tournament.board_limit || 8
      });
    } else {
      fixtureData = generateKnockoutFixtures(players, {
        seeding_type: seeding_type || tournament.seeding_type || 'Seeded',
        startDate: tournament.start_date
      });
    }

    // Clear old matches and participants for this tournament
    await connection.query('DELETE FROM matches WHERE tournament_id = ?', [tournamentId]);
    await connection.query('DELETE FROM tournament_participants WHERE tournament_id = ?', [tournamentId]);

    // Insert new participants
    for (const p of fixtureData.participants) {
      await connection.query(
        `INSERT INTO tournament_participants (tournament_id, player_id, seed_number, status)
         VALUES (?, ?, ?, 'Registered')`,
        [tournamentId, p.player_id, p.seed_number]
      );
    }

    // Insert new matches
    for (const m of fixtureData.matches) {
      await connection.query(
        `INSERT INTO matches (
          tournament_id, round_name, board_number, match_order, round_level,
          player1_id, player2_id, player1_name, player2_name,
          player1_score, player2_score, boards_played, current_board,
          winner_id, status, scheduled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tournamentId, m.round_name, m.board_number, m.match_order, m.round_level,
          m.player1_id, m.player2_id, m.player1_name, m.player2_name,
          0, 0, 0, 1,
          m.winner_id, m.status, m.scheduled_at
        ]
      );
    }

    // Update total_participants and seeding_type
    await connection.query(
      'UPDATE tournaments SET total_participants = ?, seeding_type = ? WHERE id = ?',
      [fixtureData.participants.length, seeding_type, tournamentId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Fixtures generated successfully',
      data: {
        total_participants: fixtureData.participants.length,
        total_matches: fixtureData.matches.length
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error generating fixtures:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
});

// PUT update match score & auto advance winner to next bracket round
router.put('/matches/:matchId/score', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const matchId = parseInt(req.params.matchId, 10);
    const {
      player1_score,
      player2_score,
      current_board,
      boards_played,
      status,
      winner_id
    } = req.body;

    const [currentMatches] = await connection.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (currentMatches.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    const currentMatch = currentMatches[0];
    const tournamentId = currentMatch.tournament_id;

    // Update current match
    await connection.query(
      `UPDATE matches SET
        player1_score = COALESCE(?, player1_score),
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
      const [allTournamentMatches] = await connection.query(
        'SELECT * FROM matches WHERE tournament_id = ? ORDER BY round_level ASC, match_order ASC, id ASC',
        [tournamentId]
      );

      // Determine winner name and loser
      let winnerName = '';
      let loserId = null;
      let loserName = '';

      if (winner_id === currentMatch.player1_id) {
        winnerName = currentMatch.player1_name.replace(/\[#\d+\]\s*/, '');
        loserId = currentMatch.player2_id;
        loserName = currentMatch.player2_name ? currentMatch.player2_name.replace(/\[#\d+\]\s*/, '') : '';
      } else if (winner_id === currentMatch.player2_id) {
        winnerName = currentMatch.player2_name.replace(/\[#\d+\]\s*/, '');
        loserId = currentMatch.player1_id;
        loserName = currentMatch.player1_name ? currentMatch.player1_name.replace(/\[#\d+\]\s*/, '') : '';
      }

      // Compute progression
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

    res.json({
      success: true,
      message: 'Match score updated and bracket progression applied'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating match score:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
});

// PUT update tournament details
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      edition,
      venue,
      start_date,
      end_date,
      category,
      format,
      seeding_type,
      board_limit,
      points_limit,
      prize_pool,
      status,
      description
    } = req.body;

    const [result] = await pool.query(
      `UPDATE tournaments SET 
        title = COALESCE(?, title),
        edition = COALESCE(?, edition),
        venue = COALESCE(?, venue),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        category = COALESCE(?, category),
        format = COALESCE(?, format),
        seeding_type = COALESCE(?, seeding_type),
        board_limit = COALESCE(?, board_limit),
        points_limit = COALESCE(?, points_limit),
        prize_pool = COALESCE(?, prize_pool),
        status = COALESCE(?, status),
        description = COALESCE(?, description)
      WHERE id = ?`,
      [
        title, edition, venue, start_date, end_date,
        category, format, seeding_type, board_limit, points_limit,
        prize_pool, status, description, req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    res.json({ success: true, message: 'Tournament updated successfully' });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE tournament
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tournaments WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    res.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
