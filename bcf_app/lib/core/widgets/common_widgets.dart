import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../config/app_config.dart';
import '../theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color? color;

  const StatusBadge({super.key, required this.label, this.color});

  static Color resolveColor(String label) {
    final s = label.toLowerCase();
    if (s == 'active' ||
        s == 'approved' ||
        s == 'completed' ||
        s == 'published') {
      return AppTheme.emerald;
    }
    if (s == 'live' || s == 'ongoing' || s == 'in progress') {
      return AppTheme.danger;
    }
    if (s == 'pending' ||
        s == 'scheduled' ||
        s == 'upcoming' ||
        s == 'draft') {
      return AppTheme.warning;
    }
    if (s == 'inactive' || s == 'suspended' || s == 'rejected') {
      return AppTheme.danger;
    }
    return AppTheme.info;
  }

  @override
  Widget build(BuildContext context) {
    final tone = color ?? resolveColor(label);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: tone.withValues(alpha: 0.35)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: tone,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class AppAvatar extends StatelessWidget {
  final String? url;
  final String name;
  final double size;

  const AppAvatar({
    super.key,
    required this.url,
    required this.name,
    this.size = 42,
  });

  @override
  Widget build(BuildContext context) {
    final resolved = AppConfig.getMediaUrl(url);
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'B';

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: Theme.of(context).dividerColor.withValues(alpha: 0.25),
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: resolved.isNotEmpty
          ? CachedNetworkImage(
              imageUrl: resolved,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => Center(
                child: Text(
                  initial,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: size * 0.4,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
            )
          : Center(
              child: Text(
                initial,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: size * 0.4,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
    );
  }
}

class AppSearchBar extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onClear;

  const AppSearchBar({
    super.key,
    required this.controller,
    this.hint = 'Search...',
    this.onChanged,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.search_rounded, size: 20),
        suffixIcon: controller.text.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.close_rounded, size: 18),
                onPressed: () {
                  controller.clear();
                  onClear?.call();
                  onChanged?.call('');
                },
              )
            : null,
      ),
    );
  }
}

class EmptyStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? action;

  const EmptyStateView({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                icon,
                size: 36,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).textTheme.bodySmall?.color,
              ),
            ),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      ),
    );
  }
}

class ErrorStateView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const ErrorStateView({
    super.key,
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyStateView(
      icon: Icons.error_outline_rounded,
      title: 'Could not load data',
      subtitle: message,
      action: ElevatedButton.icon(
        onPressed: onRetry,
        icon: const Icon(Icons.refresh_rounded, size: 18),
        label: const Text('Retry'),
      ),
    );
  }
}

Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirm',
  bool destructive = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          style: destructive
              ? ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.danger,
                  foregroundColor: Colors.white,
                )
              : null,
          onPressed: () => Navigator.of(ctx).pop(true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result == true;
}

Future<String?> pickImageAsBase64DataUrl({
  ImageSource source = ImageSource.gallery,
  int imageQuality = 80,
  double maxWidth = 1400,
}) async {
  final picker = ImagePicker();
  final picked = await picker.pickImage(
    source: source,
    imageQuality: imageQuality,
    maxWidth: maxWidth,
  );
  if (picked == null) return null;
  final bytes = await picked.readAsBytes();
  final ext = picked.name.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
  return 'data:image/$ext;base64,${base64Encode(bytes)}';
}

class Base64ImagePickerField extends StatelessWidget {
  final String label;
  final String? value;
  final ValueChanged<String?> onChanged;
  final double height;

  const Base64ImagePickerField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.height = 120,
  });

  Widget _buildPreview(BuildContext context, String raw) {
    if (raw.startsWith('data:image/')) {
      try {
        final b64 = raw.split(',').last;
        return Image.memory(base64Decode(b64), fit: BoxFit.cover);
      } catch (_) {}
    }
    final resolved = AppConfig.getMediaUrl(raw);
    if (resolved.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: resolved,
        fit: BoxFit.cover,
        errorWidget: (_, _, _) => const Center(
          child: Icon(Icons.broken_image_rounded, size: 32),
        ),
      );
    }
    return const SizedBox.shrink();
  }

  @override
  Widget build(BuildContext context) {
    final hasImage = value != null && value!.trim().isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 6),
        Container(
          height: height,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: Theme.of(context).dividerColor.withValues(alpha: 0.3),
            ),
            color: Theme.of(context).colorScheme.surface,
          ),
          clipBehavior: Clip.antiAlias,
          child: hasImage
              ? Stack(
                  fit: StackFit.expand,
                  children: [
                    _buildPreview(context, value!),
                    Positioned(
                      top: 6,
                      right: 6,
                      child: Row(
                        children: [
                          IconButton.filled(
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.black87,
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.edit_rounded, size: 18),
                            onPressed: () async {
                              final img = await pickImageAsBase64DataUrl();
                              if (img != null) onChanged(img);
                            },
                          ),
                          const SizedBox(width: 4),
                          IconButton.filled(
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.black87,
                              foregroundColor: AppTheme.danger,
                            ),
                            icon: const Icon(Icons.delete_rounded, size: 18),
                            onPressed: () => onChanged(''),
                          ),
                        ],
                      ),
                    ),
                  ],
                )
              : InkWell(
                  onTap: () async {
                    final img = await pickImageAsBase64DataUrl();
                    if (img != null) onChanged(img);
                  },
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.add_photo_alternate_rounded,
                        size: 30,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Tap to upload image',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

void showAppSnack(
  BuildContext context,
  String message, {
  bool isError = false,
}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: isError ? AppTheme.danger : AppTheme.emeraldDark,
      behavior: SnackBarBehavior.floating,
    ),
  );
}

int parseInt(dynamic v, [int fallback = 0]) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(v?.toString() ?? '') ?? fallback;
}

List<Map<String, dynamic>> extractDataList(dynamic responseData) {
  if (responseData is Map<String, dynamic>) {
    final list = responseData['data'] ?? responseData['users'] ?? responseData['items'];
    if (list is List) {
      return list.whereType<Map<String, dynamic>>().toList();
    }
  } else if (responseData is List) {
    return responseData.whereType<Map<String, dynamic>>().toList();
  }
  return [];
}
