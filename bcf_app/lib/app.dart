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
            GoRoute(path: '/', builder: (_, _) => const DashboardScreen()),
            GoRoute(path: '/tournaments', builder: (_, _) => const TournamentsScreen()),
            GoRoute(path: '/matches', builder: (_, _) => const MatchesScreen()),
            GoRoute(path: '/players', builder: (_, _) => const PlayersScreen()),
            GoRoute(path: '/umpires', builder: (_, _) => const UmpiresScreen()),
            GoRoute(path: '/clubs', builder: (_, _) => const ClubsScreen()),
            GoRoute(path: '/registrations', builder: (_, _) => const RegistrationsScreen()),
            GoRoute(path: '/cms/banners', builder: (_, _) => const BannersScreen()),
            GoRoute(path: '/cms/announcements', builder: (_, _) => const AnnouncementsScreen()),
            GoRoute(path: '/cms/news', builder: (_, _) => const NewsScreen()),
            GoRoute(path: '/cms/committee', builder: (_, _) => const AboutCommitteeScreen()),
            GoRoute(path: '/system/users', builder: (_, _) => const UsersScreen()),
            GoRoute(path: '/system/settings', builder: (_, _) => const SettingsScreen()),
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
        home: const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
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

  String _titleForPath(String path) {
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/tournaments':
        return 'Tournaments';
      case '/matches':
        return 'Live Matches & Courts';
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
        return 'System Users';
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
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _titleForPath(location),
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            tooltip: 'Profile & Password',
            onPressed: () => showProfileSheet(context),
            icon: AppAvatar(
              url: user?.avatarUrl,
              name: user?.name ?? 'A',
              size: 32,
            ),
          ),
          const SizedBox(width: 6),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.symmetric(vertical: 8),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppTheme.emerald.withValues(alpha: 0.16),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.shield_rounded,
                        color: AppTheme.emerald,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            AppConfig.appName,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          Text(
                            '${user?.name ?? ''} • ${user?.role ?? ''}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              _DrawerNavTile(
                icon: Icons.dashboard_rounded,
                label: 'Dashboard',
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
                label: 'Umpires Official Registry',
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
              const _DrawerSectionLabel('CONTENT MANAGEMENT (CMS)'),
              _DrawerNavTile(
                icon: Icons.view_carousel_rounded,
                label: 'Banners',
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
              const _DrawerSectionLabel('SYSTEM'),
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
      ),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _bottomIndex(location),
        onDestinationSelected: (idx) {
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
              context.go('/players');
              break;
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.sports_esports_outlined),
            selectedIcon: Icon(Icons.sports_esports_rounded),
            label: 'Matches',
          ),
          NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            selectedIcon: Icon(Icons.emoji_events_rounded),
            label: 'Tournaments',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline_rounded),
            selectedIcon: Icon(Icons.people_rounded),
            label: 'Players',
          ),
        ],
      ),
    );
  }

  void _nav(BuildContext context, String route) {
    Navigator.of(context).pop();
    context.go(route);
  }
}

class _DrawerSectionLabel extends StatelessWidget {
  final String text;
  const _DrawerSectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      child: Text(
        text,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
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
    return ListTile(
      dense: true,
      selected: selected,
      selectedTileColor: AppTheme.emerald.withValues(alpha: 0.14),
      selectedColor: AppTheme.emerald,
      leading: Icon(icon, size: 20),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
      onTap: onTap,
    );
  }
}

