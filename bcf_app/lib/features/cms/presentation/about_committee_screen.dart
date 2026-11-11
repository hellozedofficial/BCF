import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class AboutCommitteeScreen extends ConsumerStatefulWidget {
  const AboutCommitteeScreen({super.key});

  @override
  ConsumerState<AboutCommitteeScreen> createState() =>
      _AboutCommitteeScreenState();
}

class _AboutCommitteeScreenState extends ConsumerState<AboutCommitteeScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _members = [];

  final _headlineCtrl = TextEditingController();
  final _missionCtrl = TextEditingController();
  final _visionCtrl = TextEditingController();
  final _historyCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _savingAbout = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _headlineCtrl.dispose();
    _missionCtrl.dispose();
    _visionCtrl.dispose();
    _historyCtrl.dispose();
    _addressCtrl.dispose();
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
        dio.get(ApiEndpoints.committee),
        dio.get(ApiEndpoints.about),
      ]);
      final aboutBody = results[1].data;
      final about = (aboutBody is Map && aboutBody['data'] is Map)
          ? Map<String, dynamic>.from(aboutBody['data'] as Map)
          : <String, dynamic>{};

      _headlineCtrl.text = about['headline']?.toString() ?? '';
      _missionCtrl.text = about['mission']?.toString() ?? '';
      _visionCtrl.text = about['vision']?.toString() ?? '';
      _historyCtrl.text = about['history_story']?.toString() ?? '';
      _addressCtrl.text = about['office_address']?.toString() ?? '';

      setState(() {
        _members = extractDataList(results[0].data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _saveAbout() async {
    setState(() => _savingAbout = true);
    try {
      await ref.read(apiClientProvider).dio.put(
        ApiEndpoints.about,
        data: {
          'headline': _headlineCtrl.text.trim(),
          'mission': _missionCtrl.text.trim(),
          'vision': _visionCtrl.text.trim(),
          'history_story': _historyCtrl.text.trim(),
          'office_address': _addressCtrl.text.trim(),
        },
      );
      if (mounted) showAppSnack(context, 'About information saved.');
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => _savingAbout = false);
    }
  }

  Future<void> _deleteMember(Map<String, dynamic> m) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Remove Committee Member',
      message: 'Remove "${m['name']}" from Executive Committee?',
      confirmLabel: 'Remove',
      destructive: true,
    );
    if (!ok) return;
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.committeeById(parseInt(m['id'])));
      if (mounted) {
        showAppSnack(context, 'Member removed.');
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _openMemberForm([Map<String, dynamic>? existing]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _CommitteeFormSheet(existing: existing),
    );
    if (saved == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: Column(
          children: [
            const TabBar(
              tabs: [
                Tab(text: 'Executive Committee'),
                Tab(text: 'About Federation'),
              ],
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                  ? ErrorStateView(message: _error!, onRetry: _load)
                  : TabBarView(
                      children: [
                        _members.isEmpty
                            ? const EmptyStateView(
                                icon: Icons.groups_outlined,
                                title: 'No Committee Members',
                                subtitle: 'Add BCF executive committee members.',
                              )
                            : RefreshIndicator(
                                onRefresh: _load,
                                child: ListView.builder(
                                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                                  itemCount: _members.length,
                                  itemBuilder: (_, i) {
                                    final m = _members[i];
                                    return Card(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      child: ListTile(
                                        leading: AppAvatar(
                                          url: m['image_url']?.toString(),
                                          name: m['name']?.toString() ?? 'M',
                                        ),
                                        title: Text(
                                          m['name']?.toString() ?? '',
                                          style: const TextStyle(fontWeight: FontWeight.w800),
                                        ),
                                        subtitle: Text(
                                          '${m['designation'] ?? ''} • ${m['group_name'] ?? ''}',
                                        ),
                                        trailing: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            IconButton(
                                              icon: const Icon(Icons.edit_outlined, size: 20),
                                              onPressed: () => _openMemberForm(m),
                                            ),
                                            IconButton(
                                              icon: const Icon(
                                                Icons.delete_outline_rounded,
                                                size: 20,
                                                color: AppTheme.danger,
                                              ),
                                              onPressed: () => _deleteMember(m),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                        ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            TextField(
                              controller: _headlineCtrl,
                              decoration: const InputDecoration(labelText: 'Headline'),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _missionCtrl,
                              maxLines: 3,
                              decoration: const InputDecoration(labelText: 'Mission'),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _visionCtrl,
                              maxLines: 3,
                              decoration: const InputDecoration(labelText: 'Vision'),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _historyCtrl,
                              maxLines: 4,
                              decoration: const InputDecoration(labelText: 'Federation History'),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _addressCtrl,
                              maxLines: 2,
                              decoration: const InputDecoration(labelText: 'Office Address'),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              onPressed: _savingAbout ? null : _saveAbout,
                              icon: const Icon(Icons.save_rounded),
                              label: Text(_savingAbout ? 'Saving...' : 'Save About Info'),
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _openMemberForm(),
          icon: const Icon(Icons.person_add_rounded),
          label: const Text('Add Member'),
        ),
      ),
    );
  }
}

class _CommitteeFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existing;
  const _CommitteeFormSheet({this.existing});

  @override
  ConsumerState<_CommitteeFormSheet> createState() =>
      _CommitteeFormSheetState();
}

class _CommitteeFormSheetState extends ConsumerState<_CommitteeFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _designationCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _orderCtrl;
  String _groupName = 'Executive Members';
  String? _imageUrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _nameCtrl = TextEditingController(text: e?['name']?.toString() ?? '');
    _designationCtrl = TextEditingController(text: e?['designation']?.toString() ?? '');
    _phoneCtrl = TextEditingController(text: e?['phone']?.toString() ?? '');
    _emailCtrl = TextEditingController(text: e?['contact_email']?.toString() ?? '');
    _orderCtrl = TextEditingController(text: (e?['display_order'] ?? 0).toString());
    _groupName = e?['group_name']?.toString() ?? 'Executive Members';
    _imageUrl = e?['image_url']?.toString();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _designationCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _orderCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = {
      'name': _nameCtrl.text.trim(),
      'designation': _designationCtrl.text.trim(),
      'group_name': _groupName,
      'phone': _phoneCtrl.text.trim(),
      'contact_email': _emailCtrl.text.trim(),
      'display_order': int.tryParse(_orderCtrl.text) ?? 0,
      if (_imageUrl != null) 'image_url': _imageUrl,
    };

    try {
      final dio = ref.read(apiClientProvider).dio;
      if (widget.existing == null) {
        await dio.post(ApiEndpoints.committee, data: payload);
      } else {
        await dio.put(
          ApiEndpoints.committeeById(parseInt(widget.existing!['id'])),
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
    const groups = [
      'President',
      'Vice Presidents',
      'General Secretary',
      'Joint Secretaries',
      'Treasurer',
      'Executive Members',
      'Advisors & Patrons',
    ];
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
                widget.existing == null ? 'Add Member' : 'Edit Member',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Base64ImagePickerField(
                label: 'Member Photo',
                value: _imageUrl,
                onChanged: (v) => setState(() => _imageUrl = v),
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
                controller: _designationCtrl,
                decoration: const InputDecoration(labelText: 'Designation'),
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'Designation required'
                    : null,
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: groups.contains(_groupName)
                    ? _groupName
                    : 'Executive Members',
                decoration: const InputDecoration(labelText: 'Committee Group'),
                items: groups
                    .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                    .toList(),
                onChanged: (v) =>
                    setState(() => _groupName = v ?? 'Executive Members'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _phoneCtrl,
                      decoration: const InputDecoration(labelText: 'Phone'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _orderCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Order'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _emailCtrl,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save Member'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
