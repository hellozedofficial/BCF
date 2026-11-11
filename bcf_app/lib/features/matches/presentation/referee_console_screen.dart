import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class RefereeConsoleScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> match;

  const RefereeConsoleScreen({super.key, required this.match});

  @override
  ConsumerState<RefereeConsoleScreen> createState() =>
      _RefereeConsoleScreenState();
}

class _RefereeConsoleScreenState extends ConsumerState<RefereeConsoleScreen> {
  late Map<String, dynamic> _match;
  List<Map<String, dynamic>> _events = [];
  List<Map<String, dynamic>> _umpires = [];
  bool _saving = false;
  Timer? _pollTimer;

  late final TextEditingController _streamUrlCtrl;
  late final TextEditingController _boardNumberCtrl;

  @override
  void initState() {
    super.initState();
    _match = Map<String, dynamic>.from(widget.match);
    _streamUrlCtrl = TextEditingController(
      text: _match['stream_url']?.toString() ?? '',
    );
    _boardNumberCtrl = TextEditingController(
      text: (_match['board_number'] ?? 1).toString(),
    );
    Future.microtask(_loadInitial);
    _pollTimer = Timer.periodic(
      const Duration(seconds: 3),
      (_) => _refreshMatchAndEvents(silent: true),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _streamUrlCtrl.dispose();
    _boardNumberCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadInitial() async {
    await Future.wait([_refreshMatchAndEvents(), _loadUmpires()]);
  }

  Future<void> _loadUmpires() async {
    try {
      final res = await ref.read(apiClientProvider).dio.get(ApiEndpoints.umpires);
      if (mounted) setState(() => _umpires = extractDataList(res.data));
    } catch (_) {}
  }

  Future<void> _refreshMatchAndEvents({bool silent = false}) async {
    final matchId = parseInt(_match['id']);
    try {
      final dio = ref.read(apiClientProvider).dio;
      final results = await Future.wait([
        dio.get(ApiEndpoints.matchEvents(matchId)),
        dio.get(
          ApiEndpoints.matches,
          queryParameters: {'include_unpublished': 'true'},
        ),
      ]);

      final evBody = results[0].data;
      final events = (evBody is Map && evBody['data'] is List)
          ? (evBody['data'] as List).whereType<Map<String, dynamic>>().toList()
          : <Map<String, dynamic>>[];

      final allMatches = extractDataList(results[1].data);
      final latestMatch = allMatches.cast<Map<String, dynamic>?>().firstWhere(
        (m) => m != null && parseInt(m['id']) == matchId,
        orElse: () => null,
      );

      if (mounted) {
        setState(() {
          _events = events;
          if (latestMatch != null) {
            _match = latestMatch;
          }
        });
      }
    } catch (e) {
      if (!silent && mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    }
  }

  int get _currentBoard => parseInt(_match['current_board'], 1);
  int get _boardLimit => parseInt(_match['tournament_board_limit'], 8);
  int get _extraBoards => parseInt(_match['extra_boards'], 0);
  int get _totalBoards => _boardLimit + _extraBoards;
  int get _p1Id => parseInt(_match['player1_id']);
  int get _p2Id => parseInt(_match['player2_id']);

  /// Determines White/Black assignment for current board based on ICF alternation.
  ({String p1Color, String p2Color, String firstStriker}) _boardColors() {
    final tossWinner = parseInt(_match['toss_winner_id']);
    final tossChoice = (_match['toss_choice']?.toString() ?? 'White').toLowerCase();
    final tossDecision = (_match['toss_decision']?.toString() ?? 'Strike First').toLowerCase();

    final winnerStartsWhite = tossChoice == 'white';
    final isOddBoard = _currentBoard % 2 == 1;

    bool p1White;
    if (tossWinner == _p2Id) {
      final p2StartsWhite = winnerStartsWhite;
      final p1StartsWhite = !p2StartsWhite;
      p1White = isOddBoard ? p1StartsWhite : !p1StartsWhite;
    } else {
      p1White = isOddBoard ? winnerStartsWhite : !winnerStartsWhite;
    }

    String firstStriker = p1White
        ? (_match['player1_name']?.toString() ?? 'Player 1')
        : (_match['player2_name']?.toString() ?? 'Player 2');
    if (tossDecision.contains('opponent') && tossWinner != 0) {
      firstStriker = tossWinner == _p1Id
          ? (_match['player2_name']?.toString() ?? 'Player 2')
          : (_match['player1_name']?.toString() ?? 'Player 1');
    }

    return (
      p1Color: p1White ? 'White' : 'Black',
      p2Color: p1White ? 'Black' : 'White',
      firstStriker: firstStriker,
    );
  }

  Map<String, dynamic>? get _queenClaimedInBoard {
    for (final ev in _events) {
      if (parseInt(ev['board_number'], 1) == _currentBoard &&
          (parseInt(ev['is_queen']) == 1 || ev['is_queen'] == true)) {
        return ev;
      }
    }
    return null;
  }

  Future<void> _updateMatchFields(Map<String, dynamic> payload,
      {String? toast}) async {
    setState(() => _saving = true);
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .put(ApiEndpoints.matchScore(parseInt(_match['id'])), data: payload);
      await _refreshMatchAndEvents(silent: true);
      if (mounted && toast != null) showAppSnack(context, toast);
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _recordScore({
    required int playerSlot,
    required int points,
    bool isQueen = false,
  }) async {
    setState(() => _saving = true);
    try {
      final res = await ref.read(apiClientProvider).dio.post(
        ApiEndpoints.matchEvents(parseInt(_match['id'])),
        data: {
          'player_slot': playerSlot,
          'points': points,
          'is_queen': isQueen,
        },
      );
      final data = res.data;
      if (mounted && data is Map && data['data'] is Map) {
        final d = data['data'] as Map;
        setState(() {
          if (d['events'] is List) {
            _events = (d['events'] as List)
                .whereType<Map<String, dynamic>>()
                .toList();
          }
          _match['player1_score'] = d['player1_score'] ?? _match['player1_score'];
          _match['player2_score'] = d['player2_score'] ?? _match['player2_score'];
        });
      }
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _undoLastEvent() async {
    setState(() => _saving = true);
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .post(ApiEndpoints.matchUndoEvent(parseInt(_match['id'])));
      await _refreshMatchAndEvents(silent: true);
      if (mounted) showAppSnack(context, 'Last strike undone.');
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _declareWinnerAndComplete() async {
    final p1Name = _match['player1_name']?.toString() ?? 'Player 1';
    final p2Name = _match['player2_name']?.toString() ?? 'Player 2';
    final p1Score = parseInt(_match['player1_score']);
    final p2Score = parseInt(_match['player2_score']);

    int? selectedWinner = p1Score > p2Score
        ? _p1Id
        : (p2Score > p1Score ? _p2Id : null);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text(
            'Complete Match & Declare Result',
            style: TextStyle(fontWeight: FontWeight.w800),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Score: $p1Name ($p1Score) vs $p2Name ($p2Score)'),
              const SizedBox(height: 12),
              RadioListTile<int?>(
                value: _p1Id,
                groupValue: selectedWinner,
                onChanged: (v) => setDialogState(() => selectedWinner = v),
                title: Text('$p1Name Wins'),
              ),
              RadioListTile<int?>(
                value: _p2Id,
                groupValue: selectedWinner,
                onChanged: (v) => setDialogState(() => selectedWinner = v),
                title: Text('$p2Name Wins'),
              ),
              RadioListTile<int?>(
                value: null,
                groupValue: selectedWinner,
                onChanged: (v) => setDialogState(() => selectedWinner = v),
                title: const Text('Draw / Tie'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Complete Match'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true) return;

    await _updateMatchFields({
      'status': 'Completed',
      'winner_id': selectedWinner,
      'boards_played': _currentBoard,
    }, toast: 'Match completed and bracket updated.');
  }

  @override
  Widget build(BuildContext context) {
    final p1Name = _match['player1_name']?.toString() ?? 'TBD';
    final p2Name = _match['player2_name']?.toString() ?? 'TBD';
    final p1Score = parseInt(_match['player1_score']);
    final p2Score = parseInt(_match['player2_score']);
    final status = _match['status']?.toString() ?? 'Scheduled';
    final colors = _boardColors();
    final queenEvent = _queenClaimedInBoard;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _match['round_name']?.toString() ?? 'Match Console',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
            Text(
              _match['tournament_title']?.toString() ?? 'Exhibition Match',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          if (_saving)
            const Padding(
              padding: EdgeInsets.all(14),
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: () => _refreshMatchAndEvents(),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          // Status & Court Strip
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      StatusBadge(label: status),
                      Text(
                        'Court #${_match['board_number'] ?? 1} • Board $_currentBoard / $_totalBoards',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: ['Scheduled', 'Live', 'Completed'].map((st) {
                      return ChoiceChip(
                        label: Text(st),
                        selected: status == st,
                        onSelected: (_) {
                          if (st == 'Completed') {
                            _declareWinnerAndComplete();
                          } else {
                            _updateMatchFields({'status': st});
                          }
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Live Scoreboard + One-Tap Scoring Pad
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _PlayerScoringColumn(
                          name: p1Name,
                          score: p1Score,
                          colorLabel: colors.p1Color,
                          isWinner: parseInt(_match['winner_id']) == _p1Id &&
                              _p1Id != 0,
                          queenClaimed: queenEvent != null,
                          onAddPoint: _saving
                              ? null
                              : () => _recordScore(playerSlot: 1, points: 1),
                          onAddQueen: _saving || queenEvent != null
                              ? null
                              : () => _recordScore(
                                  playerSlot: 1,
                                  points: 3,
                                  isQueen: true,
                                ),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8),
                        child: Text(
                          'VS',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                      Expanded(
                        child: _PlayerScoringColumn(
                          name: p2Name,
                          score: p2Score,
                          colorLabel: colors.p2Color,
                          isWinner: parseInt(_match['winner_id']) == _p2Id &&
                              _p2Id != 0,
                          queenClaimed: queenEvent != null,
                          onAddPoint: _saving
                              ? null
                              : () => _recordScore(playerSlot: 2, points: 1),
                          onAddQueen: _saving || queenEvent != null
                              ? null
                              : () => _recordScore(
                                  playerSlot: 2,
                                  points: 3,
                                  isQueen: true,
                                ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (queenEvent != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.danger.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.workspace_premium_rounded,
                            color: AppTheme.danger,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Queen (+3) locked in Board #$_currentBoard (${queenEvent['player_name']})',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.danger,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _saving || _events.isEmpty
                              ? null
                              : _undoLastEvent,
                          icon: const Icon(Icons.undo_rounded, size: 18),
                          label: const Text('Undo Strike'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _saving
                              ? null
                              : () {
                                  final next = _currentBoard + 1;
                                  final updates = <String, dynamic>{
                                    'current_board': next,
                                    'boards_played': _currentBoard,
                                  };
                                  if (next > _totalBoards) {
                                    updates['extra_boards'] = _extraBoards + 1;
                                  }
                                  _updateMatchFields(
                                    updates,
                                    toast: 'Moved to Board #$next',
                                  );
                                },
                          icon: const Icon(Icons.skip_next_rounded, size: 18),
                          label: const Text('Next Board'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Board Switcher (+ Extra Board on demand)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Boards',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      TextButton.icon(
                        onPressed: () => _updateMatchFields({
                          'extra_boards': _extraBoards + 1,
                        }, toast: 'Extra board added.'),
                        icon: const Icon(Icons.add_rounded, size: 16),
                        label: const Text('Add Extra Board'),
                      ),
                    ],
                  ),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: List.generate(_totalBoards, (i) {
                      final b = i + 1;
                      return ChoiceChip(
                        label: Text('B$b'),
                        selected: _currentBoard == b,
                        onSelected: (_) =>
                            _updateMatchFields({'current_board': b}),
                      );
                    }),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Toss Configuration
          Card(
            child: ExpansionTile(
              leading: const Icon(Icons.toll_rounded, color: AppTheme.warning),
              title: const Text(
                'Toss & Color Alternation',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Text('First Striker (Board $_currentBoard): ${colors.firstStriker}'),
              childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              children: [
                DropdownButtonFormField<int?>(
                  value: (_match['toss_winner_id'] == _p1Id ||
                          _match['toss_winner_id'] == _p2Id)
                      ? parseInt(_match['toss_winner_id'])
                      : null,
                  decoration: const InputDecoration(labelText: 'Toss Winner'),
                  items: [
                    if (_p1Id != 0)
                      DropdownMenuItem(value: _p1Id, child: Text(p1Name)),
                    if (_p2Id != 0)
                      DropdownMenuItem(value: _p2Id, child: Text(p2Name)),
                  ],
                  onChanged: (v) {
                    if (v != null) _updateMatchFields({'toss_winner_id': v});
                  },
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _match['toss_choice']?.toString() ?? 'White',
                        decoration: const InputDecoration(labelText: 'Winner Color'),
                        items: const [
                          DropdownMenuItem(value: 'White', child: Text('White')),
                          DropdownMenuItem(value: 'Black', child: Text('Black')),
                        ],
                        onChanged: (v) =>
                            _updateMatchFields({'toss_choice': v}),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value:
                            _match['toss_decision']?.toString() ?? 'Strike First',
                        decoration: const InputDecoration(labelText: 'Strike Order'),
                        items: const [
                          DropdownMenuItem(
                            value: 'Strike First',
                            child: Text('Strike First'),
                          ),
                          DropdownMenuItem(
                            value: 'Opponent Strikes',
                            child: Text('Opponent Strikes'),
                          ),
                        ],
                        onChanged: (v) =>
                            _updateMatchFields({'toss_decision': v}),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Stream URL, Court # & Umpire
          Card(
            child: ExpansionTile(
              leading: const Icon(Icons.settings_input_component_rounded),
              title: const Text(
                'Court, Umpire & Live Stream',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              children: [
                if (_umpires.isNotEmpty) ...[
                  DropdownButtonFormField<int?>(
                    value: _umpires.any(
                      (u) => parseInt(u['id']) == parseInt(_match['umpire_id']),
                    )
                        ? parseInt(_match['umpire_id'])
                        : null,
                    decoration: const InputDecoration(labelText: 'Assigned Umpire'),
                    items: [
                      const DropdownMenuItem<int?>(value: null, child: Text('Unassigned')),
                      ..._umpires.map(
                        (u) => DropdownMenuItem<int?>(
                          value: parseInt(u['id']),
                          child: Text('${u['name']} (${u['umpire_id'] ?? ''})'),
                        ),
                      ),
                    ],
                    onChanged: (v) {
                      final u = _umpires.cast<Map<String, dynamic>?>().firstWhere(
                        (x) => x != null && parseInt(x['id']) == v,
                        orElse: () => null,
                      );
                      _updateMatchFields({
                        'umpire_id': v,
                        'umpire_name': u?['name'],
                      }, toast: 'Umpire updated.');
                    },
                  ),
                  const SizedBox(height: 10),
                ],
                TextField(
                  controller: _boardNumberCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Court Table Number'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _streamUrlCtrl,
                  decoration: const InputDecoration(
                    labelText: 'YouTube Live Stream URL',
                    hintText: 'https://www.youtube.com/watch?v=...',
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _updateMatchFields({
                      'board_number': int.tryParse(_boardNumberCtrl.text) ?? 1,
                      'stream_url': _streamUrlCtrl.text.trim(),
                    }, toast: 'Court & stream updated.'),
                    child: const Text('Save Court & Stream'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Live Turn-by-Turn Event Feed
          Text(
            'Live Court Scoring Feed (${_events.length} strikes)',
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          if (_events.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(14),
                child: Text('No strikes recorded yet in this match.'),
              ),
            )
          else
            ..._events.reversed.take(25).map((ev) {
              final isQueen =
                  parseInt(ev['is_queen']) == 1 || ev['is_queen'] == true;
              return Card(
                margin: const EdgeInsets.only(bottom: 6),
                child: ListTile(
                  dense: true,
                  leading: CircleAvatar(
                    radius: 16,
                    backgroundColor: (isQueen ? AppTheme.danger : AppTheme.emerald)
                        .withValues(alpha: 0.16),
                    child: Text(
                      isQueen ? 'Q' : '+${ev['points'] ?? 1}',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                        color: isQueen ? AppTheme.danger : AppTheme.emerald,
                      ),
                    ),
                  ),
                  title: Text(
                    ev['player_name']?.toString() ?? 'Player',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    'Board #${ev['board_number'] ?? 1} • ${isQueen ? 'Queen (+3)' : '+${ev['points'] ?? 1} point'}',
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _PlayerScoringColumn extends StatelessWidget {
  final String name;
  final int score;
  final String colorLabel;
  final bool isWinner;
  final bool queenClaimed;
  final VoidCallback? onAddPoint;
  final VoidCallback? onAddQueen;

  const _PlayerScoringColumn({
    required this.name,
    required this.score,
    required this.colorLabel,
    required this.isWinner,
    required this.queenClaimed,
    required this.onAddPoint,
    required this.onAddQueen,
  });

  @override
  Widget build(BuildContext context) {
    final isWhite = colorLabel == 'White';
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: isWhite ? Colors.white : Colors.black87,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.grey.shade500),
          ),
          child: Text(
            '$colorLabel Striker',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: isWhite ? Colors.black : Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          name,
          maxLines: 2,
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
        ),
        const SizedBox(height: 6),
        Text(
          '$score',
          style: TextStyle(
            fontSize: 34,
            fontWeight: FontWeight.w900,
            color: isWinner ? AppTheme.emerald : null,
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: onAddPoint,
            child: const Text('+1 Point'),
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: onAddQueen,
            style: OutlinedButton.styleFrom(
              foregroundColor: queenClaimed ? Colors.grey : AppTheme.danger,
            ),
            child: Text(queenClaimed ? 'Queen Taken' : 'Queen +3'),
          ),
        ),
      ],
    );
  }
}
