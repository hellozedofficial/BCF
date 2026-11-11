import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class PlayersScreen extends ConsumerStatefulWidget {
  const PlayersScreen({super.key});

  @override
  ConsumerState<PlayersScreen> createState() => _PlayersScreenState();
}

class _PlayersScreenState extends ConsumerState<PlayersScreen> {
  final _searchCtrl = TextEditingController();
  bool _loading = true;
  String? _error;
  String _gender = 'All';
  List<Map<String, dynamic>> _players = [];

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
      final res = await ref.read(apiClientProvider).dio.get(
        ApiEndpoints.players,
        queryParameters: {
          if (_gender != 'All') 'gender': _gender,
          if (_searchCtrl.text.trim().isNotEmpty)
            'search': _searchCtrl.text.trim(),
        },
      );
      setState(() {
        _players = extractDataList(res.data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _delete(Map<String, dynamic> player) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Delete Player',
      message: 'Remove "${player['full_name']}" from official registry?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok) return;

    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.playerById(parseInt(player['id'])));
      if (mounted) {
        showAppSnack(context, 'Player deleted.');
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
      builder: (_) => _PlayerFormSheet(existing: existing),
    );
    if (saved == true) _load();
  }

  void _showDetail(Map<String, dynamic> p) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  AppAvatar(
                    url: p['photo_url']?.toString(),
                    name: p['full_name']?.toString() ?? 'P',
                    size: 62,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p['full_name']?.toString() ?? 'Player',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        Text(
                          '${p['player_id'] ?? ''} • Rank #${p['national_rank'] ?? '-'}',
                          style: const TextStyle(
                            color: AppTheme.emerald,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        StatusBadge(label: p['status']?.toString() ?? 'Active'),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              _DetailItem('Gender / Category', '${p['gender'] ?? '-'} • ${p['category'] ?? '-'}'),
              _DetailItem('Club', p['club_name']?.toString() ?? 'Independent'),
              _DetailItem('Location', '${p['district'] ?? '-'}, ${p['division'] ?? '-'}'),
              _DetailItem('Rating Points', '${p['rating_points'] ?? 1200}'),
              _DetailItem('Matches (Won / Played)', '${p['matches_won'] ?? 0} / ${p['matches_played'] ?? 0}'),
              _DetailItem('Slams (White / Black)', '${p['white_slams'] ?? 0} / ${p['black_slams'] ?? 0}'),
              _DetailItem('Phone / Email', '${p['phone'] ?? '-'} / ${p['email'] ?? '-'}'),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: AppSearchBar(
              controller: _searchCtrl,
              hint: 'Search players by name, ID, district, club...',
              onChanged: (_) => _load(),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              children: ['All', 'Men', 'Women', 'Junior'].map((g) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(g),
                    selected: _gender == g,
                    onSelected: (_) {
                      setState(() => _gender = g);
                      _load();
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? ErrorStateView(message: _error!, onRetry: _load)
                : _players.isEmpty
                ? const EmptyStateView(
                    icon: Icons.people_outline_rounded,
                    title: 'No Players Found',
                    subtitle: 'Register players or adjust filters.',
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 6, 16, 90),
                      itemCount: _players.length,
                      itemBuilder: (_, i) {
                        final p = _players[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: AppAvatar(
                              url: p['photo_url']?.toString(),
                              name: p['full_name']?.toString() ?? 'P',
                            ),
                            title: Text(
                              p['full_name']?.toString() ?? '',
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                            subtitle: Text(
                              '${p['player_id'] ?? ''} • Rank #${p['national_rank'] ?? '-'} • ${p['district'] ?? ''}',
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 20),
                                  onPressed: () => _openForm(p),
                                ),
                                IconButton(
                                  icon: const Icon(
                                    Icons.delete_outline_rounded,
                                    size: 20,
                                    color: AppTheme.danger,
                                  ),
                                  onPressed: () => _delete(p),
                                ),
                              ],
                            ),
                            onTap: () => _showDetail(p),
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
        icon: const Icon(Icons.person_add_alt_1_rounded),
        label: const Text('Add Player'),
      ),
    );
  }
}

class _DetailItem extends StatelessWidget {
  final String label;
  final String value;
  const _DetailItem(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 145,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _PlayerFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existing;
  const _PlayerFormSheet({this.existing});

  @override
  ConsumerState<_PlayerFormSheet> createState() => _PlayerFormSheetState();
}

class _PlayerFormSheetState extends ConsumerState<_PlayerFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _clubCtrl;
  late final TextEditingController _districtCtrl;
  late final TextEditingController _divisionCtrl;
  late final TextEditingController _ratingCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emailCtrl;
  String _gender = 'Men';
  String _category = 'Senior';
  String _status = 'Active';
  String? _photoUrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _nameCtrl = TextEditingController(text: e?['full_name']?.toString() ?? '');
    _clubCtrl = TextEditingController(text: e?['club_name']?.toString() ?? '');
    _districtCtrl = TextEditingController(text: e?['district']?.toString() ?? 'Dhaka');
    _divisionCtrl = TextEditingController(text: e?['division']?.toString() ?? 'Dhaka');
    _ratingCtrl = TextEditingController(text: (e?['rating_points'] ?? 1200).toString());
    _phoneCtrl = TextEditingController(text: e?['phone']?.toString() ?? '');
    _emailCtrl = TextEditingController(text: e?['email']?.toString() ?? '');
    _gender = e?['gender']?.toString() ?? 'Men';
    _category = e?['category']?.toString() ?? 'Senior';
    _status = e?['status']?.toString() ?? 'Active';
    _photoUrl = e?['photo_url']?.toString();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _clubCtrl.dispose();
    _districtCtrl.dispose();
    _divisionCtrl.dispose();
    _ratingCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = {
      'full_name': _nameCtrl.text.trim(),
      'gender': _gender,
      'category': _category,
      'club_name': _clubCtrl.text.trim(),
      'district': _districtCtrl.text.trim(),
      'division': _divisionCtrl.text.trim(),
      'rating_points': int.tryParse(_ratingCtrl.text) ?? 1200,
      'phone': _phoneCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'status': _status,
      if (_photoUrl != null) 'photo_url': _photoUrl,
    };

    try {
      final dio = ref.read(apiClientProvider).dio;
      if (widget.existing == null) {
        await dio.post(ApiEndpoints.players, data: payload);
      } else {
        await dio.put(
          ApiEndpoints.playerById(parseInt(widget.existing!['id'])),
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
                widget.existing == null ? 'Register Player' : 'Edit Player',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Base64ImagePickerField(
                label: 'Player Photo',
                value: _photoUrl,
                onChanged: (v) => setState(() => _photoUrl = v),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(labelText: 'Full Name'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Name required' : null,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: safeDropdownValue(_gender, const ['Men', 'Women', 'Junior']),
                      decoration: const InputDecoration(labelText: 'Gender'),
                      items: const [
                        DropdownMenuItem(value: 'Men', child: Text('Men')),
                        DropdownMenuItem(value: 'Women', child: Text('Women')),
                        DropdownMenuItem(value: 'Junior', child: Text('Junior')),
                      ],
                      onChanged: (v) => setState(() => _gender = v ?? 'Men'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: safeDropdownValue(_category, const ['Senior', 'Junior', 'Veteran']),
                      decoration: const InputDecoration(labelText: 'Category'),
                      items: const [
                        DropdownMenuItem(value: 'Senior', child: Text('Senior')),
                        DropdownMenuItem(value: 'Junior', child: Text('Junior')),
                        DropdownMenuItem(value: 'Veteran', child: Text('Veteran')),
                      ],
                      onChanged: (v) => setState(() => _category = v ?? 'Senior'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _clubCtrl,
                decoration: const InputDecoration(labelText: 'Club / Academy'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _divisionCtrl,
                      decoration: const InputDecoration(labelText: 'Division'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _districtCtrl,
                      decoration: const InputDecoration(labelText: 'District'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _ratingCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Rating Points'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: safeDropdownValue(_status, const ['Active', 'Inactive', 'Suspended']),
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(value: 'Active', child: Text('Active')),
                        DropdownMenuItem(value: 'Inactive', child: Text('Inactive')),
                        DropdownMenuItem(value: 'Suspended', child: Text('Suspended')),
                      ],
                      onChanged: (v) => setState(() => _status = v ?? 'Active'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone'),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save Player'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
