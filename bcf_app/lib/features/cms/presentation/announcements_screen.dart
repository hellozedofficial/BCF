import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class AnnouncementsScreen extends ConsumerStatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  ConsumerState<AnnouncementsScreen> createState() =>
      _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends ConsumerState<AnnouncementsScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _items = [];

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
      final res =
          await ref.read(apiClientProvider).dio.get(ApiEndpoints.announcements);
      setState(() {
        _items = extractDataList(res.data);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = ApiClient.extractErrorMessage(e);
        _loading = false;
      });
    }
  }

  Future<void> _togglePublish(Map<String, dynamic> item, bool val) async {
    try {
      await ref.read(apiClientProvider).dio.patch(
        ApiEndpoints.announcementPublish(parseInt(item['id'])),
        data: {'is_published': val ? 1 : 0},
      );
      if (mounted) {
        showAppSnack(context, val ? 'Published.' : 'Unpublished.');
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Delete Announcement',
      message: 'Delete "${item['title'] ?? 'this announcement'}"?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok) return;
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.announcementById(parseInt(item['id'])));
      if (mounted) {
        showAppSnack(context, 'Deleted.');
        _load();
      }
    } catch (e) {
      if (mounted) showAppSnack(context, ApiClient.extractErrorMessage(e), isError: true);
    }
  }

  Future<void> _openForm([Map<String, dynamic>? existing]) async {
    final saved = await showAppModalSheet<bool>(
      context: context,
      builder: (_) => _AnnouncementFormSheet(existing: existing),
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
          : _items.isEmpty
          ? const EmptyStateView(
              icon: Icons.campaign_outlined,
              title: 'No Announcements',
              subtitle: 'Create popup notices for website visitors.',
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
                itemCount: _items.length,
                itemBuilder: (_, i) {
                  final item = _items[i];
                  final published = parseInt(item['is_published'], 0) == 1;
                  return SurfaceCard(
                    margin: const EdgeInsets.only(bottom: 10),
                    onTap: () => _openForm(item),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['title']?.toString() ?? '(Notice)',
                                style: const TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item['content']?.toString() ?? '',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        Switch.adaptive(
                          value: published,
                          onChanged: (v) => _togglePublish(item, v),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.delete_outline_rounded,
                            size: 20,
                            color: AppTheme.danger,
                          ),
                          onPressed: () => _delete(item),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        icon: const Icon(Icons.campaign_rounded),
        label: const Text('New Notice'),
      ),
    );
  }
}

class _AnnouncementFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existing;
  const _AnnouncementFormSheet({this.existing});

  @override
  ConsumerState<_AnnouncementFormSheet> createState() =>
      _AnnouncementFormSheetState();
}

class _AnnouncementFormSheetState
    extends ConsumerState<_AnnouncementFormSheet> {
  late final TextEditingController _titleCtrl;
  late final TextEditingController _contentCtrl;
  late final TextEditingController _linkCtrl;
  late final TextEditingController _btnCtrl;
  bool _published = true;
  String? _imageUrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _titleCtrl = TextEditingController(text: e?['title']?.toString() ?? '');
    _contentCtrl = TextEditingController(text: e?['content']?.toString() ?? '');
    _linkCtrl = TextEditingController(text: e?['link_url']?.toString() ?? '');
    _btnCtrl = TextEditingController(
      text: e?['button_text']?.toString() ?? 'Learn More',
    );
    _published = parseInt(e?['is_published'], 1) == 1;
    _imageUrl = e?['image_url']?.toString();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    _linkCtrl.dispose();
    _btnCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final payload = {
      'title': _titleCtrl.text.trim(),
      'content': _contentCtrl.text.trim(),
      'link_url': _linkCtrl.text.trim(),
      'button_text': _btnCtrl.text.trim(),
      'is_published': _published ? 1 : 0,
      'image_url': _imageUrl ?? '',
    };
    try {
      final dio = ref.read(apiClientProvider).dio;
      if (widget.existing == null) {
        await dio.post(ApiEndpoints.announcements, data: payload);
      } else {
        await dio.put(
          ApiEndpoints.announcementById(parseInt(widget.existing!['id'])),
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
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.existing == null
                  ? 'New Announcement'
                  : 'Edit Announcement',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            Base64ImagePickerField(
              label: 'Popup Image (Optional)',
              value: _imageUrl,
              onChanged: (v) => setState(() => _imageUrl = v),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _contentCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Notice Message'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _linkCtrl,
              decoration: const InputDecoration(labelText: 'Action Link URL'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _btnCtrl,
              decoration: const InputDecoration(labelText: 'Button Label'),
            ),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Published'),
              value: _published,
              onChanged: (v) => setState(() => _published = v),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Saving...' : 'Save Announcement'),
            ),
          ],
        ),
      ),
    );
  }
}

