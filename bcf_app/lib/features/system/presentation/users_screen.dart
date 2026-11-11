import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class UsersScreen extends ConsumerStatefulWidget {
  const UsersScreen({super.key});

  @override
  ConsumerState<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends ConsumerState<UsersScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _users = [];

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
      final res = await ref.read(apiClientProvider).dio.get(ApiEndpoints.users);
      setState(() {
        _users = extractDataList(res.data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _toggleStatus(Map<String, dynamic> u) async {
    final next = u['status'] == 'Active' ? 'Inactive' : 'Active';
    try {
      await ref.read(apiClientProvider).dio.patch(
        ApiEndpoints.userStatus(parseInt(u['id'])),
        data: {'status': next},
      );
      if (mounted) {
        showAppSnack(context, 'User status set to $next.');
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _delete(Map<String, dynamic> u) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Delete System User',
      message: 'Delete user "${u['name']}" (${u['email']})?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok) return;

    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.userById(parseInt(u['id'])));
      if (mounted) {
        showAppSnack(context, 'User deleted.');
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
      builder: (_) => _UserFormSheet(existing: existing),
    );
    if (saved == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? ErrorStateView(message: _error!, onRetry: _load)
          : _users.isEmpty
          ? const EmptyStateView(
              icon: Icons.manage_accounts_outlined,
              title: 'No System Users',
              subtitle: 'Create admin, moderator, or umpire accounts.',
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                itemCount: _users.length,
                itemBuilder: (_, i) {
                  final u = _users[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: ListTile(
                      leading: AppAvatar(
                        url: u['avatar_url']?.toString(),
                        name: u['name']?.toString() ?? 'U',
                      ),
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(
                              u['name']?.toString() ?? '',
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                          ),
                          StatusBadge(label: u['status']?.toString() ?? 'Active'),
                        ],
                      ),
                      subtitle: Text('${u['email'] ?? ''}\nRole: ${u['role'] ?? 'Admin'}'),
                      isThreeLine: true,
                      trailing: PopupMenuButton<String>(
                        onSelected: (v) {
                          if (v == 'edit') _openForm(u);
                          if (v == 'toggle') _toggleStatus(u);
                          if (v == 'delete') _delete(u);
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'edit', child: Text('Edit User')),
                          PopupMenuItem(value: 'toggle', child: Text('Toggle Active/Inactive')),
                          PopupMenuItem(value: 'delete', child: Text('Delete User')),
                        ],
                      ),
                      onTap: () => _openForm(u),
                    ),
                  );
                },
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        icon: const Icon(Icons.person_add_alt_1_rounded),
        label: const Text('Add User'),
      ),
    );
  }
}

class _UserFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existing;
  const _UserFormSheet({this.existing});

  @override
  ConsumerState<_UserFormSheet> createState() => _UserFormSheetState();
}

class _UserFormSheetState extends ConsumerState<_UserFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _desigCtrl;
  late final TextEditingController _passCtrl;
  String _role = 'Admin';
  String _status = 'Active';
  String? _avatarUrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _nameCtrl = TextEditingController(text: e?['name']?.toString() ?? '');
    _emailCtrl = TextEditingController(text: e?['email']?.toString() ?? '');
    _phoneCtrl = TextEditingController(text: e?['phone']?.toString() ?? '');
    _desigCtrl = TextEditingController(text: e?['designation']?.toString() ?? '');
    _passCtrl = TextEditingController();
    _role = e?['role']?.toString() ?? 'Admin';
    _status = e?['status']?.toString() ?? 'Active';
    _avatarUrl = e?['avatar_url']?.toString();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _desigCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = {
      'name': _nameCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      'designation': _desigCtrl.text.trim(),
      'role': _role,
      'status': _status,
      if (_passCtrl.text.isNotEmpty) 'password': _passCtrl.text,
      if (_avatarUrl != null) 'avatar_url': _avatarUrl,
    };

    try {
      final dio = ref.read(apiClientProvider).dio;
      if (widget.existing == null) {
        await dio.post(ApiEndpoints.users, data: payload);
      } else {
        await dio.put(
          ApiEndpoints.userById(parseInt(widget.existing!['id'])),
          data: payload,
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const roles = ['Super Admin', 'Admin', 'Moderator', 'Umpire', 'Editor'];
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
                widget.existing == null ? 'Create System User' : 'Edit User',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Base64ImagePickerField(
                label: 'Avatar',
                value: _avatarUrl,
                onChanged: (v) => setState(() => _avatarUrl = v),
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
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email Address'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Email required' : null,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: roles.contains(_role) ? _role : 'Admin',
                      decoration: const InputDecoration(labelText: 'Role'),
                      items: roles
                          .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                          .toList(),
                      onChanged: (v) => setState(() => _role = v ?? 'Admin'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _status,
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(value: 'Active', child: Text('Active')),
                        DropdownMenuItem(value: 'Inactive', child: Text('Inactive')),
                      ],
                      onChanged: (v) => setState(() => _status = v ?? 'Active'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _phoneCtrl,
                decoration: const InputDecoration(labelText: 'Phone'),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _desigCtrl,
                decoration: const InputDecoration(labelText: 'Designation'),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _passCtrl,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: widget.existing == null
                      ? 'Password'
                      : 'Reset Password (leave empty to keep)',
                ),
                validator: (v) {
                  if (widget.existing == null && (v == null || v.length < 6)) {
                    return 'At least 6 characters required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save User'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
