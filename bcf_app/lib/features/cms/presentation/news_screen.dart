import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import '../../auth/presentation/auth_provider.dart';

class NewsScreen extends ConsumerStatefulWidget {
  const NewsScreen({super.key});

  @override
  ConsumerState<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends ConsumerState<NewsScreen> {
  final _searchCtrl = TextEditingController();
  bool _loading = true;
  String? _error;
  String _typeFilter = 'All';
  List<Map<String, dynamic>> _items = [];

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
        ApiEndpoints.news,
        queryParameters: {
          'include_drafts': 'true',
          if (_typeFilter != 'All') 'type': _typeFilter,
          if (_searchCtrl.text.trim().isNotEmpty)
            'search': _searchCtrl.text.trim(),
        },
      );
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

  Future<void> _delete(Map<String, dynamic> item) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Delete Article',
      message: 'Delete "${item['title']}"?',
      confirmLabel: 'Delete',
      destructive: true,
    );
    if (!ok) return;
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .delete(ApiEndpoints.newsById(parseInt(item['id'])));
      if (mounted) {
        showAppSnack(context, 'Article deleted.');
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
      builder: (_) => _NewsFormSheet(existing: existing),
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
              hint: 'Search news & blogs...',
              onChanged: (_) => _load(),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              children: ['All', 'News', 'Blog'].map((t) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(t),
                    selected: _typeFilter == t,
                    onSelected: (_) {
                      setState(() => _typeFilter = t);
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
                : _items.isEmpty
                ? const EmptyStateView(
                    icon: Icons.article_outlined,
                    title: 'No News or Blogs',
                    subtitle: 'Publish federation press releases and stories.',
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 6, 16, 90),
                      itemCount: _items.length,
                      itemBuilder: (_, i) {
                        final item = _items[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: ListTile(
                            leading: AppAvatar(
                              url: item['image_url']?.toString(),
                              name: item['title']?.toString() ?? 'N',
                            ),
                            title: Text(
                              item['title']?.toString() ?? '',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                            subtitle: Text(
                              '${item['type'] ?? 'News'} • ${item['category'] ?? ''} • ${(item['publish_date']?.toString() ?? '').split('T').first}',
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                StatusBadge(label: item['status']?.toString() ?? 'Published'),
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 20),
                                  onPressed: () => _openForm(item),
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
        icon: const Icon(Icons.post_add_rounded),
        label: const Text('New Post'),
      ),
    );
  }
}

class _NewsFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? existing;
  const _NewsFormSheet({this.existing});

  @override
  ConsumerState<_NewsFormSheet> createState() => _NewsFormSheetState();
}

class _NewsFormSheetState extends ConsumerState<_NewsFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleCtrl;
  late final TextEditingController _categoryCtrl;
  late final TextEditingController _summaryCtrl;
  late final TextEditingController _contentCtrl;
  late final TextEditingController _videoUrlCtrl;
  late final TextEditingController _authorCtrl;
  String _type = 'News';
  String _status = 'Published';
  bool _pinned = false;
  String? _imageData;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _titleCtrl = TextEditingController(text: e?['title']?.toString() ?? '');
    _categoryCtrl = TextEditingController(text: e?['category']?.toString() ?? 'Announcement');
    _summaryCtrl = TextEditingController(text: e?['summary']?.toString() ?? '');
    _contentCtrl = TextEditingController(text: e?['content']?.toString() ?? '');
    _videoUrlCtrl = TextEditingController(text: e?['video_url']?.toString() ?? '');
    _authorCtrl = TextEditingController(text: e?['author']?.toString() ?? 'BCF Media Cell');
    _type = e?['type']?.toString() ?? 'News';
    _status = e?['status']?.toString() ?? 'Published';
    _pinned = parseInt(e?['is_pinned']) == 1 || e?['is_pinned'] == true;
    _imageData = e?['image_url']?.toString();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _categoryCtrl.dispose();
    _summaryCtrl.dispose();
    _contentCtrl.dispose();
    _videoUrlCtrl.dispose();
    _authorCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = {
      'title': _titleCtrl.text.trim(),
      'type': _type,
      'category': _categoryCtrl.text.trim(),
      'summary': _summaryCtrl.text.trim(),
      'content': _contentCtrl.text,
      'video_url': _videoUrlCtrl.text.trim(),
      'author': _authorCtrl.text.trim(),
      'status': _status,
      'is_pinned': _pinned,
      if (_imageData != null && _imageData!.startsWith('data:')) 'image': _imageData,
      if (_imageData != null && !_imageData!.startsWith('data:')) 'image_url': _imageData,
    };
    try {
      final dio = ref.read(apiClientProvider).dio;
      if (widget.existing == null) {
        await dio.post(ApiEndpoints.news, data: payload);
      } else {
        await dio.put(
          ApiEndpoints.newsById(parseInt(widget.existing!['id'])),
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
                widget.existing == null ? 'Publish Article' : 'Edit Article',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Base64ImagePickerField(
                label: 'Cover Image',
                value: _imageData,
                onChanged: (v) => setState(() => _imageData = v),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(labelText: 'Headline / Title'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Title required' : null,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: safeDropdownValue(_type, const ['News', 'Blog']),
                      decoration: const InputDecoration(labelText: 'Type'),
                      items: const [
                        DropdownMenuItem(value: 'News', child: Text('News')),
                        DropdownMenuItem(value: 'Blog', child: Text('Blog')),
                      ],
                      onChanged: (v) => setState(() => _type = v ?? 'News'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: safeDropdownValue(_status, const ['Published', 'Draft']),
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: const [
                        DropdownMenuItem(value: 'Published', child: Text('Published')),
                        DropdownMenuItem(value: 'Draft', child: Text('Draft')),
                      ],
                      onChanged: (v) => setState(() => _status = v ?? 'Published'),
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
                controller: _videoUrlCtrl,
                decoration: const InputDecoration(labelText: 'YouTube Video URL (Optional)'),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _summaryCtrl,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Summary'),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _contentCtrl,
                maxLines: 6,
                decoration: const InputDecoration(labelText: 'Article Content'),
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Pin to Featured'),
                value: _pinned,
                onChanged: (v) => setState(() => _pinned = v),
              ),
              const SizedBox(height: 10),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving...' : 'Save Post'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
