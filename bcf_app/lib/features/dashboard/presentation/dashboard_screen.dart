import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _stats = {};
  List<Map<String, dynamic>> _liveMatches = [];
  List<Map<String, dynamic>> _tournaments = [];
  int _pendingRegistrations = 0;

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
      final results = await Future.wait([
        dio.get(ApiEndpoints.stats),
        dio.get(ApiEndpoints.matches, queryParameters: {'status': 'Live'}),
        dio.get(
          ApiEndpoints.tournaments,
          queryParameters: {'include_unpublished': 'true'},
        ),
      ]);

      int pendingCount = 0;
      try {
        final regRes = await dio.get(
          ApiEndpoints.playerRegister,
          queryParameters: {'status': 'Pending'},
        );
        pendingCount = extractDataList(regRes.data).length;
      } catch (_) {}

      final statsBody = results[0].data;
      setState(() {
        _stats = (statsBody is Map && statsBody['data'] is Map)
            ? Map<String, dynamic>.from(statsBody['data'] as Map)
            : {};
        _liveMatches = extractDataList(results[1].data);
        _tournaments = extractDataList(results[2].data).take(5).toList();
        _pendingRegistrations = pendingCount;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  AppAvatar(
                    url: user?.avatarUrl,
                    name: user?.name ?? 'Admin',
                    size: 48,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome, ${user?.name ?? 'Official'}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.umpireProfile != null
                              ? 'Role: ${user?.role} | Umpire: ${user?.umpireProfile?.umpireId ?? ''}'
                              : 'Role: ${user?.role ?? 'Admin'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const StatusBadge(label: 'Online', color: AppTheme.emerald),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.65,
            children: [
              _KpiCard(
                label: 'Players',
                value: '${parseInt(_stats['total_players'])}',
                icon: Icons.people_alt_rounded,
                color: AppTheme.emerald,
                onTap: () => context.go('/players'),
              ),
              _KpiCard(
                label: 'Live Matches',
                value: '${parseInt(_stats['live_matches'], _liveMatches.length)}',
                icon: Icons.sensors_rounded,
                color: AppTheme.danger,
                onTap: () => context.go('/matches'),
              ),
              _KpiCard(
                label: 'Tournaments',
                value: '${parseInt(_stats['total_tournaments'])}',
                icon: Icons.emoji_events_rounded,
                color: AppTheme.warning,
                onTap: () => context.go('/tournaments'),
              ),
              _KpiCard(
                label: 'Clubs & Pending',
                value: '${parseInt(_stats['total_clubs'])} / $_pendingRegistrations',
                icon: Icons.how_to_reg_rounded,
                color: AppTheme.info,
                onTap: () => context.go('/registrations'),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Live & Active Courts',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              TextButton.icon(
                onPressed: () => context.go('/matches'),
                icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                label: const Text('All Matches'),
              ),
            ],
          ),
          if (_liveMatches.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.sports_esports_outlined, color: AppTheme.info),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'No matches are currently live. Open Matches to start a court.',
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ..._liveMatches.take(5).map((m) {
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.danger.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.live_tv_rounded,
                      color: AppTheme.danger,
                    ),
                  ),
                  title: Text(
                    '${m['player1_name'] ?? 'TBD'} vs ${m['player2_name'] ?? 'TBD'}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    '${m['tournament_title'] ?? 'Exhibition'} • Board #${m['current_board'] ?? 1} • Score ${m['player1_score'] ?? 0}-${m['player2_score'] ?? 0}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => context.go('/matches'),
                ),
              );
            }),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Tournaments',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              TextButton.icon(
                onPressed: () => context.go('/tournaments'),
                icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                label: const Text('Manage'),
              ),
            ],
          ),
          ..._tournaments.map((t) {
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const Icon(
                  Icons.emoji_events_rounded,
                  color: AppTheme.warning,
                ),
                title: Text(
                  t['title']?.toString() ?? 'Tournament',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text(
                  '${t['venue'] ?? ''} • ${t['format'] ?? 'Knockout'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: StatusBadge(
                  label: t['status']?.toString() ?? 'Upcoming',
                ),
                onTap: () => context.push('/tournaments/${t['id']}'),
              ),
            );
          }),
          const SizedBox(height: 18),
          Text(
            'Quick Modules',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _QuickActionChip(
                label: 'Umpires',
                icon: Icons.gavel_rounded,
                onTap: () => context.go('/umpires'),
              ),
              _QuickActionChip(
                label: 'Clubs',
                icon: Icons.apartment_rounded,
                onTap: () => context.go('/clubs'),
              ),
              _QuickActionChip(
                label: 'Registrations',
                icon: Icons.assignment_turned_in_rounded,
                onTap: () => context.go('/registrations'),
              ),
              _QuickActionChip(
                label: 'News & Blogs',
                icon: Icons.article_rounded,
                onTap: () => context.go('/cms/news'),
              ),
              _QuickActionChip(
                label: 'Banners',
                icon: Icons.view_carousel_rounded,
                onTap: () => context.go('/cms/banners'),
              ),
              _QuickActionChip(
                label: 'Announcements',
                icon: Icons.campaign_rounded,
                onTap: () => context.go('/cms/announcements'),
              ),
              _QuickActionChip(
                label: 'About & Committee',
                icon: Icons.groups_rounded,
                onTap: () => context.go('/cms/committee'),
              ),
              _QuickActionChip(
                label: 'Users',
                icon: Icons.manage_accounts_rounded,
                onTap: () => context.go('/system/users'),
              ),
              _QuickActionChip(
                label: 'Settings',
                icon: Icons.tune_rounded,
                onTap: () => context.go('/system/settings'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _KpiCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    label,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Icon(icon, color: color, size: 20),
                ],
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickActionChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _QuickActionChip({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 17, color: AppTheme.emerald),
      label: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
      onPressed: onTap,
    );
  }
}

