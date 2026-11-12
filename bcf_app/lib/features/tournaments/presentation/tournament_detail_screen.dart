import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../matches/presentation/referee_console_screen.dart';

class TournamentDetailScreen extends ConsumerStatefulWidget {
  final int tournamentId;

  const TournamentDetailScreen({super.key, required this.tournamentId});

  @override
  ConsumerState<TournamentDetailScreen> createState() =>
      _TournamentDetailScreenState();
}

class _TournamentDetailScreenState
    extends ConsumerState<TournamentDetailScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _tournament = {};
  List<Map<String, dynamic>> _participants = [];
  List<Map<String, dynamic>> _matches = [];
  List<Map<String, dynamic>> _allPlayers = [];
  List<Map<String, dynamic>> _umpires = [];
  List<String> _gallery = [];

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final dio = ref.read(apiClientProvider).dio;
      final isUmpireOnly = ref.read(authProvider).user?.isUmpireOnly == true;
      final res = await Future.wait([
        dio.get(
          ApiEndpoints.tournamentById(widget.tournamentId),
          queryParameters: {'include_unpublished': 'true'},
        ),
        dio.get(
          ApiEndpoints.matches,
          queryParameters: {
            'include_unpublished': 'true',
            'tournament_id': widget.tournamentId,
          },
        ),
        if (!isUmpireOnly) dio.get(ApiEndpoints.umpires),
      ]);

      final tBody = res[0].data;
      final tData = (tBody is Map && tBody['data'] is Map)
          ? Map<String, dynamic>.from(tBody['data'] as Map)
          : <String, dynamic>{};

      List<String> galleryUrls = [];
      final rawGal = tData['gallery_images'];
      if (rawGal is List) {
        galleryUrls = rawGal.map((e) => e.toString()).toList();
      } else if (rawGal is String && rawGal.trim().startsWith('[')) {
        try {
          galleryUrls = (jsonDecode(rawGal) as List)
              .map((e) => e.toString())
              .toList();
        } catch (_) {}
      }

      setState(() {
        _tournament = tData;
        _participants = (tData['participants'] is List)
            ? (tData['participants'] as List)
                .whereType<Map<String, dynamic>>()
                .toList()
            : [];
        _matches = extractDataList(res[1].data);
        _umpires = !isUmpireOnly && res.length > 2
            ? extractDataList(res[2].data)
            : [];
        _gallery = galleryUrls;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _generateFixtures() async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Generate Fixtures',
      message:
          'Generate ${_tournament['format'] ?? 'Knockout'} bracket from ${_participants.length} registered participants? Existing matches will be replaced.',
      confirmLabel: 'Generate',
    );
    if (!confirmed) return;

    try {
      await ref.read(apiClientProvider).dio.post(
        ApiEndpoints.tournamentGenerateFixtures(widget.tournamentId),
        data: {
          'format': _tournament['format'] ?? 'Knockout',
          'seeding_type': _tournament['seeding_type'] ?? 'Seeded',
        },
      );
      if (mounted) {
        showAppSnack(context, 'Fixtures generated successfully.');
        _load();
      }
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    }
  }

  Future<void> _openAddParticipants() async {
    try {
      if (_allPlayers.isEmpty) {
        final res = await ref.read(apiClientProvider).dio.get(ApiEndpoints.players);
        _allPlayers = extractDataList(res.data);
      }
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
      return;
    }
    if (!mounted) return;

    final existingIds = _participants.map((p) => parseInt(p['player_id'])).toSet();
    final selected = <int>{};
    String query = '';

    await showAppModalSheet(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final available = _allPlayers.where((p) {
              final pid = parseInt(p['id']);
              if (existingIds.contains(pid)) return false;
              if (query.isEmpty) return true;
              final name = (p['full_name'] ?? '').toString().toLowerCase();
              return name.contains(query.toLowerCase());
            }).toList();

            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Add Players (${selected.length})',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      ElevatedButton(
                        onPressed: selected.isEmpty
                            ? null
                            : () async {
                                try {
                                  await ref.read(apiClientProvider).dio.post(
                                    ApiEndpoints.tournamentParticipants(
                                      widget.tournamentId,
                                    ),
                                    data: {'player_ids': selected.toList()},
                                  );
                                  if (ctx.mounted) Navigator.of(ctx).pop();
                                  _load();
                                } catch (e) {
                                  if (ctx.mounted) {
                                    showAppSnack(
                                      ctx,
                                      ApiClient.extractErrorMessage(e),
                                      isError: true,
                                    );
                                  }
                                }
                              },
                        child: const Text('Add Selected'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    decoration: const InputDecoration(
                      hintText: 'Filter players...',
                      prefixIcon: Icon(Icons.search_rounded),
                    ),
                    onChanged: (v) => setModalState(() => query = v),
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: ListView.builder(
                      itemCount: available.length,
                      itemBuilder: (_, i) {
                        final p = available[i];
                        final pid = parseInt(p['id']);
                        return CheckboxListTile(
                          value: selected.contains(pid),
                          onChanged: (v) {
                            setModalState(() {
                              if (v == true) {
                                selected.add(pid);
                              } else {
                                selected.remove(pid);
                              }
                            });
                          },
                          title: Text(p['full_name']?.toString() ?? 'Player'),
                          subtitle: Text(
                            '${p['player_id'] ?? ''} • ${p['club_name'] ?? 'Independent'}',
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _removeParticipant(Map<String, dynamic> p) async {
    try {
      await ref.read(apiClientProvider).dio.delete(
        ApiEndpoints.tournamentParticipant(
          widget.tournamentId,
          parseInt(p['player_id']),
        ),
      );
      if (mounted) {
        showAppSnack(context, 'Player removed from roster.');
        _load();
      }
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    }
  }

  Future<void> _uploadGalleryImages() async {
    final picker = ImagePicker();
    final files = await picker.pickMultiImage(imageQuality: 80, maxWidth: 1600);
    if (files.isEmpty) return;

    final encoded = <String>[];
    for (final f in files) {
      final bytes = await f.readAsBytes();
      final ext = f.name.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
      encoded.add('data:image/$ext;base64,${base64Encode(bytes)}');
    }

    try {
      await ref.read(apiClientProvider).dio.post(
        ApiEndpoints.tournamentGallery(widget.tournamentId),
        data: {'images': encoded, 'replace_all': false},
      );
      if (mounted) {
        showAppSnack(context, '${encoded.length} image(s) uploaded.');
        _load();
      }
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    }
  }

  Future<void> _removeGalleryImage(String url) async {
    final updated = _gallery.where((g) => g != url).toList();
    try {
      await ref.read(apiClientProvider).dio.post(
        ApiEndpoints.tournamentGallery(widget.tournamentId),
        data: {'images': updated, 'replace_all': true},
      );
      if (mounted) {
        showAppSnack(context, 'Image removed.');
        _load();
      }
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    }
  }

  Future<void> _assignMatchUmpire(Map<String, dynamic> match) async {
    final chosen = await showAppModalSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: false,
      builder: (ctx) => ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Assign Match Umpire',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          ..._umpires.map(
            (u) => ListTile(
              leading: AppAvatar(url: u['photo_url']?.toString(), name: u['name']?.toString() ?? 'U'),
              title: Text(u['name']?.toString() ?? ''),
              subtitle: Text('${u['umpire_id'] ?? ''} • ${u['grade'] ?? ''}'),
              onTap: () => Navigator.of(ctx).pop(u),
            ),
          ),
        ],
      ),
    );
    if (chosen == null) return;

    try {
      await ref.read(apiClientProvider).dio.put(
        ApiEndpoints.matchScore(parseInt(match['id'])),
        data: {
          'umpire_id': parseInt(chosen['id']),
          'umpire_name': chosen['name'],
        },
      );
      if (mounted) {
        showAppSnack(context, 'Umpire assigned.');
        _load();
      }
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isUmpireOnly = ref.watch(authProvider).user?.isUmpireOnly == true;
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            _tournament['title']?.toString() ?? 'Tournament Detail',
            overflow: TextOverflow.ellipsis,
          ),
          actions: isUmpireOnly
              ? const [
                  Padding(
                    padding: EdgeInsets.only(right: 12),
                    child: Center(
                      child: StatusBadge(label: 'Preview Only'),
                    ),
                  ),
                ]
              : null,
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(icon: Icon(Icons.info_outline_rounded), text: 'Overview'),
              Tab(icon: Icon(Icons.account_tree_rounded), text: 'Fixtures'),
              Tab(icon: Icon(Icons.groups_rounded), text: 'Roster'),
              Tab(icon: Icon(Icons.photo_library_outlined), text: 'Gallery'),
            ],
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? ErrorStateView(message: _error!, onRetry: _load)
            : TabBarView(
                children: [
                  _buildOverviewTab(),
                  _buildFixturesTab(isUmpireOnly: isUmpireOnly),
                  _buildRosterTab(isUmpireOnly: isUmpireOnly),
                  _buildGalleryTab(isUmpireOnly: isUmpireOnly),
                ],
              ),
      ),
    );
  }

  Widget _buildOverviewTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _tournament['tournament_code']?.toString() ?? '',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w800,
                        color: AppTheme.emerald,
                      ),
                    ),
                    StatusBadge(
                      label: _tournament['status']?.toString() ?? 'Upcoming',
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  _tournament['title']?.toString() ?? '',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 10),
                _MetaRow(label: 'Venue', value: _tournament['venue']?.toString() ?? '-'),
                _MetaRow(label: 'Category', value: _tournament['category']?.toString() ?? '-'),
                _MetaRow(label: 'Format', value: '${_tournament['format'] ?? 'Knockout'} (${_tournament['seeding_type'] ?? 'Seeded'})'),
                _MetaRow(label: 'Boards / Points', value: '${_tournament['board_limit'] ?? 8} boards / ${_tournament['points_limit'] ?? 25} points'),
                _MetaRow(label: 'Prize Pool', value: _tournament['prize_pool']?.toString() ?? '-'),
                _MetaRow(label: 'Dates', value: '${_tournament['start_date']?.toString().split('T').first ?? ''} to ${_tournament['end_date']?.toString().split('T').first ?? ''}'),
                if ((_tournament['description']?.toString() ?? '').isNotEmpty) ...[
                  const Divider(height: 24),
                  Text(_tournament['description'].toString()),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFixturesTab({bool isUmpireOnly = false}) {
    return Column(
      children: [
        if (!isUmpireOnly)
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _generateFixtures,
                    icon: const Icon(Icons.auto_fix_high_rounded, size: 18),
                    label: const Text('Generate Fixtures'),
                  ),
                ),
              ],
            ),
          ),
        Expanded(
          child: _matches.isEmpty
              ? const EmptyStateView(
                  icon: Icons.account_tree_outlined,
                  title: 'No Fixtures Yet',
                  subtitle: 'Tournament draw & matches will appear here once generated.',
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: _matches.length,
                    itemBuilder: (_, i) {
                      final m = _matches[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(
                            '${m['player1_name'] ?? 'TBD'} vs ${m['player2_name'] ?? 'TBD'}',
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                          subtitle: Text(
                            '${m['round_name'] ?? ''} • Score: ${m['player1_score'] ?? 0}-${m['player2_score'] ?? 0}'
                            '${m['umpire_name'] != null ? ' • Umpire: ${m['umpire_name']}' : ''}',
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (!isUmpireOnly)
                                IconButton(
                                  tooltip: 'Assign Umpire',
                                  icon: const Icon(Icons.gavel_rounded, size: 20),
                                  onPressed: () => _assignMatchUmpire(m),
                                ),
                              StatusBadge(
                                label: m['status']?.toString() ?? 'Scheduled',
                              ),
                            ],
                          ),
                          onTap: isUmpireOnly
                              ? null
                              : () async {
                                  await Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => RefereeConsoleScreen(match: m),
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
    );
  }

  Widget _buildRosterTab({bool isUmpireOnly = false}) {
    return Column(
      children: [
        if (!isUmpireOnly)
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _openAddParticipants,
                    icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
                    label: Text('Add Players (${_participants.length} registered)'),
                  ),
                ),
              ],
            ),
          ),
        Expanded(
          child: _participants.isEmpty
              ? const EmptyStateView(
                  icon: Icons.groups_outlined,
                  title: 'Roster Empty',
                  subtitle: 'No players enrolled in this tournament yet.',
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _participants.length,
                  itemBuilder: (_, i) {
                    final p = _participants[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.emerald.withValues(alpha: 0.16),
                          child: Text(
                            '#${p['seed_number'] ?? i + 1}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: AppTheme.emerald,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        title: Text(
                          p['full_name']?.toString() ?? 'Player',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(
                          '${p['district'] ?? ''} • Rating ${p['rating_points'] ?? 1200}',
                        ),
                        trailing: isUmpireOnly
                            ? null
                            : IconButton(
                                icon: const Icon(
                                  Icons.remove_circle_outline_rounded,
                                  color: AppTheme.danger,
                                ),
                                onPressed: () => _removeParticipant(p),
                              ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildGalleryTab({bool isUmpireOnly = false}) {
    return Column(
      children: [
        if (!isUmpireOnly)
          Padding(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _uploadGalleryImages,
                icon: const Icon(Icons.add_photo_alternate_rounded, size: 18),
                label: const Text('Upload Gallery Photos'),
              ),
            ),
          ),
        Expanded(
          child: _gallery.isEmpty
              ? const EmptyStateView(
                  icon: Icons.photo_library_outlined,
                  title: 'No Gallery Photos',
                  subtitle: 'Tournament photos will appear here once uploaded.',
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemCount: _gallery.length,
                  itemBuilder: (_, i) {
                    final url = _gallery[i];
                    return Stack(
                      fit: StackFit.expand,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: CachedNetworkImage(
                            imageUrl: AppConfig.getMediaUrl(url),
                            fit: BoxFit.cover,
                          ),
                        ),
                        if (!isUmpireOnly)
                          Positioned(
                            top: 6,
                            right: 6,
                            child: IconButton.filled(
                              style: IconButton.styleFrom(
                                backgroundColor: Colors.black87,
                                foregroundColor: AppTheme.danger,
                              ),
                              icon: const Icon(Icons.delete_rounded, size: 18),
                              onPressed: () => _removeGalleryImage(url),
                            ),
                          ),
                      ],
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _MetaRow extends StatelessWidget {
  final String label;
  final String value;

  const _MetaRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 115,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

