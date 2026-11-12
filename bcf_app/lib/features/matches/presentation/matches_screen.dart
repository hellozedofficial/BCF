import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';
import 'referee_console_screen.dart';

class MatchesScreen extends ConsumerStatefulWidget {
  const MatchesScreen({super.key});

  @override
  ConsumerState<MatchesScreen> createState() => _MatchesScreenState();
}

class _MatchesScreenState extends ConsumerState<MatchesScreen> {
  final _searchCtrl = TextEditingController();
  bool _loading = true;
  String? _error;

  // Multi-dimensional filters
  String _statusFilter = 'All';
  int? _tournamentFilter; // -1 = Standalone, >0 = specific tournament, null = All
  int? _playerFilter;
  int? _umpireFilter; // -1 = Unassigned, >0 = specific umpire, null = All
  String? _roundFilter;
  DateTimeRange? _dateRange;
  String _datePreset = 'All'; // All, Today, Tomorrow, Week, Custom
  String _sortBy = 'live_first'; // live_first, date_asc, date_desc
  bool _showFiltersPanel = false;

  bool _bulkMode = false;
  final Set<int> _selectedIds = {};

  List<Map<String, dynamic>> _matches = [];
  List<Map<String, dynamic>> _tournaments = [];
  List<Map<String, dynamic>> _players = [];
  List<Map<String, dynamic>> _umpires = [];

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final dio = ref.read(apiClientProvider).dio;
      final user = ref.read(authProvider).user;
      final isUmpireOnly = user?.isUmpireOnly == true;
      final res = await Future.wait([
        dio.get(
          ApiEndpoints.matches,
          queryParameters: {'include_unpublished': 'true'},
        ),
        dio.get(
          ApiEndpoints.tournaments,
          queryParameters: {'include_unpublished': 'true'},
        ),
        if (!isUmpireOnly) dio.get(ApiEndpoints.players),
        if (!isUmpireOnly) dio.get(ApiEndpoints.umpires),
      ]);

      final rawMatches = extractDataList(res[0].data);
      final linkedUmpireId = user?.umpireProfile?.id;
      final scopedMatches = (isUmpireOnly && linkedUmpireId != null)
          ? rawMatches
                .where((m) => parseInt(m['umpire_id'], -1) == linkedUmpireId)
                .toList()
          : rawMatches;

      setState(() {
        _matches = scopedMatches;
        _tournaments = extractDataList(res[1].data);
        _players = !isUmpireOnly && res.length > 2
            ? extractDataList(res[2].data)
            : [];
        _umpires = !isUmpireOnly && res.length > 3
            ? extractDataList(res[3].data)
            : [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  DateTime? _matchDate(Map<String, dynamic> m) {
    final raw = (m['scheduled_at'] ?? m['created_at'])?.toString();
    if (raw == null || raw.isEmpty) return null;
    return DateTime.tryParse(raw)?.toLocal();
  }

  void _applyDatePreset(String preset) async {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    if (preset == 'All') {
      setState(() {
        _datePreset = 'All';
        _dateRange = null;
      });
    } else if (preset == 'Today') {
      setState(() {
        _datePreset = 'Today';
        _dateRange = DateTimeRange(start: todayStart, end: todayStart);
      });
    } else if (preset == 'Tomorrow') {
      final tmrw = todayStart.add(const Duration(days: 1));
      setState(() {
        _datePreset = 'Tomorrow';
        _dateRange = DateTimeRange(start: tmrw, end: tmrw);
      });
    } else if (preset == 'Week') {
      setState(() {
        _datePreset = 'Week';
        _dateRange = DateTimeRange(
          start: todayStart,
          end: todayStart.add(const Duration(days: 6)),
        );
      });
    } else if (preset == 'Custom') {
      final picked = await showDateRangePicker(
        context: context,
        firstDate: DateTime(2020),
        lastDate: DateTime(2035),
        initialDateRange: _dateRange ??
            DateTimeRange(
              start: todayStart,
              end: todayStart.add(const Duration(days: 7)),
            ),
      );
      if (picked != null && mounted) {
        setState(() {
          _datePreset = 'Custom';
          _dateRange = picked;
        });
      }
    }
  }

  int get _activeFilterCount {
    int count = 0;
    if (_tournamentFilter != null) count++;
    if (_playerFilter != null) count++;
    if (_umpireFilter != null) count++;
    if (_roundFilter != null) count++;
    if (_dateRange != null) count++;
    return count;
  }

  void _resetAllFilters() {
    setState(() {
      _searchCtrl.clear();
      _statusFilter = 'All';
      _tournamentFilter = null;
      _playerFilter = null;
      _umpireFilter = null;
      _roundFilter = null;
      _dateRange = null;
      _datePreset = 'All';
      _sortBy = 'live_first';
    });
  }

  List<String> get _availableRounds {
    final rounds = <String>{};
    for (final m in _matches) {
      if (_tournamentFilter != null) {
        final tid = parseInt(m['tournament_id'], -1);
        if (_tournamentFilter == -1 && tid > 0) continue;
        if (_tournamentFilter! > 0 && tid != _tournamentFilter) continue;
      }
      final r = m['round_name']?.toString().trim() ?? '';
      if (r.isNotEmpty) rounds.add(r);
    }
    return rounds.toList()..sort();
  }

  List<Map<String, dynamic>> get _filteredMatches {
    final query = _searchCtrl.text.trim().toLowerCase();

    final list = _matches.where((m) {
      if (_statusFilter != 'All' &&
          (m['status']?.toString() ?? 'Scheduled') != _statusFilter) {
        return false;
      }

      if (_tournamentFilter != null) {
        final tid = parseInt(m['tournament_id'], -1);
        if (_tournamentFilter == -1 && tid > 0) return false;
        if (_tournamentFilter! > 0 && tid != _tournamentFilter) return false;
      }

      if (_playerFilter != null) {
        final p1 = parseInt(m['player1_id'], -1);
        final p2 = parseInt(m['player2_id'], -1);
        if (p1 != _playerFilter && p2 != _playerFilter) return false;
      }

      if (_umpireFilter != null) {
        final uid = parseInt(m['umpire_id'], -1);
        if (_umpireFilter == -1 && uid > 0) return false;
        if (_umpireFilter! > 0 && uid != _umpireFilter) return false;
      }

      if (_roundFilter != null) {
        if ((m['round_name']?.toString().trim() ?? '') != _roundFilter) {
          return false;
        }
      }

      if (_dateRange != null) {
        final dt = _matchDate(m);
        if (dt == null) return false;
        final day = DateTime(dt.year, dt.month, dt.day);
        final startDay = DateTime(
          _dateRange!.start.year,
          _dateRange!.start.month,
          _dateRange!.start.day,
        );
        final endDay = DateTime(
          _dateRange!.end.year,
          _dateRange!.end.month,
          _dateRange!.end.day,
        );
        if (day.isBefore(startDay) || day.isAfter(endDay)) return false;
      }

      if (query.isNotEmpty) {
        final hay =
            '#${m['id']} ${m['player1_name']} ${m['player2_name']} ${m['round_name']} ${m['tournament_title']} ${m['umpire_name']} court ${m['board_number']}'
                .toLowerCase();
        if (!hay.contains(query)) return false;
      }
      return true;
    }).toList();

    list.sort((a, b) {
      if (_sortBy == 'live_first') {
        int rank(Map<String, dynamic> m) {
          final s = (m['status']?.toString() ?? '').toLowerCase();
          if (s == 'live') return 0;
          if (s == 'scheduled') return 1;
          return 2;
        }
        final cmp = rank(a).compareTo(rank(b));
        if (cmp != 0) return cmp;
      }
      final da = _matchDate(a);
      final db = _matchDate(b);
      if (da != null && db != null) {
        return _sortBy == 'date_desc' ? db.compareTo(da) : da.compareTo(db);
      }
      return parseInt(b['id']).compareTo(parseInt(a['id']));
    });

    return list;
  }

  Future<void> _pickPlayerFilter() async {
    String q = '';
    final chosen = await showAppModalSheet<int?>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final matches = _players.where((p) {
            if (q.isEmpty) return true;
            return '${p['full_name']} ${p['player_id']} ${p['district']}'
                .toLowerCase()
                .contains(q.toLowerCase());
          }).toList();

          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Filter by Player',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(-999),
                      child: const Text('Clear'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search player name or BCF ID...',
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                  onChanged: (v) => setModalState(() => q = v),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: ListView.builder(
                    itemCount: matches.length,
                    itemBuilder: (_, i) {
                      final p = matches[i];
                      final pid = parseInt(p['id']);
                      return ListTile(
                        leading: AppAvatar(
                          url: p['photo_url']?.toString(),
                          name: p['full_name']?.toString() ?? 'P',
                        ),
                        title: Text(p['full_name']?.toString() ?? ''),
                        subtitle: Text(
                          '${p['player_id'] ?? ''} • ${p['district'] ?? ''}',
                        ),
                        selected: _playerFilter == pid,
                        trailing: _playerFilter == pid
                            ? const Icon(Icons.check_rounded, color: AppTheme.emerald)
                            : null,
                        onTap: () => Navigator.of(ctx).pop(pid),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
    if (chosen == null) return;
    setState(() => _playerFilter = chosen == -999 ? null : chosen);
  }

  Future<void> _bulkAssignUmpire() async {
    if (_selectedIds.isEmpty) return;
    final chosen = await showAppModalSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: false,
      builder: (ctx) => ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Assign Umpire to ${_selectedIds.length} Match(es)',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          ..._umpires.map(
            (u) => ListTile(
              leading: AppAvatar(
                url: u['photo_url']?.toString(),
                name: u['name']?.toString() ?? 'U',
              ),
              title: Text(u['name']?.toString() ?? ''),
              subtitle: Text(u['umpire_id']?.toString() ?? ''),
              onTap: () => Navigator.of(ctx).pop(u),
            ),
          ),
        ],
      ),
    );
    if (chosen == null) return;

    try {
      await ref.read(apiClientProvider).dio.put(
        ApiEndpoints.bulkAssignUmpire,
        data: {
          'match_ids': _selectedIds.toList(),
          'umpire_id': parseInt(chosen['id']),
          'umpire_name': chosen['name'],
        },
      );
      if (mounted) {
        showAppSnack(context, 'Umpire assigned to ${_selectedIds.length} matches.');
        setState(() {
          _bulkMode = false;
          _selectedIds.clear();
        });
        _load();
      }
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    }
  }

  Future<void> _createMatchDialog() async {
    int? p1;
    int? p2;
    int? tid;
    int? uid;
    String roundName = 'Exhibition Match';
    String streamUrl = '';

    final saved = await showAppModalSheet<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 18,
            right: 18,
            top: 18,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Create Standalone / Court Match',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int?>(
                  value: safeDropdownValue(
                    p1,
                    _players.map((p) => parseInt(p['id'])),
                  ),
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Player 1'),
                  items: _players
                      .map(
                        (p) => DropdownMenuItem<int?>(
                          value: parseInt(p['id']),
                          child: Text(
                            p['full_name']?.toString() ?? '',
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setModalState(() => p1 = v),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int?>(
                  value: safeDropdownValue(
                    p2,
                    _players.map((p) => parseInt(p['id'])),
                  ),
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Player 2'),
                  items: _players
                      .map(
                        (p) => DropdownMenuItem<int?>(
                          value: parseInt(p['id']),
                          child: Text(
                            p['full_name']?.toString() ?? '',
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setModalState(() => p2 = v),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int?>(
                  value: safeDropdownValue<int?>(
                    tid,
                    <int?>[null, ..._tournaments.map((t) => parseInt(t['id']))],
                  ),
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Tournament (Optional)'),
                  items: [
                    const DropdownMenuItem<int?>(value: null, child: Text('Standalone')),
                    ..._tournaments.map(
                      (t) => DropdownMenuItem<int?>(
                        value: parseInt(t['id']),
                        child: Text(
                          t['title']?.toString() ?? '',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                  onChanged: (v) => setModalState(() => tid = v),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int?>(
                  value: safeDropdownValue<int?>(
                    uid,
                    <int?>[null, ..._umpires.map((u) => parseInt(u['id']))],
                  ),
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Umpire (Optional)'),
                  items: [
                    const DropdownMenuItem<int?>(value: null, child: Text('None')),
                    ..._umpires.map(
                      (u) => DropdownMenuItem<int?>(
                        value: parseInt(u['id']),
                        child: Text(
                          u['name']?.toString() ?? '',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                  onChanged: (v) => setModalState(() => uid = v),
                ),
                const SizedBox(height: 10),
                TextFormField(
                  initialValue: roundName,
                  decoration: const InputDecoration(labelText: 'Round Label'),
                  onChanged: (v) => roundName = v,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'YouTube Stream URL (Optional)'),
                  onChanged: (v) => streamUrl = v,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    if (p1 == null || p2 == null || p1 == p2) {
                      showAppSnack(ctx, 'Select two distinct players.', isError: true);
                      return;
                    }
                    final pl1 = _players.firstWhere((e) => parseInt(e['id']) == p1);
                    final pl2 = _players.firstWhere((e) => parseInt(e['id']) == p2);
                    final ump = uid == null
                        ? null
                        : _umpires.firstWhere((e) => parseInt(e['id']) == uid);
                    try {
                      await ref.read(apiClientProvider).dio.post(
                        ApiEndpoints.matches,
                        data: {
                          'tournament_id': tid,
                          'round_name': roundName,
                          'player1_id': p1,
                          'player2_id': p2,
                          'player1_name': pl1['full_name'],
                          'player2_name': pl2['full_name'],
                          'umpire_id': uid,
                          'umpire_name': ump?['name'],
                          'stream_url': streamUrl.trim(),
                          'status': 'Live',
                        },
                      );
                      if (ctx.mounted) Navigator.of(ctx).pop(true);
                    } catch (e) {
                      if (ctx.mounted) {
                        showAppSnack(ctx, ApiClient.extractErrorMessage(e), isError: true);
                      }
                    }
                  },
                  child: const Text('Start Match'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    if (saved == true) _load();
  }

  String _playerName(int id) {
    final p = _players.cast<Map<String, dynamic>?>().firstWhere(
      (e) => e != null && parseInt(e['id']) == id,
      orElse: () => null,
    );
    return p?['full_name']?.toString() ?? 'Player #$id';
  }

  String _tournamentName(int id) {
    if (id == -1) return 'Standalone';
    final t = _tournaments.cast<Map<String, dynamic>?>().firstWhere(
      (e) => e != null && parseInt(e['id']) == id,
      orElse: () => null,
    );
    return t?['title']?.toString() ?? 'Tournament #$id';
  }

  String _umpireName(int id) {
    if (id == -1) return 'Unassigned';
    final u = _umpires.cast<Map<String, dynamic>?>().firstWhere(
      (e) => e != null && parseInt(e['id']) == id,
      orElse: () => null,
    );
    return u?['name']?.toString() ?? 'Umpire #$id';
  }

  @override
  Widget build(BuildContext context) {
    final isUmpireOnly = ref.watch(authProvider).user?.isUmpireOnly == true;
    final filtered = _filteredMatches;
    final rounds = _availableRounds;
    final fmt = DateFormat('dd MMM');

    return Scaffold(
      body: Column(
        children: [
          if (isUmpireOnly)
            Container(
              width: double.infinity,
              color: AppTheme.gold.withValues(alpha: 0.12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
              child: const Row(
                children: [
                  Icon(Icons.sports_rounded, size: 16, color: AppTheme.gold),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Umpire Duty Queue — showing only matches assigned to you',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.gold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: AppSearchBar(
                    controller: _searchCtrl,
                    hint: 'Search player, round, umpire, court...',
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                Badge(
                  isLabelVisible: _activeFilterCount > 0,
                  label: Text('$_activeFilterCount'),
                  child: IconButton.filledTonal(
                    tooltip: 'Advanced Filters',
                    icon: Icon(
                      _showFiltersPanel
                          ? Icons.filter_list_off_rounded
                          : Icons.tune_rounded,
                    ),
                    onPressed: () =>
                        setState(() => _showFiltersPanel = !_showFiltersPanel),
                  ),
                ),
                if (!isUmpireOnly) ...[
                  const SizedBox(width: 6),
                  IconButton.filledTonal(
                    tooltip: 'Bulk Assign Umpire',
                    icon: Icon(
                      _bulkMode ? Icons.close_rounded : Icons.checklist_rounded,
                    ),
                    onPressed: () {
                      setState(() {
                        _bulkMode = !_bulkMode;
                        _selectedIds.clear();
                      });
                    },
                  ),
                ],
              ],
            ),
          ),

          // Sleek Status Pills + Quick Date / Player Triggers (Wrap prevents right-edge clipping)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final s in ['All', 'Live', 'Scheduled', 'Completed'])
                  _FilterCapsule(
                    label: s,
                    selected: _statusFilter == s,
                    activeColor: s == 'Live' ? AppTheme.danger : AppTheme.emerald,
                    onTap: () => setState(() => _statusFilter = s),
                  ),
                _FilterCapsule(
                  icon: Icons.date_range_rounded,
                  label: _dateRange == null
                      ? 'Date Range'
                      : '${fmt.format(_dateRange!.start)} - ${fmt.format(_dateRange!.end)}',
                  selected: _dateRange != null,
                  activeColor: AppTheme.info,
                  onTap: () => _applyDatePreset('Custom'),
                ),
                _FilterCapsule(
                  icon: Icons.person_search_rounded,
                  label: _playerFilter == null
                      ? 'Player'
                      : _playerName(_playerFilter!),
                  selected: _playerFilter != null,
                  activeColor: AppTheme.gold,
                  onTap: _pickPlayerFilter,
                ),
              ],
            ),
          ),

          // Expandable Advanced Filter Panel
          if (_showFiltersPanel)
            SurfaceCard(
              margin: const EdgeInsets.fromLTRB(16, 10, 16, 4),
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Advanced Match Filters',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      if (_activeFilterCount > 0 ||
                          _statusFilter != 'All' ||
                          _searchCtrl.text.isNotEmpty)
                        TextButton.icon(
                          onPressed: _resetAllFilters,
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: const Text('Reset All'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<int?>(
                    value: safeDropdownValue<int?>(
                      _tournamentFilter,
                      [
                        null,
                        -1,
                        ..._tournaments.map((t) => parseInt(t['id'])),
                      ],
                    ),
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Tournament',
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem<int?>(
                        value: null,
                        child: Text('All Tournaments'),
                      ),
                      const DropdownMenuItem<int?>(
                        value: -1,
                        child: Text('Standalone / Exhibition Only'),
                      ),
                      ..._tournaments.map(
                        (t) => DropdownMenuItem<int?>(
                          value: parseInt(t['id']),
                          child: Text(
                            t['title']?.toString() ?? '',
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ],
                    onChanged: (v) => setState(() {
                      _tournamentFilter = v;
                      if (_roundFilter != null &&
                          !_availableRounds.contains(_roundFilter)) {
                        _roundFilter = null;
                      }
                    }),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<int?>(
                          value: safeDropdownValue<int?>(
                            _umpireFilter,
                            [
                              null,
                              -1,
                              ..._umpires.map((u) => parseInt(u['id'])),
                            ],
                          ),
                          isExpanded: true,
                          decoration: const InputDecoration(
                            labelText: 'Umpire',
                            isDense: true,
                          ),
                          items: [
                            const DropdownMenuItem<int?>(
                              value: null,
                              child: Text('All Umpires'),
                            ),
                            const DropdownMenuItem<int?>(
                              value: -1,
                              child: Text('Unassigned Only'),
                            ),
                            ..._umpires.map(
                              (u) => DropdownMenuItem<int?>(
                                value: parseInt(u['id']),
                                child: Text(
                                  u['name']?.toString() ?? '',
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                          onChanged: (v) => setState(() => _umpireFilter = v),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: DropdownButtonFormField<String?>(
                          value: safeDropdownValue<String?>(
                            _roundFilter,
                            [null, ...rounds],
                          ),
                          isExpanded: true,
                          decoration: const InputDecoration(
                            labelText: 'Round',
                            isDense: true,
                          ),
                          items: [
                            const DropdownMenuItem<String?>(
                              value: null,
                              child: Text('All Rounds'),
                            ),
                            ...rounds.map(
                              (r) => DropdownMenuItem<String?>(
                                value: r,
                                child: Text(r, overflow: TextOverflow.ellipsis),
                              ),
                            ),
                          ],
                          onChanged: (v) => setState(() => _roundFilter = v),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value: safeDropdownValue(
                      _sortBy,
                      const ['live_first', 'date_asc', 'date_desc'],
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Sort Order',
                      isDense: true,
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'live_first',
                        child: Text('Live & Upcoming First'),
                      ),
                      DropdownMenuItem(
                        value: 'date_asc',
                        child: Text('Schedule Date (Earliest First)'),
                      ),
                      DropdownMenuItem(
                        value: 'date_desc',
                        child: Text('Schedule Date (Latest First)'),
                      ),
                    ],
                    onChanged: (v) =>
                        setState(() => _sortBy = v ?? 'live_first'),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: ['All', 'Today', 'Tomorrow', 'Week', 'Custom']
                        .map((preset) {
                      return _FilterCapsule(
                        label: preset == 'Custom' && _dateRange != null
                            ? '${fmt.format(_dateRange!.start)} - ${fmt.format(_dateRange!.end)}'
                            : preset,
                        selected: _datePreset == preset,
                        onTap: () => _applyDatePreset(preset),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

          // Active filter removable tags
          if (_activeFilterCount > 0)
            SizedBox(
              height: 40,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                scrollDirection: Axis.horizontal,
                children: [
                  if (_tournamentFilter != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: InputChip(
                        label: Text(_tournamentName(_tournamentFilter!)),
                        onDeleted: () => setState(() => _tournamentFilter = null),
                      ),
                    ),
                  if (_playerFilter != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: InputChip(
                        label: Text(_playerName(_playerFilter!)),
                        onDeleted: () => setState(() => _playerFilter = null),
                      ),
                    ),
                  if (_umpireFilter != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: InputChip(
                        label: Text('Umpire: ${_umpireName(_umpireFilter!)}'),
                        onDeleted: () => setState(() => _umpireFilter = null),
                      ),
                    ),
                  if (_roundFilter != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: InputChip(
                        label: Text(_roundFilter!),
                        onDeleted: () => setState(() => _roundFilter = null),
                      ),
                    ),
                  if (_dateRange != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: InputChip(
                        label: Text(
                          '${fmt.format(_dateRange!.start)} - ${fmt.format(_dateRange!.end)}',
                        ),
                        onDeleted: () => setState(() {
                          _dateRange = null;
                          _datePreset = 'All';
                        }),
                      ),
                    ),
                ],
              ),
            ),

          if (_bulkMode && _selectedIds.isNotEmpty)
            Container(
              color: AppTheme.emerald.withValues(alpha: 0.14),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Text(
                    '${_selectedIds.length} selected',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const Spacer(),
                  ElevatedButton.icon(
                    onPressed: _bulkAssignUmpire,
                    icon: const Icon(Icons.gavel_rounded, size: 16),
                    label: const Text('Assign Umpire'),
                  ),
                ],
              ),
            ),

          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
            child: Row(
              children: [
                Text(
                  'SHOWING ${filtered.length} OF ${_matches.length} FIXTURES',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.9,
                    color: AppTheme.mutedText(context),
                  ),
                ),
                const Spacer(),
                if (_activeFilterCount > 0 ||
                    _statusFilter != 'All' ||
                    _searchCtrl.text.isNotEmpty)
                  TextButton(
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    onPressed: _resetAllFilters,
                    child: const Text('Clear Filters'),
                  ),
              ],
            ),
          ),

          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? ErrorStateView(message: _error!, onRetry: _load)
                : filtered.isEmpty
                ? EmptyStateView(
                    icon: Icons.sports_esports_outlined,
                    title: 'No Matching Fixtures',
                    subtitle: 'Adjust filters or create a new match.',
                    action: _activeFilterCount > 0 || _statusFilter != 'All'
                        ? OutlinedButton(
                            onPressed: _resetAllFilters,
                            child: const Text('Reset Filters'),
                          )
                        : null,
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 6, 16, 96),
                      itemCount: filtered.length,
                      itemBuilder: (_, i) {
                        final m = filtered[i];
                        final id = parseInt(m['id']);
                        final status = m['status']?.toString() ?? 'Scheduled';
                        final isLive = status.toLowerCase() == 'live';
                        final isDone = status.toLowerCase() == 'completed';
                        final p1Win =
                            isDone &&
                            parseInt(m['winner_id']) == parseInt(m['player1_id']) &&
                            parseInt(m['winner_id']) > 0;
                        final p2Win =
                            isDone &&
                            parseInt(m['winner_id']) == parseInt(m['player2_id']) &&
                            parseInt(m['winner_id']) > 0;
                        final dt = _matchDate(m);
                        final dateStr = dt != null
                            ? DateFormat('dd MMM • hh:mm a').format(dt)
                            : null;

                        return SurfaceCard(
                          margin: const EdgeInsets.only(bottom: 10),
                          selected: _bulkMode && _selectedIds.contains(id),
                          accentColor: isLive ? AppTheme.danger : null,
                          onTap: _bulkMode
                              ? () {
                                  setState(() {
                                    if (_selectedIds.contains(id)) {
                                      _selectedIds.remove(id);
                                    } else {
                                      _selectedIds.add(id);
                                    }
                                  });
                                }
                              : () async {
                                  await Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => RefereeConsoleScreen(match: m),
                                    ),
                                  );
                                  _load();
                                },
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  if (_bulkMode) ...[
                                    SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: Checkbox(
                                        value: _selectedIds.contains(id),
                                        onChanged: (v) {
                                          setState(() {
                                            if (v == true) {
                                              _selectedIds.add(id);
                                            } else {
                                              _selectedIds.remove(id);
                                            }
                                          });
                                        },
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  Expanded(
                                    child: Text(
                                      '${m['tournament_title'] ?? 'Exhibition'}${(m['round_name']?.toString() ?? '').isNotEmpty ? ' • ${m['round_name']}' : ''}',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.mutedText(context),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  StatusBadge(label: status),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      m['player1_name']?.toString() ?? 'TBD',
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.w800,
                                        color: p1Win ? AppTheme.emerald : null,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    margin: const EdgeInsets.symmetric(horizontal: 10),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isLive
                                          ? AppTheme.danger.withValues(alpha: 0.14)
                                          : AppTheme.cardElevated(context),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: isLive
                                            ? AppTheme.danger.withValues(alpha: 0.35)
                                            : AppTheme.border(context),
                                      ),
                                    ),
                                    child: Text(
                                      '${m['player1_score'] ?? 0} : ${m['player2_score'] ?? 0}',
                                      style: AppTheme.tabular(
                                        TextStyle(
                                          fontSize: 15.5,
                                          fontWeight: FontWeight.w900,
                                          color: isLive ? AppTheme.danger : null,
                                        ),
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      m['player2_name']?.toString() ?? 'TBD',
                                      textAlign: TextAlign.right,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.w800,
                                        color: p2Win ? AppTheme.emerald : null,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  MetaPill(
                                    icon: Icons.grid_view_rounded,
                                    text: 'Court #${m['board_number'] ?? 1}',
                                  ),
                                  MetaPill(
                                    icon: Icons.layers_rounded,
                                    text: 'Board #${m['current_board'] ?? 1}',
                                  ),
                                  MetaPill(
                                    icon: Icons.gavel_rounded,
                                    text: m['umpire_name']?.toString() ?? 'No Umpire',
                                    color: m['umpire_name'] == null
                                        ? AppTheme.warning
                                        : null,
                                  ),
                                  if (dateStr != null)
                                    MetaPill(
                                      icon: Icons.schedule_rounded,
                                      text: dateStr,
                                    ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: isUmpireOnly
          ? null
          : FloatingActionButton.extended(
              onPressed: _createMatchDialog,
              icon: const Icon(Icons.add_rounded),
              label: const Text('New Match'),
            ),
    );
  }
}

class _FilterCapsule extends StatelessWidget {
  final String label;
  final IconData? icon;
  final bool selected;
  final Color activeColor;
  final VoidCallback onTap;

  const _FilterCapsule({
    required this.label,
    this.icon,
    required this.selected,
    this.activeColor = AppTheme.emerald,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final dark = AppTheme.isDark(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? activeColor
              : (dark ? AppTheme.darkCard : Colors.white),
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: selected ? activeColor : AppTheme.border(context),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 14,
                color: selected
                    ? (dark ? const Color(0xFF022015) : Colors.white)
                    : AppTheme.mutedText(context),
              ),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                color: selected
                    ? (dark ? const Color(0xFF022015) : Colors.white)
                    : AppTheme.mutedText(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
