import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class UmpiresScreen extends ConsumerStatefulWidget {
  const UmpiresScreen({super.key});

  @override
  ConsumerState<UmpiresScreen> createState() => _UmpiresScreenState();
}

class _UmpiresScreenState extends ConsumerState<UmpiresScreen> {
  final _searchCtrl = TextEditingController();
  bool _loading = true;
  String? _error;
  String _statusFilter = 'All';
  List<Map<String, dynamic>> _umpires = [];
  List<Map<String, dynamic>> _allUmpires = [];
  List<Map<String, dynamic>> _adminUsers = [];

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
          ApiEndpoints.umpires,
          queryParameters: {
            if (_statusFilter != 'All') 'status': _statusFilter,
            if (_searchCtrl.text.trim().isNotEmpty)
              'search': _searchCtrl.text.trim(),
          },
        ),
        dio.get(ApiEndpoints.umpires),
        dio.get(ApiEndpoints.users).catchError((_) => throw Exception('skip')),
      ].map((f) => f.catchError((e) => throw e)));

      setState(() {
        _umpires = extractDataList(results[0].data);
        _allUmpires = extractDataList(results[1].data);
        _adminUsers = extractDataList(results[2].data);
        _loading = false;
      });
    } catch (e) {
      // Retry without /users if user lacks users list permission
      try {
        final dio = ref.read(apiClientProvider).dio;
        final res = await Future.wait([
          dio.get(
            ApiEndpoints.umpires,
            queryParameters: {
              if (_statusFilter != 'All') 'status': _statusFilter,
              if (_searchCtrl.text.trim().isNotEmpty)
                'search': _searchCtrl.text.trim(),
            },
          ),
          dio.get(ApiEndpoints.umpires),
        ]);
        setState(() {
          _umpires = extractDataList(res[0].data);
          _allUmpires = extractDataList(res[1].data);
          _loading = false;
        });
      } catch (err2) {
        setState(() {
          _error = ApiClient.extractErrorMessage(err2);
          _loading = false;
        });
      }
    }
  }

  Future<void> _delete(Map<String, dynamic> umpire) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Delete Umpire',
      message: 'Delete official "${umpire['name']}"?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok) return;

    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.umpireById(parseInt(umpire['id'])));
      if (mounted) {
        showAppSnack(context, 'Umpire deleted.');
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
      builder: (_) => _UmpireFormSheet(
        existing: existing,
        allUmpires: _allUmpires,
        adminUsers: _adminUsers,
      ),
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
              hint: 'Search umpire name, 6-digit ID, phone, NID...',
              onChanged: (_) => _load(),
            ),
          ),
          FilterPillStrip(
            items: const ['All', 'Active', 'Inactive', 'Suspended'],
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
                : _umpires.isEmpty
                ? const EmptyStateView(
                    icon: Icons.gavel_outlined,
                    title: 'No Umpires Found',
                    subtitle: 'Register federation referees and umpires.',
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 6, 16, 96),
                      itemCount: _umpires.length,
                      itemBuilder: (_, i) {
                        final u = _umpires[i];
                        return SurfaceCard(
                          margin: const EdgeInsets.only(bottom: 10),
                          onTap: () => _openForm(u),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              AppAvatar(
                                url: u['photo_url']?.toString(),
                                name: u['name']?.toString() ?? 'U',
                                size: 48,
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
                                            u['name']?.toString() ?? '',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                        ),
                                        StatusBadge(
                                          label: u['status']?.toString() ?? 'Active',
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Wrap(
                                      spacing: 6,
                                      runSpacing: 4,
                                      children: [
                                        if ((u['umpire_id']?.toString() ?? '').isNotEmpty)
                                          MetaPill(
                                            icon: Icons.verified_outlined,
                                            text: u['umpire_id'].toString(),
                                            color: AppTheme.gold,
                                          ),
                                        MetaPill(
                                          icon: Icons.gavel_rounded,
                                          text: u['grade']?.toString() ?? 'National Umpire',
                                        ),
                                        if (u['user_id'] != null)
                                          MetaPill(
                                            icon: Icons.link_rounded,
                                            text:
                                                '${u['linked_user_name'] ?? 'User #${u['user_id']}'}',
                                            color: AppTheme.info,
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              PopupMenuButton<String>(
                                onSelected: (v) {
                                  if (v == 'edit') _openForm(u);
                                  if (v == 'delete') _delete(u);
                                },
                                itemBuilder: (_) => const [
                                  PopupMenuItem(value: 'edit', child: Text('Edit Umpire')),
                                  PopupMenuItem(value: 'delete', child: Text('Delete Umpire')),
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
        label: const Text('Add Umpire'),
      ),
    );
  }
}

class _UmpireFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existing;
  final List<Map<String, dynamic>> allUmpires;
  final List<Map<String, dynamic>> adminUsers;

  const _UmpireFormSheet({
    this.existing,
    required this.allUmpires,
    required this.adminUsers,
  });

  @override
  ConsumerState<_UmpireFormSheet> createState() => _UmpireFormSheetState();
}

class _UmpireFormSheetState extends ConsumerState<_UmpireFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _banglaCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _nidCtrl;
  late final TextEditingController _dobCtrl;
  late final TextEditingController _sinceCtrl;
  late final TextEditingController _fedIdCtrl;

  String _gender = 'Male';
  String _grade = 'National Umpire';
  String _status = 'Active';
  String? _photoUrl;
  int? _linkedUserId;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _nameCtrl = TextEditingController(text: e?['name']?.toString() ?? '');
    _banglaCtrl = TextEditingController(text: e?['name_bangla']?.toString() ?? '');
    _emailCtrl = TextEditingController(text: e?['email']?.toString() ?? '');
    _phoneCtrl = TextEditingController(text: e?['phone']?.toString() ?? '');
    _nidCtrl = TextEditingController(text: e?['nid_number']?.toString() ?? '');
    _dobCtrl = TextEditingController(
      text: (e?['dob']?.toString() ?? '').split('T').first,
    );
    _sinceCtrl = TextEditingController(
      text: (e?['member_since']?.toString() ?? '').split('T').first,
    );
    _fedIdCtrl = TextEditingController(text: e?['federation_id']?.toString() ?? '');
    _gender = e?['gender']?.toString() ?? 'Male';
    _grade = e?['grade']?.toString() ?? 'National Umpire';
    _status = e?['status']?.toString() ?? 'Active';
    _photoUrl = e?['photo_url']?.toString();
    _linkedUserId = e?['user_id'] != null ? parseInt(e!['user_id']) : null;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _banglaCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _nidCtrl.dispose();
    _dobCtrl.dispose();
    _sinceCtrl.dispose();
    _fedIdCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    final initial = DateTime.tryParse(ctrl.text) ?? DateTime(1990);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1940),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) ctrl.text = picked.toIso8601String().split('T').first;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = {
      'name': _nameCtrl.text.trim(),
      'name_bangla': _banglaCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      'nid_number': _nidCtrl.text.trim(),
      'dob': _dobCtrl.text.trim().isEmpty ? null : _dobCtrl.text.trim(),
      'member_since': _sinceCtrl.text.trim().isEmpty ? null : _sinceCtrl.text.trim(),
      'federation_id': _fedIdCtrl.text.trim(),
      'gender': _gender,
      'grade': _grade,
      'status': _status,
      'user_id': _linkedUserId,
      if (_photoUrl != null) 'photo_url': _photoUrl,
    };

    try {
      final dio = ref.read(apiClientProvider).dio;
      if (widget.existing == null) {
        await dio.post(ApiEndpoints.umpires, data: payload);
      } else {
        await dio.put(
          ApiEndpoints.umpireById(parseInt(widget.existing!['id'])),
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
    final editingId = parseInt(widget.existing?['id']);

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
                widget.existing == null ? 'Register Umpire' : 'Edit Umpire',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Base64ImagePickerField(
                label: 'Official Photo',
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
              TextFormField(
                controller: _banglaCtrl,
                decoration: const InputDecoration(labelText: 'Bangla Name (Optional)'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Phone'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _nidCtrl,
                decoration: const InputDecoration(labelText: 'NID Number'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _dobCtrl,
                      readOnly: true,
                      onTap: () => _pickDate(_dobCtrl),
                      decoration: const InputDecoration(labelText: 'Date of Birth'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _sinceCtrl,
                      readOnly: true,
                      onTap: () => _pickDate(_sinceCtrl),
                      decoration: const InputDecoration(labelText: 'Member Since'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: safeDropdownValue(_gender, const ['Male', 'Female']),
                      decoration: const InputDecoration(labelText: 'Gender'),
                      items: const [
                        DropdownMenuItem(value: 'Male', child: Text('Male')),
                        DropdownMenuItem(value: 'Female', child: Text('Female')),
                      ],
                      onChanged: (v) => setState(() => _gender = v ?? 'Male'),
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
              DropdownButtonFormField<String>(
                value: safeDropdownValue(_grade, const [
                  'International Umpire',
                  'National Umpire',
                  'Chief Referee',
                  'Assistant Referee',
                ]),
                decoration: const InputDecoration(labelText: 'Grade / Role'),
                items: const [
                  DropdownMenuItem(value: 'International Umpire', child: Text('International Umpire')),
                  DropdownMenuItem(value: 'National Umpire', child: Text('National Umpire')),
                  DropdownMenuItem(value: 'Chief Referee', child: Text('Chief Referee')),
                  DropdownMenuItem(value: 'Assistant Referee', child: Text('Assistant Referee')),
                ],
                onChanged: (v) => setState(() => _grade = v ?? 'National Umpire'),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _fedIdCtrl,
                decoration: const InputDecoration(
                  labelText: 'Federation ID (Auto-generated if empty)',
                ),
              ),
              if (widget.adminUsers.isNotEmpty) ...[
                const SizedBox(height: 10),
                DropdownButtonFormField<int?>(
                  value: widget.adminUsers.any(
                    (u) => parseInt(u['id']) == _linkedUserId,
                  )
                      ? _linkedUserId
                      : null,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Link System / Admin User (Optional)',
                    helperText: 'Users already assigned to another umpire are disabled.',
                  ),
                  items: [
                    const DropdownMenuItem<int?>(
                      value: null,
                      child: Text('None (Unlinked)'),
                    ),
                    ...widget.adminUsers.map((sysUser) {
                      final uid = parseInt(sysUser['id']);
                      final assigned = widget.allUmpires
                          .cast<Map<String, dynamic>?>()
                          .firstWhere(
                            (u) =>
                                u != null &&
                                parseInt(u['user_id']) == uid &&
                                parseInt(u['id']) != editingId,
                            orElse: () => null,
                          );
                      final isDisabled = assigned != null;
                      return DropdownMenuItem<int?>(
                        value: uid,
                        enabled: !isDisabled,
                        child: Text(
                          '${sysUser['name']} (${sysUser['email']})'
                          '${isDisabled ? ' [Assigned to ${assigned['name']}]' : ''}',
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: isDisabled ? Colors.grey : null,
                          ),
                        ),
                      );
                    }),
                  ],
                  onChanged: (v) {
                    setState(() {
                      _linkedUserId = v;
                      if (v != null && widget.existing == null) {
                        final chosen = widget.adminUsers.firstWhere(
                          (u) => parseInt(u['id']) == v,
                        );
                        if (_nameCtrl.text.isEmpty && chosen['name'] != null) {
                          _nameCtrl.text = chosen['name'].toString();
                        }
                        if (_emailCtrl.text.isEmpty && chosen['email'] != null) {
                          _emailCtrl.text = chosen['email'].toString();
                        }
                        if (_phoneCtrl.text.isEmpty && chosen['phone'] != null) {
                          _phoneCtrl.text = chosen['phone'].toString();
                        }
                      }
                    });
                  },
                ),
              ],
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save Umpire'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
