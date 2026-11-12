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
    if (ref.read(authProvider).user?.isUmpireOnly == true) return;
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

  int _boardScoreForSlot(int slot) {
    var sum = 0;
    for (final ev in _events) {
      if (parseInt(ev['board_number'], 1) == _currentBoard &&
          parseInt(ev['player_slot']) == slot) {
        sum += parseInt(ev['points']);
      }
    }
    return sum < 0 ? 0 : sum;
  }

  @override
  Widget build(BuildContext context) {
    final p1Name = _match['player1_name']?.toString() ?? 'TBD';
    final p2Name = _match['player2_name']?.toString() ?? 'TBD';
    final p1Score = parseInt(_match['player1_score']);
    final p2Score = parseInt(_match['player2_score']);
    final p1BoardScore = _boardScoreForSlot(1);
    final p2BoardScore = _boardScoreForSlot(2);
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
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 32),
        children: [
          // Status & Court Strip
          SurfaceCard(
            accentColor: status == 'Live' ? AppTheme.danger : AppTheme.emerald,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    StatusBadge(label: status),
                    const SizedBox(width: 8),
                    MetaPill(
                      icon: Icons.grid_view_rounded,
                      text: 'Court #${_match['board_number'] ?? 1}',
                    ),
                    const Spacer(),
                    Text(
                      'Board $_currentBoard / $_totalBoards',
                      style: AppTheme.tabular(
                        const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 12.5,
                          color: AppTheme.emerald,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: ['Scheduled', 'Live', 'Completed'].map((st) {
                    final active = status == st;
                    final tone = st == 'Live' ? AppTheme.danger : AppTheme.emerald;
                    return Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(
                          right: st == 'Completed' ? 0 : 8,
                        ),
                        child: GestureDetector(
                          onTap: () {
                            if (st == 'Completed') {
                              _declareWinnerAndComplete();
                            } else {
                              _updateMatchFields({'status': st});
                            }
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 160),
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              color: active
                                  ? tone
                                  : AppTheme.cardElevated(context),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: active ? tone : AppTheme.border(context),
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              st,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: active
                                    ? Colors.white
                                    : AppTheme.mutedText(context),
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Live Scoreboard + One-Tap Scoring Pad
          SurfaceCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _PlayerScoringColumn(
                        name: p1Name,
                        boardNumber: _currentBoard,
                        boardScore: p1BoardScore,
                        totalScore: p1Score,
                        colorLabel: colors.p1Color,
                        isWinner:
                            parseInt(_match['winner_id']) == _p1Id && _p1Id != 0,
                        queenClaimed: queenEvent != null,
                        onAdjustPoints: _saving
                            ? null
                            : (pts) =>
                                  _recordScore(playerSlot: 1, points: pts),
                        onAddQueen: _saving || queenEvent != null
                            ? null
                            : () => _recordScore(
                                playerSlot: 1,
                                points: 3,
                                isQueen: true,
                              ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(10, 42, 10, 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.cardElevated(context),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.border(context)),
                        ),
                        child: Text(
                          'VS',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                            color: AppTheme.mutedText(context),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: _PlayerScoringColumn(
                        name: p2Name,
                        boardNumber: _currentBoard,
                        boardScore: p2BoardScore,
                        totalScore: p2Score,
                        colorLabel: colors.p2Color,
                        isWinner:
                            parseInt(_match['winner_id']) == _p2Id && _p2Id != 0,
                        queenClaimed: queenEvent != null,
                        onAdjustPoints: _saving
                            ? null
                            : (pts) =>
                                  _recordScore(playerSlot: 2, points: pts),
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
                const SizedBox(height: 12),
                if (queenEvent != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.danger.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppTheme.danger.withValues(alpha: 0.25),
                      ),
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
                        Flexible(
                          child: Text(
                            'Queen (+3) locked in Board #$_currentBoard (${queenEvent['player_name']})',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.danger,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 12),
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
                    const SizedBox(width: 10),
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
          const SizedBox(height: 12),

          // Board Switcher (+ Extra Board on demand)
          SurfaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Boards Progression',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    TextButton.icon(
                      onPressed: () => _updateMatchFields({
                        'extra_boards': _extraBoards + 1,
                      }, toast: 'Extra board added.'),
                      icon: const Icon(Icons.add_rounded, size: 16),
                      label: const Text('Extra Board'),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: List.generate(_totalBoards, (i) {
                    final b = i + 1;
                    final selected = _currentBoard == b;
                    return GestureDetector(
                      onTap: () => _updateMatchFields({'current_board': b}),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        width: 44,
                        height: 36,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: selected
                              ? AppTheme.emerald
                              : AppTheme.cardElevated(context),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: selected
                                ? AppTheme.emerald
                                : AppTheme.border(context),
                          ),
                        ),
                        child: Text(
                          'B$b',
                          style: AppTheme.tabular(
                            TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                              color: selected
                                  ? const Color(0xFF022015)
                                  : AppTheme.mutedText(context),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

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
                Builder(
                  builder: (context) {
                    final tossWinnerItems = <DropdownMenuItem<int?>>[
                      const DropdownMenuItem<int?>(
                        value: null,
                        child: Text('Not Decided'),
                      ),
                    ];
                    final allowedWinnerIds = <int?>{null};
                    if (_p1Id != 0 && allowedWinnerIds.add(_p1Id)) {
                      tossWinnerItems.add(
                        DropdownMenuItem<int?>(
                          value: _p1Id,
                          child: Text(p1Name, overflow: TextOverflow.ellipsis),
                        ),
                      );
                    }
                    if (_p2Id != 0 && allowedWinnerIds.add(_p2Id)) {
                      tossWinnerItems.add(
                        DropdownMenuItem<int?>(
                          value: _p2Id,
                          child: Text(p2Name, overflow: TextOverflow.ellipsis),
                        ),
                      );
                    }
                    final rawWinner = _match['toss_winner_id'] != null
                        ? parseInt(_match['toss_winner_id'])
                        : null;
                    return DropdownButtonFormField<int?>(
                      value: safeDropdownValue<int?>(rawWinner, allowedWinnerIds),
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: 'Toss Winner'),
                      items: tossWinnerItems,
                      onChanged: (v) => _updateMatchFields({'toss_winner_id': v}),
                    );
                  },
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Builder(
                        builder: (context) {
                          const choices = ['White', 'Black'];
                          final rawChoice = _match['toss_choice']?.toString();
                          final val = safeDropdownValue<String>(
                            rawChoice,
                            choices,
                          ) ??
                              'White';
                          return DropdownButtonFormField<String>(
                            value: val,
                            isExpanded: true,
                            decoration: const InputDecoration(
                              labelText: 'Winner Color',
                            ),
                            items: choices
                                .map(
                                  (c) => DropdownMenuItem(
                                    value: c,
                                    child: Text(c),
                                  ),
                                )
                                .toList(),
                            onChanged: (v) {
                              if (v == null) return;
                              _updateMatchFields({
                                'toss_choice': v,
                                'toss_decision': v == 'White'
                                    ? 'Strike First (White)'
                                    : 'Defend (Black)',
                              });
                            },
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Builder(
                        builder: (context) {
                          const baseDecisions = [
                            'Strike First (White)',
                            'Defend (Black)',
                            'Strike First',
                            'Opponent Strikes',
                          ];
                          final rawDec = _match['toss_decision']?.toString();
                          final normalizedDec =
                              (rawDec != null && rawDec.trim().isNotEmpty)
                                  ? rawDec.trim()
                                  : 'Strike First (White)';
                          final allDecisions = {
                            ...baseDecisions,
                            normalizedDec,
                          }.toList();
                          return DropdownButtonFormField<String>(
                            value: safeDropdownValue<String>(
                              normalizedDec,
                              allDecisions,
                            ),
                            isExpanded: true,
                            decoration: const InputDecoration(
                              labelText: 'Strike Order',
                            ),
                            items: allDecisions
                                .map(
                                  (d) => DropdownMenuItem(
                                    value: d,
                                    child: Text(
                                      d,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                )
                                .toList(),
                            onChanged: (v) =>
                                _updateMatchFields({'toss_decision': v}),
                          );
                        },
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
                if (_umpires.isNotEmpty &&
                    ref.watch(authProvider).user?.isUmpireOnly != true) ...[
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
  final int boardNumber;
  final int boardScore;
  final int totalScore;
  final String colorLabel;
  final bool isWinner;
  final bool queenClaimed;
  final void Function(int points)? onAdjustPoints;
  final VoidCallback? onAddQueen;

  const _PlayerScoringColumn({
    required this.name,
    required this.boardNumber,
    required this.boardScore,
    required this.totalScore,
    required this.colorLabel,
    required this.isWinner,
    required this.queenClaimed,
    required this.onAdjustPoints,
    required this.onAddQueen,
  });

  Widget _buildPointButton(
    BuildContext context, {
    required int points,
    required bool canFine,
  }) {
    final isFine = points < 0;
    final enabled = onAdjustPoints != null && (!isFine || canFine);
    final accent = isFine ? AppTheme.danger : AppTheme.emerald;
    final label = points > 0 ? '+$points' : '$points';

    return Material(
      color: enabled
          ? accent.withValues(alpha: isFine ? 0.12 : 0.16)
          : AppTheme.card(context),
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: enabled ? () => onAdjustPoints!(points) : null,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: enabled
                  ? accent.withValues(alpha: 0.45)
                  : AppTheme.border(context),
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: AppTheme.tabular(
              TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
                color: enabled ? accent : AppTheme.mutedText(context),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isWhite = colorLabel == 'White';
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppTheme.cardElevated(context),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isWinner
              ? AppTheme.emerald.withValues(alpha: 0.6)
              : AppTheme.border(context),
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
            decoration: BoxDecoration(
              color: isWhite ? const Color(0xFFF8FAFC) : const Color(0xFF0B0F17),
              borderRadius: BorderRadius.circular(100),
              border: Border.all(
                color: isWhite
                    ? Colors.grey.shade400
                    : Colors.white.withValues(alpha: 0.25),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isWhite ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                    border: Border.all(
                      color: isWhite ? Colors.black54 : Colors.white54,
                      width: 1,
                    ),
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  colorLabel.toUpperCase(),
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.7,
                    color: isWhite ? const Color(0xFF0F172A) : Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 36,
            child: Center(
              child: Text(
                name,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  height: 1.2,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'BOARD #$boardNumber SCORE',
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
              color: AppTheme.mutedText(context),
            ),
          ),
          Text(
            '$boardScore',
            style: AppTheme.tabular(
              TextStyle(
                fontSize: 38,
                fontWeight: FontWeight.w900,
                letterSpacing: -1,
                color: isWinner ? AppTheme.emerald : null,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: AppTheme.emerald.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(100),
              border: Border.all(
                color: AppTheme.emerald.withValues(alpha: 0.25),
              ),
            ),
            child: Text(
              'Match Total: $totalScore',
              style: AppTheme.tabular(
                const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.emerald,
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              for (var i = 0; i < 3; i++) ...[
                if (i > 0) const SizedBox(width: 5),
                Expanded(
                  child: _buildPointButton(
                    context,
                    points: i + 1,
                    canFine: true,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 5),
          Row(
            children: [
              for (var i = 0; i < 3; i++) ...[
                if (i > 0) const SizedBox(width: 5),
                Expanded(
                  child: _buildPointButton(
                    context,
                    points: -(i + 1),
                    canFine: boardScore > 0 || totalScore > 0,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 6),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onAddQueen,
              style: OutlinedButton.styleFrom(
                foregroundColor: queenClaimed
                    ? AppTheme.mutedText(context)
                    : AppTheme.danger,
                side: BorderSide(
                  color: queenClaimed
                      ? AppTheme.border(context)
                      : AppTheme.danger.withValues(alpha: 0.4),
                ),
              ),
              child: Text(queenClaimed ? 'Queen Taken' : 'Queen +3'),
            ),
          ),
        ],
      ),
    );
  }
}
