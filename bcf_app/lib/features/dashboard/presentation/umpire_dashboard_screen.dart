import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../matches/presentation/referee_console_screen.dart';

class UmpireDashboardScreen extends ConsumerStatefulWidget {
  const UmpireDashboardScreen({super.key});

  @override
  ConsumerState<UmpireDashboardScreen> createState() =>
      _UmpireDashboardScreenState();
}

class _UmpireDashboardScreenState extends ConsumerState<UmpireDashboardScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _matches = [];
  List<Map<String, dynamic>> _tournaments = [];
  DateTime _cursorMonth = DateTime(DateTime.now().year, DateTime.now().month);
  String _selectedDateKey = _dateKeyFromDate(DateTime.now());
  bool _showAllUpcoming = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  static String _dateKeyFromDate(DateTime d) {
    final m = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '${d.year}-$m-$day';
  }

  static String _extractDateKey(Map<String, dynamic> match) {
    final raw =
        (match['match_date'] ?? match['scheduled_at'] ?? match['created_at'])
            ?.toString()
            .trim() ??
        '';
    if (raw.isEmpty) return '';
    final parsed = DateTime.tryParse(raw);
    if (parsed != null) {
      final local = raw.contains('T') || raw.endsWith('Z')
          ? parsed.toLocal()
          : parsed;
      return _dateKeyFromDate(local);
    }
    return raw.length >= 10 ? raw.substring(0, 10) : '';
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
          queryParameters: {'include_unpublished': 'true'},
        ),
        dio.get(
          ApiEndpoints.tournaments,
          queryParameters: {'include_unpublished': 'true'},
        ),
      ]);
      final rawMatches = extractDataList(res[0].data);
      final user = ref.read(authProvider).user;
      final linkedUmpireId = user?.umpireProfile?.id;
      final scopedMatches = linkedUmpireId != null
          ? rawMatches
                .where(
                  (m) => parseInt(m['umpire_id'], -1) == linkedUmpireId,
                )
                .toList()
          : rawMatches;

      setState(() {
        _matches = scopedMatches;
        _tournaments = extractDataList(res[1].data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  void _openConsole(Map<String, dynamic> match) async {
    await Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(
        builder: (_) => RefereeConsoleScreen(match: match),
      ),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final umpire = user?.umpireProfile;
    final isDark = AppTheme.isDark(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return ErrorStateView(message: _error!, onRetry: _load);
    }

    final todayKey = _dateKeyFromDate(DateTime.now());
    final Map<String, List<Map<String, dynamic>>> matchesByDate = {};
    for (final m in _matches) {
      final key = _extractDateKey(m);
      if (key.isEmpty) continue;
      matchesByDate.putIfAbsent(key, () => []).add(m);
    }

    final liveMatches = _matches.where((m) => m['status'] == 'Live').toList();
    final todayMatches = matchesByDate[todayKey] ?? const [];
    final completedMatches = _matches
        .where((m) => m['status'] == 'Completed')
        .toList();

    final visibleSchedule = _showAllUpcoming
        ? _matches.where((m) => m['status'] != 'Completed').toList()
        : (matchesByDate[_selectedDateKey] ?? const []);

    final spotlightMatch = liveMatches.isNotEmpty
        ? liveMatches.first
        : _matches.firstWhere(
            (m) => m['status'] != 'Completed',
            orElse: () => _matches.isNotEmpty ? _matches.first : <String, dynamic>{},
          );

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 36),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? const [Color(0xFF0B2B22), Color(0xFF101C30)]
                    : const [Color(0xFF047857), Color(0xFF0F766E)],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppTheme.emerald.withValues(alpha: 0.35),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 25,
                      backgroundColor: Colors.white.withValues(alpha: 0.16),
                      child: const Icon(
                        Icons.sports_rounded,
                        color: Colors.white,
                        size: 25,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'OFFICIAL UMPIRE WORKSPACE',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2,
                              color: Colors.white.withValues(alpha: 0.78),
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            umpire?.name.isNotEmpty == true
                                ? umpire!.name
                                : (user?.name ?? 'Federation Umpire'),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            umpire != null
                                ? 'ID: ${umpire.umpireId ?? 'BCF-UMP'} • ${umpire.grade ?? 'Certified Official'} • ${umpire.status ?? 'Active'}'
                                : 'Assigned calendar, referee scoring & tournament preview',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.85),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.emeraldDark,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                      ),
                      onPressed: () => context.go('/matches'),
                      icon: const Icon(Icons.scoreboard_rounded, size: 17),
                      label: const Text('My Matches'),
                    ),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: BorderSide(color: Colors.white.withValues(alpha: 0.4)),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                      ),
                      onPressed: () => context.go('/tournaments'),
                      icon: const Icon(Icons.emoji_events_outlined, size: 17),
                      label: const Text('Tournaments Preview'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 4 Umpire KPI Widgets
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.75,
            children: [
              _UmpireStatTile(
                label: 'Assigned Matches',
                value: _matches.length.toString(),
                icon: Icons.assignment_turned_in_rounded,
                color: AppTheme.emerald,
              ),
              _UmpireStatTile(
                label: 'Live Courts Now',
                value: liveMatches.length.toString(),
                icon: Icons.sensors_rounded,
                color: AppTheme.danger,
              ),
              _UmpireStatTile(
                label: "Today's Fixtures",
                value: todayMatches.length.toString(),
                icon: Icons.today_rounded,
                color: AppTheme.info,
              ),
              _UmpireStatTile(
                label: 'Completed Done',
                value: completedMatches.length.toString(),
                icon: Icons.check_circle_rounded,
                color: AppTheme.gold,
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Interactive Schedule Calendar with Date Badges
          const SectionHeader(
            eyebrow: 'SCHEDULE CALENDAR',
            title: 'Monthly Match Duties',
          ),
          const SizedBox(height: 10),
          _UmpireScheduleCalendar(
            cursorMonth: _cursorMonth,
            selectedDateKey: _showAllUpcoming ? '' : _selectedDateKey,
            todayKey: todayKey,
            matchesByDate: matchesByDate,
            onChangeMonth: (next) => setState(() => _cursorMonth = next),
            onResetToday: () {
              final now = DateTime.now();
              setState(() {
                _cursorMonth = DateTime(now.year, now.month);
                _selectedDateKey = _dateKeyFromDate(now);
                _showAllUpcoming = false;
              });
            },
            onSelectDate: (key) => setState(() {
              _selectedDateKey = key;
              _showAllUpcoming = false;
            }),
          ),
          const SizedBox(height: 16),

          // Selected Date / Upcoming Schedule List
          SectionHeader(
            eyebrow: _showAllUpcoming ? 'QUEUE' : 'DAY SCHEDULE',
            title: _showAllUpcoming
                ? 'All Upcoming (${visibleSchedule.length})'
                : '$_selectedDateKey (${visibleSchedule.length})',
            trailing: TextButton(
              onPressed: () =>
                  setState(() => _showAllUpcoming = !_showAllUpcoming),
              child: Text(_showAllUpcoming ? 'By Date' : 'All Upcoming'),
            ),
          ),
          const SizedBox(height: 8),
          if (visibleSchedule.isEmpty)
            SurfaceCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Icon(
                    Icons.event_available_rounded,
                    size: 32,
                    color: AppTheme.mutedText(context),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _showAllUpcoming
                        ? 'No upcoming assigned matches'
                        : 'No matches scheduled for $_selectedDateKey',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tap any date with a match count badge on the calendar above.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            )
          else
            ...visibleSchedule.map((m) {
              final status = m['status']?.toString() ?? 'Scheduled';
              final isLive = status == 'Live';
              return SurfaceCard(
                margin: const EdgeInsets.only(bottom: 10),
                accentColor: isLive ? AppTheme.danger : AppTheme.emerald,
                onTap: () => _openConsole(m),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${m['tournament_title'] ?? 'Federation Match'} • Board #${m['board_number'] ?? 1}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.emerald,
                            ),
                          ),
                        ),
                        StatusBadge(label: status),
                      ],
                    ),
                    const SizedBox(height: 8),
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
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.cardElevated(context),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.border(context)),
                          ),
                          child: Text(
                            '${parseInt(m['player1_score'])} : ${parseInt(m['player2_score'])}',
                            style: AppTheme.tabular(
                              const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            m['player2_name']?.toString() ?? 'TBD',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.end,
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        MetaPill(
                          icon: Icons.layers_rounded,
                          text: m['round_name']?.toString() ?? 'Round',
                        ),
                        const Spacer(),
                        const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Score Court',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.emerald,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(
                              Icons.arrow_forward_rounded,
                              size: 14,
                              color: AppTheme.emerald,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),

          // Next / Live Court Spotlight
          if (spotlightMatch.isNotEmpty) ...[
            const SizedBox(height: 16),
            const SectionHeader(
              eyebrow: 'QUICK LAUNCH',
              title: 'Court Scoring Spotlight',
            ),
            const SizedBox(height: 8),
            SurfaceCard(
              accentColor: spotlightMatch['status'] == 'Live'
                  ? AppTheme.danger
                  : AppTheme.info,
              onTap: () => _openConsole(spotlightMatch),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: (spotlightMatch['status'] == 'Live'
                              ? AppTheme.danger
                              : AppTheme.info)
                          .withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      spotlightMatch['status'] == 'Live'
                          ? Icons.sensors_rounded
                          : Icons.sports_score_rounded,
                      color: spotlightMatch['status'] == 'Live'
                          ? AppTheme.danger
                          : AppTheme.info,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${spotlightMatch['player1_name'] ?? 'TBD'} vs ${spotlightMatch['player2_name'] ?? 'TBD'}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${spotlightMatch['tournament_title'] ?? 'Court Match'} • Board #${spotlightMatch['board_number'] ?? 1}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded),
                ],
              ),
            ),
          ],

          // Tournaments Preview Strip
          const SizedBox(height: 18),
          SectionHeader(
            eyebrow: 'READ-ONLY ACCESS',
            title: 'Tournaments Preview',
            trailing: TextButton(
              onPressed: () => context.go('/tournaments'),
              child: const Text('All'),
            ),
          ),
          const SizedBox(height: 8),
          if (_tournaments.isEmpty)
            const SurfaceCard(
              child: Text('No active tournaments available.'),
            )
          else
            ..._tournaments.take(4).map((t) {
              return SurfaceCard(
                margin: const EdgeInsets.only(bottom: 8),
                onTap: () => context.push('/tournaments/${parseInt(t['id'])}'),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(9),
                      decoration: BoxDecoration(
                        color: AppTheme.emerald.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.emoji_events_rounded,
                        size: 20,
                        color: AppTheme.emerald,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t['title']?.toString() ?? '',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            '${t['venue'] ?? 'Venue TBD'} • ${t['format'] ?? 'Knockout'}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    StatusBadge(label: t['status']?.toString() ?? 'Upcoming'),
                  ],
                ),
              );
            }),

          // ICF Umpire Quick Checklist Widget
          const SizedBox(height: 18),
          const SectionHeader(
            eyebrow: 'ICF REGULATIONS',
            title: 'Officiating Quick Guide',
          ),
          const SizedBox(height: 8),
          SurfaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                _GuideRow(
                  icon: Icons.toll_rounded,
                  text:
                      'Verify coin toss winner and White/Black strike decision prior to Board #1 break.',
                ),
                SizedBox(height: 8),
                _GuideRow(
                  icon: Icons.star_rounded,
                  text:
                      'Maximum one Queen (+3 points) per board; confirm cover before logging.',
                ),
                SizedBox(height: 8),
                _GuideRow(
                  icon: Icons.undo_rounded,
                  text:
                      'Use Undo inside the Referee Console to revert any accidental board point.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _UmpireStatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _UmpireStatTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: AppTheme.tabular(
                    const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      height: 1.05,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _UmpireScheduleCalendar extends StatelessWidget {
  final DateTime cursorMonth;
  final String selectedDateKey;
  final String todayKey;
  final Map<String, List<Map<String, dynamic>>> matchesByDate;
  final ValueChanged<DateTime> onChangeMonth;
  final VoidCallback onResetToday;
  final ValueChanged<String> onSelectDate;

  const _UmpireScheduleCalendar({
    required this.cursorMonth,
    required this.selectedDateKey,
    required this.todayKey,
    required this.matchesByDate,
    required this.onChangeMonth,
    required this.onResetToday,
    required this.onSelectDate,
  });

  static const _months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  static const _weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  @override
  Widget build(BuildContext context) {
    final year = cursorMonth.year;
    final month = cursorMonth.month;
    final firstWeekdayOffset = DateTime(year, month, 1).weekday % 7;
    final daysInMonth = DateTime(year, month + 1, 0).day;
    final totalCells = firstWeekdayOffset + daysInMonth;
    final rows = (totalCells / 7).ceil();

    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => onChangeMonth(DateTime(year, month - 1)),
                icon: const Icon(Icons.chevron_left_rounded),
                tooltip: 'Previous Month',
              ),
              Expanded(
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: onResetToday,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Text(
                      '${_months[month - 1]} $year',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ),
              IconButton(
                onPressed: () => onChangeMonth(DateTime(year, month + 1)),
                icon: const Icon(Icons.chevron_right_rounded),
                tooltip: 'Next Month',
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: _weekdays
                .map(
                  (w) => Expanded(
                    child: Text(
                      w,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.mutedText(context),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 8),
          for (int r = 0; r < rows; r++)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  for (int c = 0; c < 7; c++)
                    Expanded(
                      child: _buildDayCell(
                        context,
                        r * 7 + c - firstWeekdayOffset + 1,
                        daysInMonth,
                        year,
                        month,
                      ),
                    ),
                ],
              ),
            ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              _LegendDot(color: AppTheme.danger, label: 'Live'),
              SizedBox(width: 14),
              _LegendDot(color: AppTheme.emerald, label: 'Scheduled'),
              SizedBox(width: 14),
              _LegendDot(color: AppTheme.info, label: 'Completed'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDayCell(
    BuildContext context,
    int day,
    int daysInMonth,
    int year,
    int month,
  ) {
    if (day < 1 || day > daysInMonth) {
      return const SizedBox(height: 46);
    }
    final key =
        '$year-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
    final dayMatches = matchesByDate[key] ?? const [];
    final count = dayMatches.length;
    final hasLive = dayMatches.any((m) => m['status'] == 'Live');
    final hasScheduled = dayMatches.any((m) => m['status'] == 'Scheduled');
    final isSelected = selectedDateKey == key;
    final isToday = todayKey == key;

    final badgeColor = hasLive
        ? AppTheme.danger
        : hasScheduled
        ? AppTheme.emerald
        : AppTheme.info;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => onSelectDate(key),
        child: Container(
          height: 46,
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: isSelected
                ? AppTheme.emerald.withValues(alpha: 0.16)
                : (count > 0
                      ? AppTheme.cardElevated(context)
                      : Colors.transparent),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected
                  ? AppTheme.emerald
                  : (isToday
                        ? AppTheme.info.withValues(alpha: 0.7)
                        : AppTheme.border(context)),
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Stack(
            children: [
              Align(
                alignment: Alignment.topLeft,
                child: Text(
                  '$day',
                  style: AppTheme.tabular(
                    TextStyle(
                      fontSize: 11.5,
                      fontWeight: isSelected || isToday
                          ? FontWeight.w900
                          : FontWeight.w600,
                      color: isSelected
                          ? AppTheme.emerald
                          : (isToday ? AppTheme.info : null),
                    ),
                  ),
                ),
              ),
              if (count > 0)
                Align(
                  alignment: Alignment.bottomRight,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 5,
                      vertical: 1.5,
                    ),
                    decoration: BoxDecoration(
                      color: badgeColor,
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: Text(
                      '$count',
                      style: AppTheme.tabular(
                        const TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          height: 1.1,
                        ),
                      ),
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

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _GuideRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _GuideRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 17, color: AppTheme.emerald),
        const SizedBox(width: 9),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.4),
          ),
        ),
      ],
    );
  }
}
