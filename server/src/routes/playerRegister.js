import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { parseNidCard } from '../services/nidParser.js';
import { saveBase64Image, deletePlayerFiles } from '../utils/fileStorage.js';
import { generateApplicationPdf } from '../services/pdfService.js';
import { sendRegistrationWaitingEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * Hash password securely with salt using Node crypto
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * 1. POST /api/player-register/parse-nid
 * Parse NID front/back images and extract structured data
 */
router.post('/parse-nid', async (req, res) => {
  try {
    const { frontBase64, backBase64, presetHint } = req.body;
    const result = await parseNidCard({ frontBase64, backBase64, presetHint });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('[PARSE-NID ERROR]:', error);
    res.status(500).json({ success: false, message: 'Failed to process NID card image.' });
  }
});

/**
 * 2. GET /api/player-register/check
 * Verify email or NID availability
 */
router.get('/check', async (req, res) => {
  try {
    const { email, nid_number } = req.query;

    if (email) {
      const [existing] = await pool.query('SELECT id FROM player_registrations WHERE email = ?', [email.trim().toLowerCase()]);
      return res.json({ available: existing.length === 0 });
    }

    if (nid_number) {
      const [existing] = await pool.query('SELECT id FROM player_registrations WHERE nid_number = ?', [nid_number.trim()]);
      return res.json({ available: existing.length === 0 });
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. GET /api/player-register
 * List all registrations for Admin Review
 */
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT pr.*, d.name as district_name 
      FROM player_registrations pr
      LEFT JOIN districts d ON pr.present_district_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      query += ' AND pr.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (pr.name_en LIKE ? OR pr.name_bn LIKE ? OR pr.player_id LIKE ? OR pr.phone LIKE ? OR pr.nid_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY pr.id DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[GET REGISTRATIONS ERROR]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
});

/**
 * 4. GET /api/player-register/download-form/:playerId
 * Download official BCF Application Form PDF
 */
router.get('/download-form/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const [rows] = await pool.query(
      `SELECT pr.*, d.name as district_name 
       FROM player_registrations pr
       LEFT JOIN districts d ON pr.present_district_id = d.id
       WHERE pr.player_id = ?`,
      [playerId]
    );

    if (rows.length === 0) {
      return res.status(404).send('Application form not found for this Player ID.');
    }

    const reg = rows[0];
    const category = reg.player_since <= 2005 ? 'Veteran' : 'Senior';

    const pdfBuffer = await generateApplicationPdf({
      player_id: reg.player_id,
      name_en: reg.name_en,
      name_bn: reg.name_bn,
      nickname: reg.nickname,
      father_name: reg.father_name,
      mother_name: reg.mother_name,
      dob: reg.dob,
      nid_number: reg.nid_number,
      player_since: reg.player_since,
      is_new_player: !!reg.is_new_player,
      phone: reg.phone,
      email: reg.email,
      present_street: reg.present_street,
      district: reg.district_name || 'Dhaka',
      present_zip: reg.present_zip,
      permanent_street: reg.permanent_street,
      permanent_zip: reg.permanent_zip,
      same_as_present: !!reg.same_as_present,
      category,
      gender: reg.gender || 'Men',
      photo_url: reg.photo_url
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="BCF_Application_Form_${playerId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[DOWNLOAD FORM ERROR]:', error);
    res.status(500).send('Error generating application form PDF.');
  }
});

/**
 * 5. POST /api/player-register
 * Submit Player Registration (Saves to Disk < 500KB, Status: Pending, Sends Email & PDF)
 */
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      email,
      phone,
      password,
      player_since,
      is_new_player,
      name_en,
      name_bn,
      nickname,
      gender,
      father_name,
      mother_name,
      dob,
      nid_number,
      photo_url,
      nid_front_url,
      nid_back_url,
      present_street,
      present_division_id,
      present_district_id,
      present_upazila_id,
      present_union_id,
      present_zip,
      permanent_street,
      permanent_division_id,
      permanent_district_id,
      permanent_upazila_id,
      permanent_union_id,
      permanent_zip,
      same_as_present
    } = req.body;

    // Validation
    if (!email || !phone || !password || !name_en || !nid_number || !nid_back_url) {
      return res.status(400).json({
        success: false,
        message: 'Required registration fields are missing (including NID front & back).'
      });
    }

    await conn.beginTransaction();

    // 1. Check duplicate email
    const [existingEmail] = await conn.query(
      'SELECT id FROM player_registrations WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    if (existingEmail.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'This email address is already registered with Bangladesh Carrom Federation.'
      });
    }

    // 2. Check duplicate NID
    const [existingNid] = await conn.query(
      'SELECT id FROM player_registrations WHERE nid_number = ?',
      [nid_number.trim()]
    );
    if (existingNid.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'This National ID (NID) is already registered with another player.'
      });
    }

    // 3. Generate Sequential Player ID: BCF + [YEAR] + [MONTH (2 digits)] + [COUNTER (4 digits)]
    const currentYear = new Date().getFullYear();
    const effectiveYear = is_new_player ? currentYear : (parseInt(player_since, 10) || currentYear);
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const idPrefix = `BCF${effectiveYear}${currentMonth}`;

    const [rows] = await conn.query(
      'SELECT player_id FROM player_registrations WHERE player_id LIKE ? ORDER BY player_id DESC LIMIT 1 FOR UPDATE',
      [`${idPrefix}%`]
    );

    let nextSequence = 1;
    if (rows.length > 0) {
      const lastPlayerId = rows[0].player_id;
      const sequencePart = lastPlayerId.slice(idPrefix.length);
      const parsedNum = parseInt(sequencePart, 10);
      if (!isNaN(parsedNum)) {
        nextSequence = parsedNum + 1;
      }
    }

    const sequenceFormatted = String(nextSequence).padStart(4, '0');
    const generatedPlayerId = `${idPrefix}${sequenceFormatted}`;
    const passwordHash = hashPassword(password);

    // 4. Save and compress image files to disk (< 500 KB per file)
    const savedPhotoUrl = await saveBase64Image(photo_url, 'players/photos', `photo_${generatedPlayerId}`);
    const savedFrontUrl = await saveBase64Image(nid_front_url, 'players/nids', `front_${generatedPlayerId}`);
    const savedBackUrl = await saveBase64Image(nid_back_url, 'players/nids', `back_${generatedPlayerId}`);

    const genderVal = (gender === 'Women' || gender === 'Men' || gender === 'Other') ? gender : 'Men';

    // 5. Insert into player_registrations with status = 'Pending' (NOT instantly in active players roster)
    const [insertResult] = await conn.query(
      `INSERT INTO player_registrations (
        player_id, email, phone, password_hash, player_since, is_new_player,
        name_en, name_bn, nickname, gender, father_name, mother_name, dob, nid_number,
        photo_url, nid_front_url, nid_back_url,
        present_street, present_division_id, present_district_id, present_upazila_id, present_union_id, present_zip,
        permanent_street, permanent_division_id, permanent_district_id, permanent_upazila_id, permanent_union_id, permanent_zip,
        same_as_present, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, 'Pending'
      )`,
      [
        generatedPlayerId,
        email.trim().toLowerCase(),
        phone.trim(),
        passwordHash,
        effectiveYear,
        is_new_player ? 1 : 0,
        name_en.trim(),
        name_bn ? name_bn.trim() : name_en.trim(),
        nickname ? nickname.trim() : null,
        genderVal,
        father_name || null,
        mother_name || null,
        dob || null,
        nid_number.trim(),
        savedPhotoUrl,
        savedFrontUrl,
        savedBackUrl,
        present_street || null,
        present_division_id || null,
        present_district_id || null,
        present_upazila_id || null,
        present_union_id || null,
        present_zip || null,
        same_as_present ? present_street : (permanent_street || null),
        same_as_present ? present_division_id : (permanent_division_id || null),
        same_as_present ? present_district_id : (permanent_district_id || null),
        same_as_present ? present_upazila_id : (permanent_upazila_id || null),
        same_as_present ? present_union_id : (permanent_union_id || null),
        same_as_present ? present_zip : (permanent_zip || null),
        same_as_present ? 1 : 0
      ]
    );

    // Look up district name for PDF and profile
    let districtName = 'Dhaka';
    if (present_district_id) {
      const [distRow] = await conn.query('SELECT name FROM districts WHERE id = ?', [present_district_id]);
      if (distRow.length > 0) districtName = distRow[0].name;
    }

    const category = effectiveYear <= 2005 ? 'Veteran' : 'Senior';

    await conn.commit();

    // 6. Generate PDF Application Form & Dispatch Nodemailer Email
    try {
      const pdfBuffer = await generateApplicationPdf({
        player_id: generatedPlayerId,
        name_en: name_en.trim(),
        name_bn: name_bn ? name_bn.trim() : name_en.trim(),
        nickname: nickname ? nickname.trim() : null,
        gender: genderVal,
        father_name,
        mother_name,
        dob,
        nid_number,
        player_since: effectiveYear,
        is_new_player,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        present_street,
        district: districtName,
        present_zip,
        permanent_street,
        permanent_zip,
        same_as_present,
        category,
        photo_url: savedPhotoUrl
      });

      // Send email asynchronously with PDF attached
      sendRegistrationWaitingEmail({
        to: email.trim().toLowerCase(),
        playerData: {
          player_id: generatedPlayerId,
          name_en: name_en.trim(),
          name_bn: name_bn ? name_bn.trim() : name_en.trim(),
          nickname: nickname ? nickname.trim() : null,
          father_name,
          mother_name,
          dob,
          nid_number,
          phone: phone.trim()
        },
        pdfBuffer
      }).catch(mailErr => console.error('[EMAIL BACKGROUND ERROR]:', mailErr.message));
    } catch (pdfErr) {
      console.error('[PDF ERROR DURING REGISTRATION]:', pdfErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Player registration submitted successfully and is waiting for federation approval.',
      data: {
        registration_id: insertResult.insertId,
        player_id: generatedPlayerId,
        name_en: name_en.trim(),
        name_bn: name_bn ? name_bn.trim() : name_en.trim(),
        nickname: nickname ? nickname.trim() : null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        player_since: effectiveYear,
        category,
        district: districtName,
        photo_url: savedPhotoUrl,
        status: 'Pending',
        download_url: `/api/player-register/download-form/${generatedPlayerId}`,
        registered_at: new Date().toISOString()
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error('[PLAYER REGISTER ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Registration transaction failed: ' + error.message
    });
  } finally {
    conn.release();
  }
});

/**
 * 6. PUT /api/player-register/:id/status
 * Admin Action: Approve or Reject player application
 */
router.put('/:id/status', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status, playerDetails } = req.body; // 'Approved' | 'Rejected' | 'Pending'

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    await conn.beginTransaction();

    const [regs] = await conn.query('SELECT * FROM player_registrations WHERE id = ?', [id]);
    if (regs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Registration application not found.' });
    }

    const reg = regs[0];

    // Update status in player_registrations
    await conn.query('UPDATE player_registrations SET status = ? WHERE id = ?', [status, id]);

    if (status === 'Approved') {
      // Find district and division name defaults if not provided in playerDetails
      let districtName = playerDetails?.district;
      let divisionName = playerDetails?.division;

      if (!districtName && reg.present_district_id) {
        const [d] = await conn.query('SELECT name FROM districts WHERE id = ?', [reg.present_district_id]);
        if (d.length > 0) districtName = d[0].name;
      }
      if (!divisionName && reg.present_division_id) {
        const [divRow] = await conn.query('SELECT name FROM divisions WHERE id = ?', [reg.present_division_id]);
        if (divRow.length > 0) divisionName = divRow[0].name;
      }

      districtName = districtName || 'Dhaka';
      divisionName = divisionName || 'Dhaka';

      const category = playerDetails?.category || (reg.player_since <= 2005 ? 'Veteran' : 'Senior');
      const clubName = playerDetails?.club_name || 'Independent';
      const dominantHand = playerDetails?.dominant_hand || 'Right Hand';
      const playingStyle = playerDetails?.playing_style || 'All-Rounder';
      const carromBoard = playerDetails?.carrom_board_preference || 'Championship 29x29 Standard';
      const ratingPoints = playerDetails?.rating_points ? parseInt(playerDetails.rating_points, 10) : 1200;
      const whiteSlams = playerDetails?.white_slams ? parseInt(playerDetails.white_slams, 10) : 0;
      const blackSlams = playerDetails?.black_slams ? parseInt(playerDetails.black_slams, 10) : 0;
      const nationalRank = playerDetails?.national_rank ? parseInt(playerDetails.national_rank, 10) : null;
      const photoUrl = playerDetails?.photo_url || reg.photo_url || null;

      // Check if already in players table
      const [existingPlayer] = await conn.query(
        'SELECT id FROM players WHERE player_id = ? OR registration_id = ? OR email = ?',
        [reg.player_id, id, reg.email]
      );

      if (existingPlayer.length > 0) {
        await conn.query(
          `UPDATE players SET 
             status = 'Active', 
             full_name = ?, 
             nickname = ?, 
             gender = ?,
             category = ?,
             club_name = ?,
             division = ?,
             district = ?,
             dominant_hand = ?,
             playing_style = ?,
             carrom_board_preference = ?,
             national_rank = COALESCE(?, national_rank),
             rating_points = ?,
             white_slams = ?,
             black_slams = ?,
             photo_url = ?, 
             player_id = ?, 
             registration_id = ?,
             phone = ?,
             email = ?
           WHERE id = ?`,
          [
            reg.name_en,
            reg.nickname,
            reg.gender || 'Men',
            category,
            clubName,
            divisionName,
            districtName,
            dominantHand,
            playingStyle,
            carromBoard,
            nationalRank,
            ratingPoints,
            whiteSlams,
            blackSlams,
            photoUrl,
            reg.player_id,
            id,
            reg.phone,
            reg.email,
            existingPlayer[0].id
          ]
        );
      } else {
        await conn.query(
          `INSERT INTO players (
            player_id, full_name, nickname, gender, category, club_name, division, district,
            dominant_hand, playing_style, carrom_board_preference,
            national_rank, rating_points, matches_played, matches_won, white_slams, black_slams,
            photo_url, registration_id, status, phone, email
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, 'Active', ?, ?)`,
          [
            reg.player_id,
            reg.name_en,
            reg.nickname,
            reg.gender || 'Men',
            category,
            clubName,
            divisionName,
            districtName,
            dominantHand,
            playingStyle,
            carromBoard,
            nationalRank,
            ratingPoints,
            whiteSlams,
            blackSlams,
            photoUrl,
            id,
            reg.phone,
            reg.email
          ]
        );
      }
    } else if (status === 'Rejected') {
      // Deactivate in players table if present (Disabled as requested: "approved player tokhon reject krte gele player disabled hoye thakbe")
      await conn.query("UPDATE players SET status = 'Inactive' WHERE player_id = ? OR registration_id = ?", [reg.player_id, id]);
    }

    await conn.commit();
    res.json({ success: true, message: `Application ${status.toLowerCase()} successfully.` });
  } catch (error) {
    await conn.rollback();
    console.error('[STATUS UPDATE ERROR]:', error);
    res.status(500).json({ success: false, message: 'Failed to update application status.' });
  } finally {
    conn.release();
  }
});

/**
 * 6.1 PUT /api/player-register/:id
 * Admin Action: Edit and update player registration information
 */
router.put('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      name_en,
      name_bn,
      nickname,
      gender,
      email,
      phone,
      dob,
      nid_number,
      father_name,
      mother_name,
      player_since,
      present_street,
      present_division_id,
      present_district_id,
      status,
      photo_url,
      nid_front_url,
      nid_back_url
    } = req.body;

    await conn.beginTransaction();

    const [regs] = await conn.query('SELECT * FROM player_registrations WHERE id = ?', [id]);
    if (regs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const currentReg = regs[0];

    // Process new images if base64 provided
    let finalPhoto = currentReg.photo_url;
    if (photo_url && photo_url.startsWith('data:')) {
      finalPhoto = await saveBase64Image(photo_url, 'players/photos', `photo_${currentReg.player_id}`);
    }

    let finalFront = currentReg.nid_front_url;
    if (nid_front_url && nid_front_url.startsWith('data:')) {
      finalFront = await saveBase64Image(nid_front_url, 'players/nids', `front_${currentReg.player_id}`);
    }

    let finalBack = currentReg.nid_back_url;
    if (nid_back_url && nid_back_url.startsWith('data:')) {
      finalBack = await saveBase64Image(nid_back_url, 'players/nids', `back_${currentReg.player_id}`);
    }

    const newStatus = status || currentReg.status || 'Pending';
    const newGender = (gender === 'Women' || gender === 'Men') ? gender : (currentReg.gender || 'Men');

    await conn.query(
      `UPDATE player_registrations SET
        name_en = ?,
        name_bn = ?,
        nickname = ?,
        gender = ?,
        email = ?,
        phone = ?,
        dob = ?,
        nid_number = ?,
        father_name = ?,
        mother_name = ?,
        player_since = ?,
        present_street = ?,
        present_division_id = ?,
        present_district_id = ?,
        photo_url = ?,
        nid_front_url = ?,
        nid_back_url = ?,
        status = ?
       WHERE id = ?`,
      [
        name_en !== undefined ? name_en.trim() : currentReg.name_en,
        name_bn !== undefined ? name_bn.trim() : currentReg.name_bn,
        nickname !== undefined ? (nickname ? nickname.trim() : null) : currentReg.nickname,
        newGender,
        email !== undefined ? email.trim().toLowerCase() : currentReg.email,
        phone !== undefined ? phone.trim() : currentReg.phone,
        dob !== undefined ? dob : currentReg.dob,
        nid_number !== undefined ? nid_number.trim() : currentReg.nid_number,
        father_name !== undefined ? (father_name ? father_name.trim() : null) : currentReg.father_name,
        mother_name !== undefined ? (mother_name ? mother_name.trim() : null) : currentReg.mother_name,
        player_since !== undefined ? parseInt(player_since, 10) : currentReg.player_since,
        present_street !== undefined ? present_street : currentReg.present_street,
        present_division_id !== undefined ? (present_division_id ? parseInt(present_division_id, 10) : null) : currentReg.present_division_id,
        present_district_id !== undefined ? (present_district_id ? parseInt(present_district_id, 10) : null) : currentReg.present_district_id,
        finalPhoto,
        finalFront,
        finalBack,
        newStatus,
        id
      ]
    );

    // If application is Approved (or already had player record), update player record as well
    const effectiveYear = player_since ? parseInt(player_since, 10) : currentReg.player_since;
    const category = effectiveYear <= 2005 ? 'Veteran' : 'Senior';
    let districtName = 'Dhaka';
    const targetDistrictId = present_district_id || currentReg.present_district_id;
    if (targetDistrictId) {
      const [dist] = await conn.query('SELECT name FROM districts WHERE id = ?', [targetDistrictId]);
      if (dist.length > 0) districtName = dist[0].name;
    }

    const [existingPlayer] = await conn.query(
      'SELECT id FROM players WHERE player_id = ? OR registration_id = ? OR email = ?',
      [currentReg.player_id, id, currentReg.email]
    );

    if (newStatus === 'Approved') {
      if (existingPlayer.length > 0) {
        await conn.query(
          `UPDATE players SET 
             status = 'Active', 
             full_name = ?, 
             nickname = ?, 
             gender = ?,
             category = ?,
             district = ?,
             photo_url = ?, 
             phone = ?,
             email = ?
           WHERE id = ?`,
          [
            name_en !== undefined ? name_en.trim() : currentReg.name_en,
            nickname !== undefined ? nickname : currentReg.nickname,
            newGender,
            category,
            districtName,
            finalPhoto,
            phone !== undefined ? phone.trim() : currentReg.phone,
            email !== undefined ? email.trim().toLowerCase() : currentReg.email,
            existingPlayer[0].id
          ]
        );
      } else {
        await conn.query(
          `INSERT INTO players (
            player_id, full_name, nickname, gender, category, club_name, district,
            national_rank, rating_points, matches_played, matches_won, white_slams, black_slams,
            photo_url, registration_id, status, phone, email
          ) VALUES (?, ?, ?, ?, ?, 'Independent', ?, NULL, 1200, 0, 0, 0, 0, ?, ?, 'Active', ?, ?)`,
          [
            currentReg.player_id,
            name_en !== undefined ? name_en.trim() : currentReg.name_en,
            nickname !== undefined ? nickname : currentReg.nickname,
            newGender,
            category,
            districtName,
            finalPhoto,
            id,
            phone !== undefined ? phone.trim() : currentReg.phone,
            email !== undefined ? email.trim().toLowerCase() : currentReg.email
          ]
        );
      }
    } else if (newStatus === 'Rejected' && existingPlayer.length > 0) {
      await conn.query("UPDATE players SET status = 'Suspended' WHERE id = ?", [existingPlayer[0].id]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Player registration updated successfully.' });
  } catch (error) {
    await conn.rollback();
    console.error('[UPDATE REGISTRATION ERROR]:', error);
    res.status(500).json({ success: false, message: 'Failed to update player registration: ' + error.message });
  } finally {
    conn.release();
  }
});

/**
 * 7. DELETE /api/player-register/:id
 * Delete registration along with disk image files and linked player record
 */
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    const [regs] = await conn.query('SELECT * FROM player_registrations WHERE id = ?', [id]);
    if (regs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const reg = regs[0];

    // Delete associated image files from disk
    deletePlayerFiles([reg.photo_url, reg.nid_front_url, reg.nid_back_url]);

    // Also delete associated entry from players roster
    await conn.query('DELETE FROM players WHERE registration_id = ? OR player_id = ?', [id, reg.player_id]);

    // Delete from player_registrations
    await conn.query('DELETE FROM player_registrations WHERE id = ?', [id]);

    await conn.commit();
    res.json({ success: true, message: 'Registration and all associated image files deleted successfully.' });
  } catch (error) {
    await conn.rollback();
    console.error('[DELETE REGISTRATION ERROR]:', error);
    res.status(500).json({ success: false, message: 'Failed to delete registration.' });
  } finally {
    conn.release();
  }
});

export default router;
