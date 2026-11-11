import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
  String _statusFilter = 'All';
  int? _tournamentFilter;
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
      final res = await Future.wait([
        dio.get(
          ApiEndpoints.matches,
          queryParameters: {
            'include_unpublished': 'true',
            if (_statusFilter != 'All') 'status': _statusFilter,
            if (_tournamentFilter != null) 'tournament_id': _tournamentFilter,
          },
        ),
        dio.get(
          ApiEndpoints.tournaments,
          queryParameters: {'include_unpublished': 'true'},
        ),
        dio.get(ApiEndpoints.players),
        dio.get(ApiEndpoints.umpires),
      ]);

      setState(() {
        _matches = extractDataList(res[0].data);
        _tournaments = extractDataList(res[1].data);
        _players = extractDataList(res[2].data);
        _umpires = extractDataList(res[3].data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _bulkAssignUmpire() async {
    if (_selectedIds.isEmpty) return;
    final chosen = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
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
              leading: AppAvatar(url: u['photo_url']?.toString(), name: u['name']?.toString() ?? 'U'),
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
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _createMatchDialog() async {
    int? p1;
    int? p2;
    int? tid;
    int? uid;
    String roundName = 'Exhibition Match';
    String streamUrl = '';

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
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
                  value: p1,
                  decoration: const InputDecoration(labelText: 'Player 1'),
                  items: _players
                      .map(
                        (p) => DropdownMenuItem(
                          value: parseInt(p['id']),
                          child: Text(p['full_name']?.toString() ?? ''),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setModalState(() => p1 = v),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int?>(
                  value: p2,
                  decoration: const InputDecoration(labelText: 'Player 2'),
                  items: _players
                      .map(
                        (p) => DropdownMenuItem(
                          value: parseInt(p['id']),
                          child: Text(p['full_name']?.toString() ?? ''),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setModalState(() => p2 = v),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int?>(
                  value: tid,
                  decoration: const InputDecoration(labelText: 'Tournament (Optional)'),
                  items: [
                    const DropdownMenuItem<int?>(value: null, child: Text('Standalone')),
                    ..._tournaments.map(
                      (t) => DropdownMenuItem(
                        value: parseInt(t['id']),
                        child: Text(t['title']?.toString() ?? ''),
                      ),
                    ),
                  ],
                  onChanged: (v) => setModalState(() => tid = v),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int?>(
                  value: uid,
                  decoration: const InputDecoration(labelText: 'Umpire (Optional)'),
                  items: [
                    const DropdownMenuItem<int?>(value: null, child: Text('None')),
                    ..._umpires.map(
                      (u) => DropdownMenuItem(
                        value: parseInt(u['id']),
                        child: Text(u['name']?.toString() ?? ''),
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

  @override
  Widget build(BuildContext context) {
    final query = _searchCtrl.text.trim().toLowerCase();
    final filtered = _matches.where((m) {
      if (query.isEmpty) return true;
      final hay =
          '${m['player1_name']} ${m['player2_name']} ${m['round_name']} ${m['tournament_title']} ${m['umpire_name']}'
              .toLowerCase();
      return hay.contains(query);
    }).toList();

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: AppSearchBar(
                    controller: _searchCtrl,
                    hint: 'Search player, round, umpire...',
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
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
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              children: ['All', 'Live', 'Scheduled', 'Completed'].map((s) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(s),
                    selected: _statusFilter == s,
                    onSelected: (_) {
                      setState(() => _statusFilter = s);
                      _load();
                    },
                  ),
                );
              }).toList(),
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
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? ErrorStateView(message: _error!, onRetry: _load)
                : filtered.isEmpty
                ? const EmptyStateView(
                    icon: Icons.sports_esports_outlined,
                    title: 'No Matches Found',
                    subtitle: 'Create a match or generate fixtures inside a tournament.',
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 6, 16, 90),
                      itemCount: filtered.length,
                      itemBuilder: (_, i) {
                        final m = filtered[i];
                        final id = parseInt(m['id']);
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: ListTile(
                            leading: _bulkMode
                                ? Checkbox(
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
                                  )
                                : CircleAvatar(
                                    backgroundColor: StatusBadge.resolveColor(
                                      m['status']?.toString() ?? 'Scheduled',
                                    ).withValues(alpha: 0.15),
                                    child: Text(
                                      'C${m['board_number'] ?? 1}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                            title: Text(
                              '${m['player1_name'] ?? 'TBD'} vs ${m['player2_name'] ?? 'TBD'}',
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                            subtitle: Text(
                              '${m['tournament_title'] ?? 'Exhibition'} • ${m['round_name'] ?? ''}\n'
                              'Score: ${m['player1_score'] ?? 0} - ${m['player2_score'] ?? 0} • Board #${m['current_board'] ?? 1}'
                              '${m['umpire_name'] != null ? ' • Umpire: ${m['umpire_name']}' : ''}',
                            ),
                            isThreeLine: true,
                            trailing: StatusBadge(
                              label: m['status']?.toString() ?? 'Scheduled',
                            ),
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
                                        builder: (_) =>
                                            RefereeConsoleScreen(match: m),
                                      ),
                                    );
                                    _load();
                                  },
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createMatchDialog,
        icon: const Icon(Icons.add_rounded),
        label: const Text('New Match'),
      ),
    );
  }
}
