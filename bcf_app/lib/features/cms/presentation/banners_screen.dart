import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class BannersScreen extends ConsumerStatefulWidget {
  const BannersScreen({super.key});

  @override
  ConsumerState<BannersScreen> createState() => _BannersScreenState();
}

class _BannersScreenState extends ConsumerState<BannersScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _banners = [];

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
      final res = await ref.read(apiClientProvider).dio.get(
        ApiEndpoints.banners,
        queryParameters: {'all': 'true'},
      );
      setState(() {
        _banners = extractDataList(res.data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _delete(Map<String, dynamic> b) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Delete Banner',
      message: 'Remove "${b['title']}"?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok) return;
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.bannerById(parseInt(b['id'])));
      if (mounted) {
        showAppSnack(context, 'Banner deleted.');
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
      builder: (_) => _BannerFormSheet(existing: existing),
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
          : _banners.isEmpty
          ? const EmptyStateView(
              icon: Icons.view_carousel_outlined,
              title: 'No Banners Yet',
              subtitle: 'Add homepage hero banners for bcf.org.bd.',
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                itemCount: _banners.length,
                itemBuilder: (_, i) {
                  final b = _banners[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if ((b['image_url']?.toString() ?? '').isNotEmpty)
                          SizedBox(
                            height: 140,
                            width: double.infinity,
                            child: CachedNetworkImage(
                              imageUrl: AppConfig.getMediaUrl(b['image_url']?.toString()),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ListTile(
                          title: Text(
                            b['title']?.toString() ?? '',
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                          subtitle: Text(
                            'Order #${b['order_num'] ?? 0} • ${b['subtitle'] ?? ''}',
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              StatusBadge(label: b['status']?.toString() ?? 'Active'),
                              IconButton(
                                icon: const Icon(Icons.edit_outlined, size: 20),
                                onPressed: () => _openForm(b),
                              ),
                              IconButton(
                                icon: const Icon(
                                  Icons.delete_outline_rounded,
                                  size: 20,
                                  color: AppTheme.danger,
                                ),
                                onPressed: () => _delete(b),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        icon: const Icon(Icons.add_photo_alternate_rounded),
        label: const Text('Add Banner'),
      ),
    );
  }
}

class _BannerFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existing;
  const _BannerFormSheet({this.existing});

  @override
  ConsumerState<_BannerFormSheet> createState() => _BannerFormSheetState();
}

class _BannerFormSheetState extends ConsumerState<_BannerFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleCtrl;
  late final TextEditingController _subtitleCtrl;
  late final TextEditingController _linkCtrl;
  late final TextEditingController _orderCtrl;
  String _status = 'Active';
  String? _imageUrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _titleCtrl = TextEditingController(text: e?['title']?.toString() ?? '');
    _subtitleCtrl = TextEditingController(text: e?['subtitle']?.toString() ?? '');
    _linkCtrl = TextEditingController(text: e?['link_url']?.toString() ?? '');
    _orderCtrl = TextEditingController(text: (e?['order_num'] ?? 0).toString());
    _status = e?['status']?.toString() ?? 'Active';
    _imageUrl = e?['image_url']?.toString();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _subtitleCtrl.dispose();
    _linkCtrl.dispose();
    _orderCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_imageUrl == null || _imageUrl!.trim().isEmpty) {
      showAppSnack(context, 'Banner image is required.', isError: true);
      return;
    }
    setState(() => _saving = true);
    final payload = {
      'title': _titleCtrl.text.trim(),
      'subtitle': _subtitleCtrl.text.trim(),
      'link_url': _linkCtrl.text.trim(),
      'order_num': int.tryParse(_orderCtrl.text) ?? 0,
      'status': _status,
      'image_url': _imageUrl,
    };

    try {
      final dio = ref.read(apiClientProvider).dio;
      if (widget.existing == null) {
        await dio.post(ApiEndpoints.banners, data: payload);
      } else {
        await dio.put(
          ApiEndpoints.bannerById(parseInt(widget.existing!['id'])),
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
                widget.existing == null ? 'Create Banner' : 'Edit Banner',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Base64ImagePickerField(
                label: 'Banner Image',
                value: _imageUrl,
                height: 150,
                onChanged: (v) => setState(() => _imageUrl = v),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Title required' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _subtitleCtrl,
                decoration: const InputDecoration(labelText: 'Subtitle'),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _linkCtrl,
                decoration: const InputDecoration(labelText: 'CTA Link URL'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _orderCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Order'),
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
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save Banner'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
