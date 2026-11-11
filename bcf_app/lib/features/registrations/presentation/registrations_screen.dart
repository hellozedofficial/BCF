import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class RegistrationsScreen extends ConsumerStatefulWidget {
  const RegistrationsScreen({super.key});

  @override
  ConsumerState<RegistrationsScreen> createState() =>
      _RegistrationsScreenState();
}

class _RegistrationsScreenState extends ConsumerState<RegistrationsScreen> {
  final _searchCtrl = TextEditingController();
  bool _loading = true;
  String? _error;
  String _statusFilter = 'All';
  List<Map<String, dynamic>> _playerRegs = [];
  List<Map<String, dynamic>> _eventRegs = [];

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
      final results = await Future.wait([
        dio.get(
          ApiEndpoints.playerRegister,
          queryParameters: {
            if (_statusFilter != 'All') 'status': _statusFilter,
            if (_searchCtrl.text.trim().isNotEmpty)
              'search': _searchCtrl.text.trim(),
          },
        ),
        dio.get(ApiEndpoints.legacyRegistrations),
      ]);
      setState(() {
        _playerRegs = extractDataList(results[0].data);
        _eventRegs = extractDataList(results[1].data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _updatePlayerRegStatus(int id, String status) async {
    try {
      await ref.read(apiClientProvider).dio.put(
        ApiEndpoints.playerRegisterStatus(id),
        data: {'status': status},
      );
      if (mounted) {
        showAppSnack(context, 'Application $status.');
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _deletePlayerReg(int id) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Delete Application',
      message: 'Remove this player application permanently?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok) return;
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.playerRegisterById(id));
      if (mounted) {
        showAppSnack(context, 'Application deleted.');
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _updateEventRegStatus(int id, String status) async {
    try {
      await ref.read(apiClientProvider).dio.put(
        ApiEndpoints.legacyRegistrationStatus(id),
        data: {'status': status},
      );
      if (mounted) {
        showAppSnack(context, 'Registration marked $status.');
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  void _openImageZoom(String label, String url) {
    final resolved = AppConfig.getMediaUrl(url);
    showDialog(
      context: context,
      builder: (_) => Dialog.fullscreen(
        child: Scaffold(
          appBar: AppBar(title: Text(label)),
          body: InteractiveViewer(
            minScale: 0.8,
            maxScale: 4,
            child: Center(
              child: CachedNetworkImage(
                imageUrl: resolved,
                fit: BoxFit.contain,
                errorWidget: (_, _, _) => const Text('Could not load document'),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _inspectPlayerApplication(Map<String, dynamic> r) {
    final id = parseInt(r['id']);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  AppAvatar(
                    url: r['photo_url']?.toString(),
                    name: r['full_name']?.toString() ?? 'P',
                    size: 54,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          r['full_name']?.toString() ?? '',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          '${r['player_id'] ?? ''} • NID: ${r['nid_number'] ?? '-'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  StatusBadge(label: r['status']?.toString() ?? 'Pending'),
                ],
              ),
              const Divider(height: 22),
              Text('Email: ${r['email'] ?? '-'}'),
              Text('Phone: ${r['phone'] ?? '-'}'),
              Text('District: ${r['district_name'] ?? '-'}'),
              Text('DOB: ${(r['dob']?.toString() ?? '').split('T').first}'),
              Text('Gender: ${r['gender'] ?? '-'}'),
              const SizedBox(height: 14),
              const Text(
                'Verification Documents (Tap to Zoom)',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if ((r['photo_url']?.toString() ?? '').isNotEmpty)
                    OutlinedButton.icon(
                      onPressed: () =>
                          _openImageZoom('Photo', r['photo_url'].toString()),
                      icon: const Icon(Icons.portrait_rounded, size: 18),
                      label: const Text('Photo'),
                    ),
                  if ((r['nid_front_url']?.toString() ?? '').isNotEmpty)
                    OutlinedButton.icon(
                      onPressed: () => _openImageZoom(
                        'NID Front',
                        r['nid_front_url'].toString(),
                      ),
                      icon: const Icon(Icons.badge_outlined, size: 18),
                      label: const Text('NID Front'),
                    ),
                  if ((r['nid_back_url']?.toString() ?? '').isNotEmpty)
                    OutlinedButton.icon(
                      onPressed: () => _openImageZoom(
                        'NID Back',
                        r['nid_back_url'].toString(),
                      ),
                      icon: const Icon(Icons.credit_card_rounded, size: 18),
                      label: const Text('NID Back'),
                    ),
                ],
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.danger,
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        _updatePlayerRegStatus(id, 'Rejected');
                      },
                      icon: const Icon(Icons.cancel_outlined, size: 18),
                      label: const Text('Reject'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        _updatePlayerRegStatus(id, 'Approved');
                      },
                      icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                      label: const Text('Approve'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          const TabBar(
            tabs: [
              Tab(text: 'Player Applications'),
              Tab(text: 'Event Registrations'),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: AppSearchBar(
              controller: _searchCtrl,
              hint: 'Search name, email, NID or phone...',
              onChanged: (_) => _load(),
            ),
          ),
          FilterPillStrip(
            items: const ['All', 'Pending', 'Approved', 'Rejected'],
            selected: _statusFilter,
            onSelected: (s) {
              setState(() => _statusFilter = s);
              _load();
            },
          ),
          const SizedBox(height: 6),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? ErrorStateView(message: _error!, onRetry: _load)
                : TabBarView(
                    children: [
                      _buildPlayerRegsTab(),
                      _buildEventRegsTab(),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlayerRegsTab() {
    if (_playerRegs.isEmpty) {
      return const EmptyStateView(
        icon: Icons.how_to_reg_outlined,
        title: 'No Player Applications',
        subtitle: 'New online player registrations appear here.',
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        itemCount: _playerRegs.length,
        itemBuilder: (_, i) {
          final r = _playerRegs[i];
          return SurfaceCard(
            margin: const EdgeInsets.only(bottom: 10),
            onTap: () => _inspectPlayerApplication(r),
            child: Row(
              children: [
                AppAvatar(
                  url: r['photo_url']?.toString(),
                  name: r['full_name']?.toString() ?? 'P',
                  size: 46,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              r['full_name']?.toString() ?? '',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          StatusBadge(label: r['status']?.toString() ?? 'Pending'),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          if ((r['player_id']?.toString() ?? '').isNotEmpty)
                            MetaPill(
                              icon: Icons.badge_outlined,
                              text: r['player_id'].toString(),
                            ),
                          if ((r['district_name']?.toString() ?? '').isNotEmpty)
                            MetaPill(
                              icon: Icons.location_on_outlined,
                              text: r['district_name'].toString(),
                            ),
                          if ((r['phone']?.toString() ?? '').isNotEmpty)
                            MetaPill(
                              icon: Icons.phone_outlined,
                              text: r['phone'].toString(),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.delete_outline_rounded,
                    color: AppTheme.danger,
                    size: 20,
                  ),
                  onPressed: () => _deletePlayerReg(parseInt(r['id'])),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildEventRegsTab() {
    final filtered = _eventRegs.where((e) {
      if (_statusFilter != 'All' && e['status'] != _statusFilter) return false;
      final q = _searchCtrl.text.trim().toLowerCase();
      if (q.isEmpty) return true;
      return '${e['full_name']} ${e['email']} ${e['tournament_title']}'
          .toLowerCase()
          .contains(q);
    }).toList();

    if (filtered.isEmpty) {
      return const EmptyStateView(
        icon: Icons.event_available_outlined,
        title: 'No Event Registrations',
        subtitle: 'Tournament entries appear here.',
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        itemCount: filtered.length,
        itemBuilder: (_, i) {
          final e = filtered[i];
          final id = parseInt(e['id']);
          return SurfaceCard(
            margin: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        e['full_name']?.toString() ?? '',
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          MetaPill(
                            icon: Icons.emoji_events_outlined,
                            text: e['tournament_title']?.toString() ?? 'General',
                          ),
                          if ((e['district']?.toString() ?? '').isNotEmpty)
                            MetaPill(
                              icon: Icons.location_on_outlined,
                              text: e['district'].toString(),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (v) => _updateEventRegStatus(id, v),
                  child: StatusBadge(label: e['status']?.toString() ?? 'Pending'),
                  itemBuilder: (_) => const [
                    PopupMenuItem(value: 'Approved', child: Text('Approve')),
                    PopupMenuItem(value: 'Rejected', child: Text('Reject')),
                    PopupMenuItem(value: 'Pending', child: Text('Set Pending')),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

