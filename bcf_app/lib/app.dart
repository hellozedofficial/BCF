import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/config/app_config.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/common_widgets.dart';
import 'features/auth/presentation/auth_provider.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/profile_sheet.dart';
import 'features/clubs/presentation/clubs_screen.dart';
import 'features/cms/presentation/about_committee_screen.dart';
import 'features/cms/presentation/announcements_screen.dart';
import 'features/cms/presentation/banners_screen.dart';
import 'features/cms/presentation/news_screen.dart';
import 'features/dashboard/presentation/dashboard_screen.dart';
import 'features/dashboard/presentation/umpire_dashboard_screen.dart';
import 'features/matches/presentation/matches_screen.dart';
import 'features/players/presentation/players_screen.dart';
import 'features/registrations/presentation/registrations_screen.dart';
import 'features/system/presentation/settings_screen.dart';
import 'features/system/presentation/users_screen.dart';
import 'features/tournaments/presentation/tournament_detail_screen.dart';
import 'features/tournaments/presentation/tournaments_screen.dart';
import 'features/umpires/presentation/umpires_screen.dart';

class BcfAdminApp extends ConsumerStatefulWidget {
  const BcfAdminApp({super.key});

  @override
  ConsumerState<BcfAdminApp> createState() => _BcfAdminAppState();
}

class _BcfAdminAppState extends ConsumerState<BcfAdminApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = GoRouter(
      initialLocation: '/',
      redirect: (context, state) {
        final isUmpireOnly = ref.read(authProvider).user?.isUmpireOnly == true;
        if (!isUmpireOnly) return null;
        final path = state.uri.path;
        final allowed =
            path == '/' ||
            path == '/matches' ||
            path == '/tournaments' ||
            path.startsWith('/tournaments/');
        return allowed ? null : '/';
      },
      routes: [
        GoRoute(
          path: '/tournaments/:id',
          builder: (context, state) {
            final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
            return TournamentDetailScreen(tournamentId: id);
          },
        ),
        ShellRoute(
          builder: (context, state, child) =>
              _AdminShell(location: state.uri.path, child: child),
          routes: [
            GoRoute(
              path: '/',
              builder: (_, _) => Consumer(
                builder: (_, ref, _) =>
                    ref.watch(authProvider).user?.isUmpireOnly == true
                    ? const UmpireDashboardScreen()
                    : const DashboardScreen(),
              ),
            ),
            GoRoute(
              path: '/tournaments',
              builder: (_, _) => const TournamentsScreen(),
            ),
            GoRoute(path: '/matches', builder: (_, _) => const MatchesScreen()),
            GoRoute(path: '/players', builder: (_, _) => const PlayersScreen()),
            GoRoute(path: '/umpires', builder: (_, _) => const UmpiresScreen()),
            GoRoute(path: '/clubs', builder: (_, _) => const ClubsScreen()),
            GoRoute(
              path: '/registrations',
              builder: (_, _) => const RegistrationsScreen(),
            ),
            GoRoute(
              path: '/cms/banners',
              builder: (_, _) => const BannersScreen(),
            ),
            GoRoute(
              path: '/cms/announcements',
              builder: (_, _) => const AnnouncementsScreen(),
            ),
            GoRoute(path: '/cms/news', builder: (_, _) => const NewsScreen()),
            GoRoute(
              path: '/cms/committee',
              builder: (_, _) => const AboutCommitteeScreen(),
            ),
            GoRoute(
              path: '/system/users',
              builder: (_, _) => const UsersScreen(),
            ),
            GoRoute(
              path: '/system/settings',
              builder: (_, _) => const SettingsScreen(),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final themeMode = ref.watch(themeProvider);

    if (auth.initializing) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: themeMode,
        home: const Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    if (!auth.isAuthenticated) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        title: AppConfig.appName,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: themeMode,
        home: const LoginScreen(),
      );
    }

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: AppConfig.appName,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: _router,
    );
  }
}

class _AdminShell extends ConsumerWidget {
  final String location;
  final Widget child;

  const _AdminShell({required this.location, required this.child});

  String _titleForPath(String path, {bool isUmpireOnly = false}) {
    switch (path) {
      case '/':
        return isUmpireOnly ? 'Umpire Dashboard' : 'Command Center';
      case '/tournaments':
        return isUmpireOnly ? 'Tournaments Preview' : 'Tournaments';
      case '/matches':
        return isUmpireOnly ? 'My Assigned Matches' : 'Live Matches & Courts';
      case '/players':
        return 'Players Directory';
      case '/umpires':
        return 'Umpires Registry';
      case '/clubs':
        return 'Clubs & Academies';
      case '/registrations':
        return 'Registrations';
      case '/cms/banners':
        return 'CMS Banners';
      case '/cms/announcements':
        return 'Announcements';
      case '/cms/news':
        return 'News & Blogs';
      case '/cms/committee':
        return 'About & Committee';
      case '/system/users':
        return 'Admin Users';
      case '/system/settings':
        return 'System Settings';
      default:
        return AppConfig.appName;
    }
  }

  int _bottomIndex(String path) {
    if (path == '/') return 0;
    if (path.startsWith('/matches')) return 1;
    if (path.startsWith('/tournaments')) return 2;
    if (path.startsWith('/players')) return 3;
    return -1;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final isUmpireOnly = user?.isUmpireOnly == true;
    final themeMode = ref.watch(themeProvider);
    final isDark = themeMode == ThemeMode.dark;
    final selectedTab = _bottomIndex(location);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: !isUmpireOnly,
        toolbarHeight: 62,
        titleSpacing: isUmpireOnly ? 16 : 4,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'BANGLADESH CARROM FEDERATION',
              style: TextStyle(
                fontSize: 9.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.3,
                color: AppTheme.emerald,
              ),
            ),
            Text(
              _titleForPath(location, isUmpireOnly: isUmpireOnly),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.4,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
            onPressed: () => ref.read(themeProvider.notifier).toggle(),
            icon: Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: AppTheme.cardElevated(context),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.border(context)),
              ),
              child: Icon(
                isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                size: 17,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12, left: 4),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => showProfileSheet(context),
              child: AppAvatar(
                url: user?.avatarUrl,
                name: user?.name ?? 'A',
                size: 36,
              ),
            ),
          ),
        ],
      ),
      drawer: isUmpireOnly
          ? null
          : Drawer(
        backgroundColor: AppTheme.surface(context),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isDark
                          ? const [Color(0xFF102A24), Color(0xFF121A28)]
                          : const [Color(0xFFECFDF5), Color(0xFFF8FAFC)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppTheme.emerald.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Row(
                    children: [
                      AppAvatar(
                        url: user?.avatarUrl,
                        name: user?.name ?? 'A',
                        size: 46,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              AppConfig.appName,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              user?.name ?? 'Official',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.mutedText(context),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 6,
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
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  children: [
                    _DrawerNavTile(
                      icon: Icons.dashboard_rounded,
                      label: 'Command Center',
                      selected: location == '/',
                      onTap: () => _nav(context, '/'),
                    ),
                    const _DrawerSectionLabel('COMPETITION & REGISTRY'),
                    _DrawerNavTile(
                      icon: Icons.emoji_events_rounded,
                      label: 'Tournaments',
                      selected: location == '/tournaments',
                      onTap: () => _nav(context, '/tournaments'),
                    ),
                    _DrawerNavTile(
                      icon: Icons.sports_esports_rounded,
                      label: 'Live Matches & Courts',
                      selected: location == '/matches',
                      onTap: () => _nav(context, '/matches'),
                    ),
                    _DrawerNavTile(
                      icon: Icons.people_alt_rounded,
                      label: 'Players Directory',
                      selected: location == '/players',
                      onTap: () => _nav(context, '/players'),
                    ),
                    _DrawerNavTile(
                      icon: Icons.gavel_rounded,
                      label: 'Umpires Registry',
                      selected: location == '/umpires',
                      onTap: () => _nav(context, '/umpires'),
                    ),
                    _DrawerNavTile(
                      icon: Icons.apartment_rounded,
                      label: 'Clubs & Academies',
                      selected: location == '/clubs',
                      onTap: () => _nav(context, '/clubs'),
                    ),
                    _DrawerNavTile(
                      icon: Icons.how_to_reg_rounded,
                      label: 'Registrations',
                      selected: location == '/registrations',
                      onTap: () => _nav(context, '/registrations'),
                    ),
                    const _DrawerSectionLabel('CONTENT MANAGEMENT'),
                    _DrawerNavTile(
                      icon: Icons.view_carousel_rounded,
                      label: 'Hero Banners',
                      selected: location == '/cms/banners',
                      onTap: () => _nav(context, '/cms/banners'),
                    ),
                    _DrawerNavTile(
                      icon: Icons.campaign_rounded,
                      label: 'Announcements',
                      selected: location == '/cms/announcements',
                      onTap: () => _nav(context, '/cms/announcements'),
                    ),
                    _DrawerNavTile(
                      icon: Icons.article_rounded,
                      label: 'News & Blogs',
                      selected: location == '/cms/news',
                      onTap: () => _nav(context, '/cms/news'),
                    ),
                    _DrawerNavTile(
                      icon: Icons.groups_rounded,
                      label: 'About & Committee',
                      selected: location == '/cms/committee',
                      onTap: () => _nav(context, '/cms/committee'),
                    ),
                    const _DrawerSectionLabel('SYSTEM & ACCESS'),
                    _DrawerNavTile(
                      icon: Icons.manage_accounts_rounded,
                      label: 'Admin Users',
                      selected: location == '/system/users',
                      onTap: () => _nav(context, '/system/users'),
                    ),
                    _DrawerNavTile(
                      icon: Icons.tune_rounded,
                      label: 'Settings & Storage',
                      selected: location == '/system/settings',
                      onTap: () => _nav(context, '/system/settings'),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: AppTheme.border(context))),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.of(context).pop();
                          showProfileSheet(context);
                        },
                        icon: const Icon(Icons.person_outline_rounded, size: 17),
                        label: const Text('Account'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.danger,
                          side: BorderSide(
                            color: AppTheme.danger.withValues(alpha: 0.35),
                          ),
                        ),
                        onPressed: () {
                          Navigator.of(context).pop();
                          ref.read(authProvider.notifier).logout();
                        },
                        icon: const Icon(Icons.logout_rounded, size: 17),
                        label: const Text('Sign Out'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      body: child,
      bottomNavigationBar: _ModernBottomDock(
        selectedIndex: selectedTab,
        isUmpireOnly: isUmpireOnly,
        onTap: (idx) {
          switch (idx) {
            case 0:
              context.go('/');
              break;
            case 1:
              context.go('/matches');
              break;
            case 2:
              context.go('/tournaments');
              break;
            case 3:
              if (!isUmpireOnly) context.go('/players');
              break;
          }
        },
        onOpenMore: (ctx) {
          if (!isUmpireOnly) Scaffold.of(ctx).openDrawer();
        },
      ),
    );
  }

  void _nav(BuildContext context, String route) {
    Navigator.of(context).pop();
    context.go(route);
  }
}

class _ModernBottomDock extends StatelessWidget {
  final int selectedIndex;
  final bool isUmpireOnly;
  final ValueChanged<int> onTap;
  final ValueChanged<BuildContext> onOpenMore;

  const _ModernBottomDock({
    required this.selectedIndex,
    this.isUmpireOnly = false,
    required this.onTap,
    required this.onOpenMore,
  });

  @override
  Widget build(BuildContext context) {
    final items = isUmpireOnly
        ? const [
            (Icons.calendar_month_outlined, Icons.calendar_month_rounded, 'Dashboard'),
            (Icons.sports_esports_outlined, Icons.sports_esports_rounded, 'Matches'),
            (Icons.emoji_events_outlined, Icons.emoji_events_rounded, 'Events'),
          ]
        : const [
            (Icons.dashboard_outlined, Icons.dashboard_rounded, 'Home'),
            (Icons.sports_esports_outlined, Icons.sports_esports_rounded, 'Matches'),
            (Icons.emoji_events_outlined, Icons.emoji_events_rounded, 'Events'),
            (Icons.people_outline_rounded, Icons.people_rounded, 'Players'),
          ];

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface(context),
        border: Border(top: BorderSide(color: AppTheme.border(context))),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Row(
            children: [
              for (int i = 0; i < items.length; i++)
                Expanded(
                  child: _DockItem(
                    icon: items[i].$1,
                    activeIcon: items[i].$2,
                    label: items[i].$3,
                    selected: selectedIndex == i,
                    onTap: () => onTap(i),
                  ),
                ),
              if (!isUmpireOnly)
                Expanded(
                  child: Builder(
                    builder: (ctx) => _DockItem(
                      icon: Icons.grid_view_outlined,
                      activeIcon: Icons.grid_view_rounded,
                      label: 'Modules',
                      selected: selectedIndex == -1,
                      onTap: () => onOpenMore(ctx),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DockItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _DockItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = Theme.of(context).colorScheme.primary;
    final muted = AppTheme.mutedText(context);

    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            decoration: BoxDecoration(
              color: selected
                  ? activeColor.withValues(alpha: 0.15)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Icon(
              selected ? activeIcon : icon,
              size: 21,
              color: selected ? activeColor : muted,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 11,
              fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              color: selected ? activeColor : muted,
            ),
          ),
        ],
      ),
    );
  }
}

class _DrawerSectionLabel extends StatelessWidget {
  final String text;
  const _DrawerSectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 16, 12, 6),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.1,
          color: AppTheme.mutedText(context),
        ),
      ),
    );
  }
}

class _DrawerNavTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _DrawerNavTile({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: ListTile(
        dense: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        selected: selected,
        selectedTileColor: primary.withValues(alpha: 0.14),
        selectedColor: primary,
        leading: Icon(
          icon,
          size: 19,
          color: selected ? primary : AppTheme.mutedText(context),
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 13.5,
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
        trailing: selected
            ? Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(color: primary, shape: BoxShape.circle),
              )
            : null,
        onTap: onTap,
      ),
    );
  }
}
