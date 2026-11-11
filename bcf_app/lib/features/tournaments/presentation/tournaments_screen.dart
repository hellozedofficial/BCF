import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class TournamentsScreen extends ConsumerStatefulWidget {
  const TournamentsScreen({super.key});

  @override
  ConsumerState<TournamentsScreen> createState() => _TournamentsScreenState();
}

class _TournamentsScreenState extends ConsumerState<TournamentsScreen> {
  final _searchCtrl = TextEditingController();
  bool _loading = true;
  String? _error;
  String _statusFilter = 'All';
  List<Map<String, dynamic>> _tournaments = [];
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
      final results = await Future.wait([
        dio.get(
          ApiEndpoints.tournaments,
          queryParameters: {
            'include_unpublished': 'true',
            if (_statusFilter != 'All') 'status': _statusFilter,
            if (_searchCtrl.text.trim().isNotEmpty)
              'search': _searchCtrl.text.trim(),
          },
        ),
        dio.get(ApiEndpoints.umpires),
      ]);
      setState(() {
        _tournaments = extractDataList(results[0].data);
        _umpires = extractDataList(results[1].data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _togglePublish(Map<String, dynamic> item, bool value) async {
    try {
      final dio = ref.read(apiClientProvider).dio;
      await dio.patch(
        ApiEndpoints.tournamentPublish(parseInt(item['id'])),
        data: {'is_published': value ? 1 : 0},
      );
      if (mounted) {
        showAppSnack(
          context,
          value ? 'Tournament published on website.' : 'Tournament unpublished.',
        );
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _deleteTournament(Map<String, dynamic> item) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Delete Tournament',
      message:
          'Delete "${item['title']}" and all associated matches? This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!confirmed) return;

    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.tournamentById(parseInt(item['id'])));
      if (mounted) {
        showAppSnack(context, 'Tournament deleted.');
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _openForm([Map<String, dynamic>? existing]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _TournamentFormSheet(
        existing: existing,
        umpires: _umpires,
      ),
    );
    if (saved == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    const statuses = ['All', 'Ongoing', 'Upcoming', 'Completed'];

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: AppSearchBar(
              controller: _searchCtrl,
              hint: 'Search tournaments by title, venue or code...',
              onChanged: (_) => _load(),
            ),
          ),
          FilterPillStrip(
            items: statuses,
            selected: _statusFilter,
            onSelected: (s) {
              setState(() => _statusFilter = s);
              _load();
            },
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? ErrorStateView(message: _error!, onRetry: _load)
                : _tournaments.isEmpty
                ? EmptyStateView(
                    icon: Icons.emoji_events_outlined,
                    title: 'No Tournaments Found',
                    subtitle: 'Create a tournament to organize fixtures and boards.',
                    action: ElevatedButton.icon(
                      onPressed: () => _openForm(),
                      icon: const Icon(Icons.add_rounded),
                      label: const Text('New Tournament'),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                      itemCount: _tournaments.length,
                      itemBuilder: (_, index) {
                        final t = _tournaments[index];
                        final published = parseInt(t['is_published'], 1) == 1;
                        return SurfaceCard(
                          margin: const EdgeInsets.only(bottom: 10),
                          onTap: () => context.push('/tournaments/${t['id']}'),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: AppTheme.gold.withValues(alpha: 0.14),
                                      borderRadius: BorderRadius.circular(12),
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
                                          style: const TextStyle(
                                            fontSize: 15.5,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: -0.2,
                                          ),
                                        ),
                                        if ((t['tournament_code']?.toString() ?? '')
                                            .isNotEmpty)
                                          Text(
                                            t['tournament_code'].toString(),
                                            style: TextStyle(
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w700,
                                              color: AppTheme.emerald,
                                            ),
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
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: [
                                  if ((t['venue']?.toString() ?? '').isNotEmpty)
                                    MetaPill(
                                      icon: Icons.location_on_outlined,
                                      text: t['venue'].toString(),
                                    ),
                                  MetaPill(
                                    icon: Icons.account_tree_outlined,
                                    text: t['format']?.toString() ?? 'Knockout',
                                  ),
                                  MetaPill(
                                    icon: Icons.grid_view_rounded,
                                    text:
                                        '${t['board_limit'] ?? 8} boards • ${t['points_limit'] ?? 25} pts',
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              const Divider(),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Switch.adaptive(
                                    value: published,
                                    onChanged: (v) => _togglePublish(t, v),
                                  ),
                                  const SizedBox(width: 6),
                                  StatusBadge(
                                    label: published ? 'Published' : 'Draft',
                                    color: published
                                        ? AppTheme.emerald
                                        : AppTheme.warning,
                                  ),
                                  const Spacer(),
                                  IconButton(
                                    tooltip: 'Edit Tournament',
                                    icon: const Icon(Icons.edit_outlined, size: 20),
                                    onPressed: () => _openForm(t),
                                  ),
                                  IconButton(
                                    tooltip: 'Delete Tournament',
                                    icon: const Icon(
                                      Icons.delete_outline_rounded,
                                      size: 20,
                                      color: AppTheme.danger,
                                    ),
                                    onPressed: () => _deleteTournament(t),
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        icon: const Icon(Icons.add_rounded),
        label: const Text('New Tournament'),
      ),
    );
  }
}

class _TournamentFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existing;
  final List<Map<String, dynamic>> umpires;

  const _TournamentFormSheet({this.existing, required this.umpires});

  @override
  ConsumerState<_TournamentFormSheet> createState() =>
      _TournamentFormSheetState();
}

class _TournamentFormSheetState extends ConsumerState<_TournamentFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleCtrl;
  late final TextEditingController _editionCtrl;
  late final TextEditingController _venueCtrl;
  late final TextEditingController _startDateCtrl;
  late final TextEditingController _endDateCtrl;
  late final TextEditingController _categoryCtrl;
  late final TextEditingController _boardLimitCtrl;
  late final TextEditingController _pointsLimitCtrl;
  late final TextEditingController _prizePoolCtrl;
  late final TextEditingController _descCtrl;

  String _format = 'Knockout';
  String _seeding = 'Seeded';
  String _status = 'Upcoming';
  bool _isPublished = true;
  int? _chiefUmpireId;
  Set<int> _selectedUmpires = {};
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _titleCtrl = TextEditingController(text: e?['title']?.toString() ?? '');
    _editionCtrl = TextEditingController(
      text: e?['edition']?.toString() ?? DateTime.now().year.toString(),
    );
    _venueCtrl = TextEditingController(text: e?['venue']?.toString() ?? '');
    _startDateCtrl = TextEditingController(
      text: _formatDateInput(e?['start_date']),
    );
    _endDateCtrl = TextEditingController(text: _formatDateInput(e?['end_date']));
    _categoryCtrl = TextEditingController(
      text: e?['category']?.toString() ?? 'National Championship',
    );
    _boardLimitCtrl = TextEditingController(
      text: (e?['board_limit'] ?? 8).toString(),
    );
    _pointsLimitCtrl = TextEditingController(
      text: (e?['points_limit'] ?? 25).toString(),
    );
    _prizePoolCtrl = TextEditingController(
      text: e?['prize_pool']?.toString() ?? 'BDT 5,00,000',
    );
    _descCtrl = TextEditingController(
      text: e?['description']?.toString() ?? '',
    );
    _format = e?['format']?.toString() ?? 'Knockout';
    _seeding = e?['seeding_type']?.toString() ?? 'Seeded';
    _status = e?['status']?.toString() ?? 'Upcoming';
    _isPublished = parseInt(e?['is_published'], 1) == 1;
    _chiefUmpireId = e?['chief_umpire_id'] != null
        ? parseInt(e!['chief_umpire_id'])
        : null;

    final rawIds = e?['umpire_ids'];
    if (rawIds is List) {
      _selectedUmpires = rawIds.map((x) => parseInt(x)).where((x) => x > 0).toSet();
    } else if (rawIds is String && rawIds.trim().startsWith('[')) {
      try {
        final decoded = jsonDecode(rawIds);
        if (decoded is List) {
          _selectedUmpires =
              decoded.map((x) => parseInt(x)).where((x) => x > 0).toSet();
        }
      } catch (_) {}
    }
  }

  String _formatDateInput(dynamic v) {
    if (v == null) return DateTime.now().toIso8601String().split('T').first;
    final s = v.toString();
    return s.contains('T') ? s.split('T').first : s;
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    final initial = DateTime.tryParse(ctrl.text) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
    );
    if (picked != null) {
      ctrl.text = picked.toIso8601String().split('T').first;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _editionCtrl.dispose();
    _venueCtrl.dispose();
    _startDateCtrl.dispose();
    _endDateCtrl.dispose();
    _categoryCtrl.dispose();
    _boardLimitCtrl.dispose();
    _pointsLimitCtrl.dispose();
    _prizePoolCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = {
      'title': _titleCtrl.text.trim(),
      'edition': _editionCtrl.text.trim(),
      'venue': _venueCtrl.text.trim(),
      'start_date': _startDateCtrl.text.trim(),
      'end_date': _endDateCtrl.text.trim(),
      'category': _categoryCtrl.text.trim(),
      'format': _format,
      'seeding_type': _seeding,
      'board_limit': int.tryParse(_boardLimitCtrl.text) ?? 8,
      'points_limit': int.tryParse(_pointsLimitCtrl.text) ?? 25,
      'prize_pool': _prizePoolCtrl.text.trim(),
      'status': _status,
      'is_published': _isPublished ? 1 : 0,
      'description': _descCtrl.text.trim(),
      'chief_umpire_id': _chiefUmpireId,
      'umpire_ids': _selectedUmpires.toList(),
    };

    try {
      final dio = ref.read(apiClientProvider).dio;
      if (widget.existing == null) {
        await dio.post(ApiEndpoints.tournaments, data: payload);
      } else {
        await dio.put(
          ApiEndpoints.tournamentById(parseInt(widget.existing!['id'])),
          data: payload,
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 18,
        right: 18,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                widget.existing == null
                    ? 'Create Tournament'
                    : 'Edit Tournament',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(labelText: 'Tournament Title'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Title is required' : null,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _editionCtrl,
                      decoration: const InputDecoration(labelText: 'Edition'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _venueCtrl,
                      decoration: const InputDecoration(labelText: 'Venue'),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Venue is required'
                          : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _startDateCtrl,
                      readOnly: true,
                      onTap: () => _pickDate(_startDateCtrl),
                      decoration: const InputDecoration(
                        labelText: 'Start Date',
                        suffixIcon: Icon(Icons.calendar_today_rounded, size: 18),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _endDateCtrl,
                      readOnly: true,
                      onTap: () => _pickDate(_endDateCtrl),
                      decoration: const InputDecoration(
                        labelText: 'End Date',
                        suffixIcon: Icon(Icons.calendar_today_rounded, size: 18),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: safeDropdownValue(_format, const ['Knockout', 'RoundRobin']),
                      decoration: const InputDecoration(labelText: 'Format'),
                      items: const [
                        DropdownMenuItem(value: 'Knockout', child: Text('Knockout')),
                        DropdownMenuItem(value: 'RoundRobin', child: Text('Round Robin')),
                      ],
                      onChanged: (v) => setState(() => _format = v ?? 'Knockout'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: safeDropdownValue(_status, const ['Upcoming', 'Ongoing', 'Completed']),
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(value: 'Upcoming', child: Text('Upcoming')),
                        DropdownMenuItem(value: 'Ongoing', child: Text('Ongoing')),
                        DropdownMenuItem(value: 'Completed', child: Text('Completed')),
                      ],
                      onChanged: (v) => setState(() => _status = v ?? 'Upcoming'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _boardLimitCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Boards / Match'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _pointsLimitCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Target Points'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _categoryCtrl,
                decoration: const InputDecoration(labelText: 'Category'),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _prizePoolCtrl,
                decoration: const InputDecoration(labelText: 'Prize Pool'),
              ),
              if (widget.umpires.isNotEmpty) ...[
                const SizedBox(height: 10),
                DropdownButtonFormField<int?>(
                  value: widget.umpires.any(
                    (u) => parseInt(u['id']) == _chiefUmpireId,
                  )
                      ? _chiefUmpireId
                      : null,
                  decoration: const InputDecoration(
                    labelText: 'Chief Umpire (Optional)',
                  ),
                  items: [
                    const DropdownMenuItem<int?>(
                      value: null,
                      child: Text('None'),
                    ),
                    ...widget.umpires.map(
                      (u) => DropdownMenuItem<int?>(
                        value: parseInt(u['id']),
                        child: Text(
                          '${u['name']} (${u['umpire_id'] ?? ''})',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                  onChanged: (v) => setState(() => _chiefUmpireId = v),
                ),
                const SizedBox(height: 10),
                Text(
                  'Assigned Tournament Umpires (${_selectedUmpires.length})',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: widget.umpires.map((u) {
                    final uid = parseInt(u['id']);
                    final selected = _selectedUmpires.contains(uid);
                    return FilterChip(
                      label: Text(u['name']?.toString() ?? 'Umpire'),
                      selected: selected,
                      onSelected: (val) {
                        setState(() {
                          if (val) {
                            _selectedUmpires.add(uid);
                          } else {
                            _selectedUmpires.remove(uid);
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
              ],
              const SizedBox(height: 10),
              TextFormField(
                controller: _descCtrl,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
              const SizedBox(height: 8),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Published on Website'),
                value: _isPublished,
                onChanged: (v) => setState(() => _isPublished = v),
              ),
              const SizedBox(height: 14),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save Tournament'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
