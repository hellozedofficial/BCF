import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../auth/presentation/profile_sheet.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _loading = true;
  bool _saving = false;
  bool _testing = false;
  String? _error;

  bool _enabled = false;
  final _keyIdCtrl = TextEditingController();
  final _appKeyCtrl = TextEditingController();
  final _regionCtrl = TextEditingController();
  final _bucketCtrl = TextEditingController();
  final _endpointCtrl = TextEditingController();
  final _cdnCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _keyIdCtrl.dispose();
    _appKeyCtrl.dispose();
    _regionCtrl.dispose();
    _bucketCtrl.dispose();
    _endpointCtrl.dispose();
    _cdnCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ref
          .read(apiClientProvider)
          .dio
          .get(ApiEndpoints.storageSettings);
      final data = res.data;
      final s = (data is Map && data['settings'] is Map)
          ? Map<String, dynamic>.from(data['settings'] as Map)
          : <String, dynamic>{};
      setState(() {
        _enabled = s['enabled'] == true;
        _keyIdCtrl.text = s['keyId']?.toString() ?? '';
        _appKeyCtrl.text = s['applicationKey']?.toString() ?? '';
        _regionCtrl.text = s['region']?.toString() ?? '';
        _bucketCtrl.text = s['bucket']?.toString() ?? '';
        _endpointCtrl.text = s['endpoint']?.toString() ?? '';
        _cdnCtrl.text = s['cdnUrl']?.toString() ?? '';
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Map<String, dynamic> _payload() => {
    'enabled': _enabled,
    'keyId': _keyIdCtrl.text.trim(),
    'applicationKey': _appKeyCtrl.text.trim(),
    'region': _regionCtrl.text.trim(),
    'bucket': _bucketCtrl.text.trim(),
    'endpoint': _endpointCtrl.text.trim(),
    'cdnUrl': _cdnCtrl.text.trim(),
  };

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .put(ApiEndpoints.storageSettings, data: _payload());
      if (mounted) showAppSnack(context, 'Storage configuration saved.');
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _testConnection() async {
    setState(() => _testing = true);
    try {
      final res = await ref
          .read(apiClientProvider)
          .dio
          .post(ApiEndpoints.storageTest, data: _payload());
      final msg = (res.data is Map ? res.data['message'] : null)?.toString() ??
          'Connection verified.';
      if (mounted) showAppSnack(context, msg);
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);

    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? ErrorStateView(message: _error!, onRetry: _load)
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Column(
                    children: [
                      SwitchListTile.adaptive(
                        secondary: Icon(
                          themeMode == ThemeMode.dark
                              ? Icons.dark_mode_rounded
                              : Icons.light_mode_rounded,
                        ),
                        title: const Text('Dark Mode Interface'),
                        value: themeMode == ThemeMode.dark,
                        onChanged: (_) =>
                            ref.read(themeProvider.notifier).toggle(),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.password_rounded),
                        title: const Text('Account & Password'),
                        subtitle: const Text('Manage profile or change password'),
                        trailing: const Icon(Icons.chevron_right_rounded),
                        onTap: () => showProfileSheet(context),
                      ),
                      const Divider(height: 1),
                      const ListTile(
                        leading: Icon(Icons.dns_outlined),
                        title: Text('API Endpoint'),
                        subtitle: Text(AppConfig.apiBaseUrl),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Cloud Object Storage (S3 / Backblaze B2)',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        SwitchListTile.adaptive(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Enable Cloud Storage Uploads'),
                          value: _enabled,
                          onChanged: (v) => setState(() => _enabled = v),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _keyIdCtrl,
                          decoration: const InputDecoration(labelText: 'Key ID'),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _appKeyCtrl,
                          obscureText: true,
                          decoration: const InputDecoration(labelText: 'Application Key'),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _regionCtrl,
                                decoration: const InputDecoration(labelText: 'Region'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                controller: _bucketCtrl,
                                decoration: const InputDecoration(labelText: 'Bucket'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _endpointCtrl,
                          decoration: const InputDecoration(labelText: 'S3 Endpoint URL'),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _cdnCtrl,
                          decoration: const InputDecoration(labelText: 'Public CDN URL'),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _testing ? null : _testConnection,
                                icon: const Icon(Icons.wifi_tethering_rounded, size: 18),
                                label: Text(_testing ? 'Testing...' : 'Test'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: _saving ? null : _save,
                                icon: const Icon(Icons.save_rounded, size: 18),
                                label: Text(_saving ? 'Saving...' : 'Save'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

