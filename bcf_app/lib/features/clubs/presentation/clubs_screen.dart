import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class ClubsScreen extends ConsumerStatefulWidget {
  const ClubsScreen({super.key});

  @override
  ConsumerState<ClubsScreen> createState() => _ClubsScreenState();
}

class _ClubsScreenState extends ConsumerState<ClubsScreen> {
  final _searchCtrl = TextEditingController();
  bool _loading = true;
  String? _error;
  String _statusFilter = 'all';
  List<Map<String, dynamic>> _clubs = [];

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
        ApiEndpoints.clubs,
        queryParameters: {
          if (_statusFilter != 'all') 'status': _statusFilter,
          if (_searchCtrl.text.trim().isNotEmpty) 'q': _searchCtrl.text.trim(),
        },
      );
      setState(() {
        _clubs = extractDataList(res.data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _toggleStatus(Map<String, dynamic> club) async {
    final next = club['status'] == 'Active' ? 'Inactive' : 'Active';
    try {
      await ref.read(apiClientProvider).dio.patch(
        ApiEndpoints.clubStatus(parseInt(club['id'])),
        data: {'status': next},
      );
      if (mounted) {
        showAppSnack(context, 'Club status updated to $next.');
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _delete(Map<String, dynamic> club) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Delete Club',
      message: 'Delete club "${club['name']}"?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok) return;

    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.clubById(parseInt(club['id'])));
      if (mounted) {
        showAppSnack(context, 'Club deleted.');
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
      builder: (_) => _ClubFormSheet(existing: existing),
    );
    if (saved == true) _load();
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
              hint: 'Search clubs by name, president, district...',
              onChanged: (_) => _load(),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              children: ['all', 'Active', 'Pending', 'Inactive'].map((s) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(s == 'all' ? 'All' : s),
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
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? ErrorStateView(message: _error!, onRetry: _load)
                : _clubs.isEmpty
                ? const EmptyStateView(
                    icon: Icons.apartment_outlined,
                    title: 'No Clubs Found',
                    subtitle: 'Add affiliated carrom clubs and academies.',
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 6, 16, 90),
                      itemCount: _clubs.length,
                      itemBuilder: (_, i) {
                        final c = _clubs[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: ListTile(
                            leading: AppAvatar(
                              url: c['logo_url']?.toString(),
                              name: c['name']?.toString() ?? 'C',
                            ),
                            title: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    c['name']?.toString() ?? '',
                                    style: const TextStyle(fontWeight: FontWeight.w800),
                                  ),
                                ),
                                StatusBadge(label: c['status']?.toString() ?? 'Active'),
                              ],
                            ),
                            subtitle: Text(
                              '${c['district'] ?? ''}, ${c['division'] ?? ''} • Pres: ${c['president'] ?? '-'}',
                            ),
                            trailing: PopupMenuButton<String>(
                              onSelected: (v) {
                                if (v == 'edit') _openForm(c);
                                if (v == 'toggle') _toggleStatus(c);
                                if (v == 'delete') _delete(c);
                              },
                              itemBuilder: (_) => const [
                                PopupMenuItem(value: 'edit', child: Text('Edit')),
                                PopupMenuItem(value: 'toggle', child: Text('Toggle Status')),
                                PopupMenuItem(value: 'delete', child: Text('Delete')),
                              ],
                            ),
                            onTap: () => _openForm(c),
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
        icon: const Icon(Icons.add_business_rounded),
        label: const Text('Add Club'),
      ),
    );
  }
}

class _ClubFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existing;
  const _ClubFormSheet({this.existing});

  @override
  ConsumerState<_ClubFormSheet> createState() => _ClubFormSheetState();
}

class _ClubFormSheetState extends ConsumerState<_ClubFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _divisionCtrl;
  late final TextEditingController _districtCtrl;
  late final TextEditingController _addressCtrl;
  late final TextEditingController _presidentCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _yearCtrl;
  String _status = 'Active';
  String? _logoData;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _nameCtrl = TextEditingController(text: e?['name']?.toString() ?? '');
    _divisionCtrl = TextEditingController(text: e?['division']?.toString() ?? 'Dhaka');
    _districtCtrl = TextEditingController(text: e?['district']?.toString() ?? 'Dhaka');
    _addressCtrl = TextEditingController(text: e?['address']?.toString() ?? '');
    _presidentCtrl = TextEditingController(text: e?['president']?.toString() ?? '');
    _phoneCtrl = TextEditingController(text: (e?['president_phone'] ?? e?['contact_phone'] ?? '').toString());
    _emailCtrl = TextEditingController(text: (e?['president_email'] ?? e?['contact_email'] ?? '').toString());
    _yearCtrl = TextEditingController(text: (e?['established_year'] ?? '').toString());
    _status = e?['status']?.toString() ?? 'Active';
    _logoData = e?['logo_url']?.toString();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _divisionCtrl.dispose();
    _districtCtrl.dispose();
    _addressCtrl.dispose();
    _presidentCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _yearCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = {
      'name': _nameCtrl.text.trim(),
      'division': _divisionCtrl.text.trim(),
      'district': _districtCtrl.text.trim(),
      'address': _addressCtrl.text.trim(),
      'president': _presidentCtrl.text.trim(),
      'president_phone': _phoneCtrl.text.trim(),
      'president_email': _emailCtrl.text.trim(),
      'established_year': int.tryParse(_yearCtrl.text),
      'status': _status,
      if (_logoData != null && _logoData!.startsWith('data:')) 'logo': _logoData,
      if (_logoData != null && !_logoData!.startsWith('data:')) 'logo_url': _logoData,
    };

    try {
      final dio = ref.read(apiClientProvider).dio;
      if (widget.existing == null) {
        await dio.post(ApiEndpoints.clubs, data: payload);
      } else {
        await dio.put(
          ApiEndpoints.clubById(parseInt(widget.existing!['id'])),
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
                widget.existing == null ? 'Add Club / Academy' : 'Edit Club',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Base64ImagePickerField(
                label: 'Club Logo',
                value: _logoData,
                onChanged: (v) => setState(() => _logoData = v),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(labelText: 'Club Name'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Club name required' : null,
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
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'District required'
                          : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _addressCtrl,
                decoration: const InputDecoration(labelText: 'Address'),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _presidentCtrl,
                decoration: const InputDecoration(labelText: 'President / Secretary'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Contact Phone'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _yearCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Est. Year'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: safeDropdownValue(_status, const ['Active', 'Pending', 'Inactive']),
                decoration: const InputDecoration(labelText: 'Status'),
                items: const [
                  DropdownMenuItem(value: 'Active', child: Text('Active')),
                  DropdownMenuItem(value: 'Pending', child: Text('Pending')),
                  DropdownMenuItem(value: 'Inactive', child: Text('Inactive')),
                ],
                onChanged: (v) => setState(() => _status = v ?? 'Active'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save Club'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
