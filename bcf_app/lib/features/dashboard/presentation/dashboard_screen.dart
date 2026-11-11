import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../matches/presentation/referee_console_screen.dart';

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
        _tournaments = extractDataList(results[2].data).take(4).toList();
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
    final dark = AppTheme.isDark(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }

    final liveCount = parseInt(_stats['live_matches'], _liveMatches.length);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          // Executive Welcome Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: dark
                    ? const [Color(0xFF0E2922), Color(0xFF131C2C)]
                    : const [Color(0xFFECFDF5), Color(0xFFFFFFFF)],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppTheme.emerald.withValues(alpha: dark ? 0.28 : 0.35),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    AppAvatar(
                      url: user?.avatarUrl,
                      name: user?.name ?? 'Admin',
                      size: 52,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'WELCOME BACK',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2,
                              color: AppTheme.emerald,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.name ?? 'Official',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.4,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              StatusBadge(
                                label: user?.role ?? 'Admin',
                                color: AppTheme.emerald,
                              ),
                              if (user?.umpireProfile != null)
                                StatusBadge(
                                  label: user?.umpireProfile?.umpireId ?? 'Umpire',
                                  color: AppTheme.gold,
                                ),
                              const StatusBadge(
                                label: 'Online',
                                color: AppTheme.emerald,
                                showDot: true,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: dark
                        ? Colors.black.withValues(alpha: 0.24)
                        : Colors.white.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border(context)),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.sensors_rounded,
                        size: 18,
                        color: liveCount > 0
                            ? AppTheme.danger
                            : AppTheme.mutedText(context),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          liveCount > 0
                              ? '$liveCount active court${liveCount == 1 ? '' : 's'} streaming live scores'
                              : 'All courts standing by for next fixture',
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      TextButton(
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: () => context.go('/matches'),
                        child: const Text('Courts ->'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 2x2 KPI Bento Grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.48,
            children: [
              _KpiCard(
                label: 'Players',
                subtitle: 'Registered',
                value: '${parseInt(_stats['total_players'])}',
                icon: Icons.people_alt_rounded,
                color: AppTheme.emerald,
                onTap: () => context.go('/players'),
              ),
              _KpiCard(
                label: 'Live Courts',
                subtitle: 'In Progress',
                value: '$liveCount',
                icon: Icons.sensors_rounded,
                color: AppTheme.danger,
                onTap: () => context.go('/matches'),
              ),
              _KpiCard(
                label: 'Tournaments',
                subtitle: 'Scheduled & Active',
                value: '${parseInt(_stats['total_tournaments'])}',
                icon: Icons.emoji_events_rounded,
                color: AppTheme.gold,
                onTap: () => context.go('/tournaments'),
              ),
              _KpiCard(
                label: 'Clubs / Pending',
                subtitle: '$_pendingRegistrations new requests',
                value: '${parseInt(_stats['total_clubs'])}',
                icon: Icons.how_to_reg_rounded,
                color: AppTheme.info,
                onTap: () => context.go('/registrations'),
              ),
            ],
          ),

          const SizedBox(height: 22),

          SectionHeader(
            eyebrow: 'Real-Time Operations',
            title: 'Live & Active Courts',
            trailing: TextButton.icon(
              onPressed: () => context.go('/matches'),
              icon: const Icon(Icons.arrow_forward_rounded, size: 16),
              label: const Text('All Matches'),
            ),
          ),
          const SizedBox(height: 10),

          if (_liveMatches.isEmpty)
            SurfaceCard(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.info.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.sports_esports_outlined,
                      color: AppTheme.info,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'No Live Matches Right Now',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Open Matches to start a court and stream live board scores.',
                          style: TextStyle(fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          else
            ..._liveMatches.take(5).map((m) {
              return SurfaceCard(
                margin: const EdgeInsets.only(bottom: 10),
                accentColor: AppTheme.danger,
                onTap: () async {
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
                        StatusBadge(
                          label: 'Court #${m['board_number'] ?? 1}',
                          color: AppTheme.danger,
                          showDot: true,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '${m['tournament_title'] ?? 'Exhibition'} • ${m['round_name'] ?? ''}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                        Text(
                          'Board #${m['current_board'] ?? 1}',
                          style: AppTheme.tabular(
                            const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.emerald,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            m['player1_name']?.toString() ?? 'TBD',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 10),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.cardElevated(context),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppTheme.border(context)),
                          ),
                          child: Text(
                            '${m['player1_score'] ?? 0} : ${m['player2_score'] ?? 0}',
                            style: AppTheme.tabular(
                              const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            m['player2_name']?.toString() ?? 'TBD',
                            textAlign: TextAlign.right,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),

          const SizedBox(height: 22),

          SectionHeader(
            eyebrow: 'Competitions',
            title: 'Recent Tournaments',
            trailing: TextButton.icon(
              onPressed: () => context.go('/tournaments'),
              icon: const Icon(Icons.arrow_forward_rounded, size: 16),
              label: const Text('Manage'),
            ),
          ),
          const SizedBox(height: 10),

          ..._tournaments.map((t) {
            return SurfaceCard(
              margin: const EdgeInsets.only(bottom: 10),
              onTap: () => context.push('/tournaments/${t['id']}'),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.gold.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppTheme.gold.withValues(alpha: 0.25),
                      ),
                    ),
                    child: const Icon(
                      Icons.emoji_events_rounded,
                      color: AppTheme.gold,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t['title']?.toString() ?? 'Tournament',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${t['venue'] ?? 'BCF Arena'} • ${t['format'] ?? 'Knockout'}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge(
                    label: t['status']?.toString() ?? 'Upcoming',
                  ),
                ],
              ),
            );
          }),

          const SizedBox(height: 22),
          const SectionHeader(
            eyebrow: 'Workspace',
            title: 'Federation Modules',
          ),
          const SizedBox(height: 10),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 1.08,
            children: [
              _ModuleTile(
                label: 'Umpires',
                icon: Icons.gavel_rounded,
                color: AppTheme.gold,
                onTap: () => context.go('/umpires'),
              ),
              _ModuleTile(
                label: 'Clubs',
                icon: Icons.apartment_rounded,
                color: AppTheme.info,
                onTap: () => context.go('/clubs'),
              ),
              _ModuleTile(
                label: 'Registrations',
                icon: Icons.assignment_turned_in_rounded,
                color: AppTheme.emerald,
                badgeCount: _pendingRegistrations,
                onTap: () => context.go('/registrations'),
              ),
              _ModuleTile(
                label: 'News & Blogs',
                icon: Icons.article_rounded,
                color: AppTheme.indigo,
                onTap: () => context.go('/cms/news'),
              ),
              _ModuleTile(
                label: 'Banners',
                icon: Icons.view_carousel_rounded,
                color: AppTheme.emeraldBright,
                onTap: () => context.go('/cms/banners'),
              ),
              _ModuleTile(
                label: 'Notices',
                icon: Icons.campaign_rounded,
                color: AppTheme.warning,
                onTap: () => context.go('/cms/announcements'),
              ),
              _ModuleTile(
                label: 'Committee',
                icon: Icons.groups_rounded,
                color: AppTheme.info,
                onTap: () => context.go('/cms/committee'),
              ),
              _ModuleTile(
                label: 'Users',
                icon: Icons.manage_accounts_rounded,
                color: AppTheme.indigo,
                onTap: () => context.go('/system/users'),
              ),
              _ModuleTile(
                label: 'Settings',
                icon: Icons.tune_rounded,
                color: AppTheme.emerald,
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
  final String subtitle;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _KpiCard({
    required this.label,
    required this.subtitle,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const Spacer(),
              Icon(
                Icons.north_east_rounded,
                size: 15,
                color: AppTheme.mutedText(context),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: AppTheme.tabular(
                  const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                    height: 1.05,
                  ),
                ),
              ),
              const SizedBox(height: 3),
              Text(
                '$label • $subtitle',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.mutedText(context),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ModuleTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final int badgeCount;
  final VoidCallback onTap;

  const _ModuleTile({
    required this.label,
    required this.icon,
    required this.color,
    this.badgeCount = 0,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.all(10),
      onTap: onTap,
      child: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          if (badgeCount > 0)
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.danger,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  '$badgeCount',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
