import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [[playerCount]] = await pool.query('SELECT COUNT(*) as total_players FROM players');
    const [[clubCount]] = await pool.query('SELECT COUNT(*) as total_clubs FROM clubs');
    const [[tournamentCount]] = await pool.query('SELECT COUNT(*) as total_tournaments FROM tournaments');
    const [[liveMatchCount]] = await pool.query('SELECT COUNT(*) as live_matches FROM matches WHERE status = "Live"');
    const [[slamCount]] = await pool.query('SELECT SUM(white_slams) as white_slams, SUM(black_slams) as black_slams FROM players');

    res.json({
      success: true,
      data: {
        total_players: playerCount.total_players || 0,
        total_clubs: clubCount.total_clubs || 0,
        total_tournaments: tournamentCount.total_tournaments || 0,
        live_matches: liveMatchCount.live_matches || 0,
        white_slams: slamCount.white_slams || 0,
        black_slams: slamCount.black_slams || 0
      }
    });
  } catch (error) {
    console.error('Error fetching federation stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
