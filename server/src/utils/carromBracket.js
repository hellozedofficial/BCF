/**
 * Carrom Tournament Bracket & Pairing Engine
 * Complies with International Carrom Federation (ICF) & Bangladesh Carrom Federation (BCF)
 * Standard Tournament Draw Rules.
 */

/**
 * Generate a unique tournament code like T-942234
 */
export function generateTournamentCode() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `T-${digits}`;
}

/**
 * Standard Seed pairing patterns for powers of 2 (Knockout Draw)
 * Ensures Seed 1 and Seed 2 are in opposite halves and can only meet in the Final.
 */
const SEED_PAIRINGS = {
  4: [
    [1, 4], // SF 1
    [2, 3]  // SF 2
  ],
  8: [
    [1, 8], // QF 1 -> SF 1
    [4, 5], // QF 2 -> SF 1
    [3, 6], // QF 3 -> SF 2
    [2, 7]  // QF 4 -> SF 2
  ],
  16: [
    [1, 16], // R16 M1 -> QF 1
    [8, 9],  // R16 M2 -> QF 1
    [4, 13], // R16 M3 -> QF 2
    [5, 12], // R16 M4 -> QF 2
    [3, 14], // R16 M5 -> QF 3
    [6, 11], // R16 M6 -> QF 3
    [7, 10], // R16 M7 -> QF 4
    [2, 15]  // R16 M8 -> QF 4
  ],
  32: [
    [1, 32], [16, 17], [8, 25], [9, 24],
    [4, 29], [13, 20], [5, 28], [12, 21],
    [3, 30], [14, 19], [6, 27], [11, 22],
    [7, 26], [10, 23], [2, 31], [15, 18]
  ]
};

/**
 * Determine round names based on total rounds and current round index (0-based)
 */
function getRoundName(currentRound, totalRounds, matchIndex, totalMatchesInRound) {
  const roundsRemaining = totalRounds - currentRound;
  if (roundsRemaining === 1) return 'Final';
  if (roundsRemaining === 2) return `Semi Final ${matchIndex + 1}`;
  if (roundsRemaining === 3) return `Quarter Final ${matchIndex + 1}`;
  if (roundsRemaining === 4) return `Round of 16 - Match ${matchIndex + 1}`;
  if (roundsRemaining === 5) return `Round of 32 - Match ${matchIndex + 1}`;
  return `Round ${currentRound + 1} - Match ${matchIndex + 1}`;
}

/**
 * Build Single Elimination Tournament Fixtures & Pairings
 *
 * @param {Array} players - Array of { id, full_name, national_rank, rating_points }
 * @param {Object} options - { seeding_type: 'Seeded' | 'Random', board_limit: 8, points_limit: 25, startDate: string }
 * @returns {Object} { participants, matches }
 */
export function generateKnockoutFixtures(players = [], options = {}) {
  const {
    seeding_type = 'Seeded',
    startDate = new Date().toISOString()
  } = options;

  if (!players || players.length < 2) {
    throw new Error('At least 2 players are required to generate tournament fixtures');
  }

  // 1. Sort or Shuffle players according to seeding type
  let preparedPlayers = [...players];
  if (seeding_type === 'Seeded') {
    // Sort by rank ascending (1 is best). If rank is 0 or null, fallback to rating_points descending
    preparedPlayers.sort((a, b) => {
      const rankA = a.national_rank && a.national_rank > 0 ? a.national_rank : 9999;
      const rankB = b.national_rank && b.national_rank > 0 ? b.national_rank : 9999;
      if (rankA !== rankB) return rankA - rankB;
      return (b.rating_points || 0) - (a.rating_points || 0);
    });
  } else {
    // Fisher-Yates random draw lottery
    for (let i = preparedPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [preparedPlayers[i], preparedPlayers[j]] = [preparedPlayers[j], preparedPlayers[i]];
    }
  }

  // 2. Assign seeds to participants
  const participants = preparedPlayers.map((p, idx) => ({
    player_id: p.id,
    player_name: p.full_name,
    seed_number: idx + 1,
    national_rank: p.national_rank,
    rating_points: p.rating_points
  }));

  // 3. Determine Bracket Size (next power of 2: 4, 8, 16, 32)
  const count = participants.length;
  let bracketSize = 4;
  if (count > 16) bracketSize = 32;
  else if (count > 8) bracketSize = 16;
  else if (count > 4) bracketSize = 8;
  else bracketSize = 4;

  const totalRounds = Math.log2(bracketSize);
  const pairings = SEED_PAIRINGS[bracketSize] || SEED_PAIRINGS[8];

  // Map of seed number -> participant object
  const seedMap = new Map();
  participants.forEach(p => seedMap.set(p.seed_number, p));

  const allMatches = [];
  let matchOrder = 1;

  // Store match references round by round to link next_match_id
  const roundMatches = [];

  // Generate round by round: from Round 1 up to Final
  for (let r = 0; r < totalRounds; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r + 1);
    const currentRoundList = [];

    for (let m = 0; m < matchesInRound; m++) {
      const roundName = getRoundName(r, totalRounds, m, matchesInRound);
      const boardNumber = (m % 8) + 1; // Boards 1 to 8

      let p1 = null;
      let p2 = null;
      let p1Name = 'TBD';
      let p2Name = 'TBD';
      let status = 'Scheduled';

      let winnerId = null;

      if (r === 0) {
        // Initial Round: Assign seeded players
        const [seed1, seed2] = pairings[m] || [m * 2 + 1, m * 2 + 2];
        p1 = seedMap.get(seed1) || null;
        p2 = seedMap.get(seed2) || null;

        p1Name = p1 ? (p1.seed_number <= 8 ? `[#${p1.seed_number}] ${p1.player_name}` : p1.player_name) : 'BYE';
        p2Name = p2 ? (p2.seed_number <= 8 ? `[#${p2.seed_number}] ${p2.player_name}` : p2.player_name) : 'BYE';

        // If one is BYE, auto advance player
        if (p1 && !p2) {
          status = 'Completed';
          winnerId = p1.player_id;
        } else if (!p1 && p2) {
          status = 'Completed';
          winnerId = p2.player_id;
        }
      } else {
        // Subsequent rounds: Check if previous matches were auto-completed by BYE
        const prevMatch1 = roundMatches[r - 1]?.[m * 2];
        const prevMatch2 = roundMatches[r - 1]?.[m * 2 + 1];

        if (prevMatch1 && prevMatch1.winner_id && prevMatch1.status === 'Completed') {
          const advPlayerId = prevMatch1.winner_id;
          const advParticipant = participants.find(part => part.player_id === advPlayerId);
          p1 = advParticipant || { player_id: advPlayerId, player_name: prevMatch1.player1_id === advPlayerId ? prevMatch1.player1_name : prevMatch1.player2_name };
          p1Name = p1.player_name ? p1.player_name.replace(/\[#\d+\]\s*/, '') : 'TBD';
        } else {
          const prevRoundName = getRoundName(r - 1, totalRounds, m * 2, matchesInRound * 2);
          p1Name = `Winner of ${prevRoundName}`;
        }

        if (prevMatch2 && prevMatch2.winner_id && prevMatch2.status === 'Completed') {
          const advPlayerId = prevMatch2.winner_id;
          const advParticipant = participants.find(part => part.player_id === advPlayerId);
          p2 = advParticipant || { player_id: advPlayerId, player_name: prevMatch2.player1_id === advPlayerId ? prevMatch2.player1_name : prevMatch2.player2_name };
          p2Name = p2.player_name ? p2.player_name.replace(/\[#\d+\]\s*/, '') : 'TBD';
        } else {
          const prevRoundName2 = getRoundName(r - 1, totalRounds, m * 2 + 1, matchesInRound * 2);
          p2Name = `Winner of ${prevRoundName2}`;
        }
      }

      const matchObj = {
        temp_id: `R${r + 1}_M${m + 1}`,
        round_level: r + 1,
        round_name: roundName,
        match_order: matchOrder++,
        board_number: boardNumber,
        player1_id: p1 ? p1.player_id : null,
        player2_id: p2 ? p2.player_id : null,
        player1_name: p1Name,
        player2_name: p2Name,
        player1_score: 0,
        player2_score: 0,
        boards_played: 0,
        current_board: 1,
        winner_id: winnerId,
        status: status,
        scheduled_at: startDate
      };

      currentRoundList.push(matchObj);
      allMatches.push(matchObj);
    }
    roundMatches.push(currentRoundList);
  }

  // 4. Also add 3rd Place Playoff Match (Standard BCF Championship Rule)
  if (bracketSize >= 4) {
    allMatches.push({
      temp_id: '3RD_PLACE',
      round_level: totalRounds,
      round_name: '3rd Place Playoff',
      match_order: matchOrder++,
      board_number: 2,
      player1_id: null,
      player2_id: null,
      player1_name: 'Runner-up Semi Final 1',
      player2_name: 'Runner-up Semi Final 2',
      player1_score: 0,
      player2_score: 0,
      boards_played: 0,
      current_board: 1,
      winner_id: null,
      status: 'Scheduled',
      scheduled_at: startDate
    });
  }

  return {
    bracket_size: bracketSize,
    total_rounds: totalRounds,
    participants,
    matches: allMatches
  };
}

/**
 * Advance Match Winner to Next Bracket Round
 *
 * @param {Array} tournamentMatches - All matches of tournament ordered by match_order
 * @param {number} updatedMatchId - The match that was just completed
 * @param {number} winnerPlayerId - The winner's player ID
 * @param {string} winnerPlayerName - The winner's full name
 * @param {number} loserPlayerId - The loser's player ID (for 3rd place playoff)
 * @param {string} loserPlayerName - The loser's name
 */
export function computeNextRoundProgression(tournamentMatches, updatedMatchId, winnerPlayerId, winnerPlayerName, loserPlayerId, loserPlayerName) {
  const currentMatch = tournamentMatches.find(m => m.id === updatedMatchId);
  if (!currentMatch) return null;

  const currentRound = currentMatch.round_level;
  const currentOrderInRound = tournamentMatches
    .filter(m => m.round_level === currentRound && m.round_name !== '3rd Place Playoff')
    .sort((a, b) => a.match_order - b.match_order)
    .findIndex(m => m.id === updatedMatchId);

  if (currentOrderInRound === -1) return null;

  // The next match index in the subsequent round
  const nextMatchOrderInRound = Math.floor(currentOrderInRound / 2);
  const isPlayer1Slot = currentOrderInRound % 2 === 0;

  const nextRoundMatches = tournamentMatches
    .filter(m => m.round_level === currentRound + 1 && m.round_name !== '3rd Place Playoff')
    .sort((a, b) => a.match_order - b.match_order);

  const targetMatch = nextRoundMatches[nextMatchOrderInRound];
  const updates = [];

  if (targetMatch) {
    updates.push({
      matchId: targetMatch.id,
      field: isPlayer1Slot ? 'player1' : 'player2',
      playerId: winnerPlayerId,
      playerName: winnerPlayerName
    });
  }

  // If Semi Final, also update 3rd Place match
  const semiFinalMatches = tournamentMatches.filter(m => m.round_name && m.round_name.startsWith('Semi Final'));
  const isSemiFinal = semiFinalMatches.some(m => m.id === updatedMatchId);

  if (isSemiFinal && loserPlayerId) {
    const thirdPlaceMatch = tournamentMatches.find(m => m.round_name === '3rd Place Playoff');
    if (thirdPlaceMatch) {
      const sfIndex = semiFinalMatches.findIndex(m => m.id === updatedMatchId);
      updates.push({
        matchId: thirdPlaceMatch.id,
        field: sfIndex === 0 ? 'player1' : 'player2',
        playerId: loserPlayerId,
        playerName: loserPlayerName
      });
    }
  }

  return updates;
}

/**
 * Official Single Round-Robin Pairing Engine
 * Complies with International Carrom Federation (ICF) and the classic
 * Asian Carrom Championship Berger / Matrix Pairing System (Tabel 1 & Tabel 2).
 *
 * For N teams (N even), generates N-1 rounds with N/2 matches per round.
 * If N is odd, a BYE is introduced so each participant gets exactly one rest round.
 */
export function generateRoundRobinFixtures(players = [], options = {}) {
  const {
    seeding_type = 'Seeded',
    startDate = new Date().toISOString(),
    board_limit = 8
  } = options;

  if (!players || players.length < 2) {
    throw new Error('At least 2 players are required to generate tournament fixtures');
  }

  // 1. Sort or Shuffle players according to seeding type
  let preparedPlayers = [...players];
  if (seeding_type === 'Seeded') {
    preparedPlayers.sort((a, b) => {
      const rankA = a.national_rank && a.national_rank > 0 ? a.national_rank : 9999;
      const rankB = b.national_rank && b.national_rank > 0 ? b.national_rank : 9999;
      if (rankA !== rankB) return rankA - rankB;
      return (b.rating_points || 0) - (a.rating_points || 0);
    });
  } else {
    for (let i = preparedPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [preparedPlayers[i], preparedPlayers[j]] = [preparedPlayers[j], preparedPlayers[i]];
    }
  }

  // 2. Assign seeds to participants (Seed 1 = Team 1, Seed 2 = Team 2, ...)
  const participants = preparedPlayers.map((p, idx) => ({
    player_id: p.id,
    player_name: p.full_name,
    seed_number: idx + 1,
    national_rank: p.national_rank,
    rating_points: p.rating_points,
    club_name: p.club_name,
    district: p.district
  }));

  const n = participants.length;
  const isOdd = n % 2 !== 0;
  const effectiveCount = isOdd ? n + 1 : n;

  // 3. Generate Round-Robin Pairings
  // For 8 teams, use the exact sequence from the official BCF/ICF textbook screenshot:
  let roundPairings = [];
  if (effectiveCount === 8) {
    roundPairings = [
      [[1, 7], [2, 6], [3, 5], [4, 8]], // Round 1
      [[1, 8], [2, 7], [3, 6], [4, 5]], // Round 2
      [[1, 2], [3, 7], [4, 6], [5, 8]], // Round 3
      [[1, 3], [2, 8], [4, 7], [5, 6]], // Round 4
      [[1, 4], [2, 3], [5, 7], [6, 8]], // Round 5
      [[1, 5], [2, 4], [3, 8], [6, 7]], // Round 6
      [[1, 6], [2, 5], [3, 4], [7, 8]]  // Round 7
    ];
  } else {
    // Generalized polygon / circle rotation for any N
    let circle = Array.from({ length: effectiveCount }, (_, i) => i + 1);
    const totalRounds = effectiveCount - 1;
    for (let r = 0; r < totalRounds; r++) {
      const roundPairs = [];
      for (let i = 0; i < effectiveCount / 2; i++) {
        roundPairs.push([circle[i], circle[effectiveCount - 1 - i]]);
      }
      roundPairings.push(roundPairs);
      const fixed = circle[0];
      const rest = circle.slice(1);
      const last = rest.pop();
      rest.unshift(last);
      circle = [fixed, ...rest];
    }
  }

  const seedMap = new Map();
  participants.forEach(p => seedMap.set(p.seed_number, p));

  const allMatches = [];
  let matchOrder = 1;

  roundPairings.forEach((pairs, rIdx) => {
    const roundNumber = rIdx + 1;
    pairs.forEach(([s1, s2], mIdx) => {
      const p1 = seedMap.get(s1) || null;
      const p2 = seedMap.get(s2) || null;

      const p1Name = p1 ? (p1.seed_number <= 8 ? `[#${s1}] ${p1.player_name}` : p1.player_name) : 'BYE';
      const p2Name = p2 ? (p2.seed_number <= 8 ? `[#${s2}] ${p2.player_name}` : p2.player_name) : 'BYE';

      let status = 'Scheduled';
      let winnerId = null;
      if (p1 && !p2) {
        status = 'Completed';
        winnerId = p1.player_id;
      } else if (!p1 && p2) {
        status = 'Completed';
        winnerId = p2.player_id;
      }

      allMatches.push({
        temp_id: `RR_R${roundNumber}_M${mIdx + 1}`,
        round_level: roundNumber,
        round_name: `Round ${roundNumber}`,
        match_order: matchOrder++,
        board_number: (mIdx % board_limit) + 1,
        player1_id: p1 ? p1.player_id : null,
        player2_id: p2 ? p2.player_id : null,
        player1_name: p1Name,
        player2_name: p2Name,
        player1_seed: s1,
        player2_seed: s2,
        player1_score: 0,
        player2_score: 0,
        boards_played: 0,
        current_board: 1,
        winner_id: winnerId,
        status: status,
        scheduled_at: startDate
      });
    });
  });

  return {
    format: 'RoundRobin',
    total_rounds: roundPairings.length,
    participants,
    matches: allMatches
  };
}

