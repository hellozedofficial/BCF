import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../config/app_config.dart';
import '../theme/app_theme.dart';

/// Opens a modal bottom sheet above every scaffold, app bar, and bottom navigation bar.
Future<T?> showAppModalSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool isScrollControlled = true,
  bool isDismissible = true,
  bool enableDrag = true,
  bool showCloseButton = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    useRootNavigator: true,
    useSafeArea: true,
    isScrollControlled: isScrollControlled,
    isDismissible: isDismissible,
    enableDrag: enableDrag,
    barrierColor: Colors.black.withValues(alpha: 0.72),
    builder: (sheetCtx) {
      final child = builder(sheetCtx);
      if (!showCloseButton) return child;
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 2),
            child: Row(
              children: [
                const SizedBox(width: 28),
                Expanded(
                  child: Center(
                    child: Container(
                      width: 38,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppTheme.borderStrong(sheetCtx),
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
                Material(
                  color: AppTheme.border(sheetCtx).withValues(alpha: 0.45),
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: () =>
                        Navigator.of(sheetCtx, rootNavigator: true).maybePop(),
                    child: const Tooltip(
                      message: 'Close',
                      child: SizedBox(
                        width: 28,
                        height: 28,
                        child: Icon(Icons.close_rounded, size: 16),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Flexible(child: child),
        ],
      );
    },
  );
}

class SurfaceCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final VoidCallback? onTap;
  final Color? accentColor;
  final Color? backgroundColor;
  final double radius;
  final bool selected;

  const SurfaceCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.margin = EdgeInsets.zero,
    this.onTap,
    this.accentColor,
    this.backgroundColor,
    this.radius = 16,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    final bg = backgroundColor ?? AppTheme.card(context);
    final borderColor = selected
        ? AppTheme.emerald.withValues(alpha: 0.7)
        : (accentColor != null
            ? accentColor!.withValues(alpha: 0.28)
            : AppTheme.border(context));

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: borderColor,
          width: selected ? 1.4 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: onTap != null
            ? InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(radius),
                child: Padding(padding: padding, child: child),
              )
            : Padding(padding: padding, child: child),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String? eyebrow;
  final Widget? trailing;

  const SectionHeader({
    super.key,
    required this.title,
    this.eyebrow,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 3.5,
          height: eyebrow != null ? 28 : 18,
          decoration: BoxDecoration(
            color: AppTheme.emerald,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (eyebrow != null)
                Text(
                  eyebrow!.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.1,
                    color: AppTheme.mutedText(context),
                  ),
                ),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

class FilterPillStrip extends StatelessWidget {
  final List<String> items;
  final String selected;
  final ValueChanged<String> onSelected;
  final String Function(String)? labelBuilder;
  final Color? activeColor;

  const FilterPillStrip({
    super.key,
    required this.items,
    required this.selected,
    required this.onSelected,
    this.labelBuilder,
    this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    final primary = activeColor ?? Theme.of(context).colorScheme.primary;
    final dark = AppTheme.isDark(context);

    return SizedBox(
      height: 38,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final item = items[i];
          final isSelected = item == selected;
          final label = labelBuilder?.call(item) ?? item;
          return GestureDetector(
            onTap: () => onSelected(item),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? primary
                    : (dark ? AppTheme.darkCard : Colors.white),
                borderRadius: BorderRadius.circular(100),
                border: Border.all(
                  color: isSelected ? primary : AppTheme.border(context),
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected
                      ? (dark ? const Color(0xFF022015) : Colors.white)
                      : AppTheme.mutedText(context),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String label;
  final Color? color;
  final bool showDot;

  const StatusBadge({
    super.key,
    required this.label,
    this.color,
    this.showDot = false,
  });

  static Color resolveColor(String label) {
    final s = label.toLowerCase();
    if (s == 'active' ||
        s == 'approved' ||
        s == 'completed' ||
        s == 'published' ||
        s == 'online') {
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
    final isLive =
        showDot ||
        label.toLowerCase() == 'live' ||
        label.toLowerCase() == 'ongoing' ||
        label.toLowerCase() == 'online';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: tone.withValues(alpha: 0.28)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isLive) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(color: tone, shape: BoxShape.circle),
            ),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(
              color: tone,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.1,
            ),
          ),
        ],
      ),
    );
  }
}

class MetaPill extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? color;

  const MetaPill({
    super.key,
    required this.icon,
    required this.text,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final tone = color ?? AppTheme.mutedText(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.cardElevated(context),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.border(context)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: tone),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: color ?? Theme.of(context).textTheme.bodyMedium?.color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SheetHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const SheetHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Center(
          child: Container(
            width: 38,
            height: 4,
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
              color: AppTheme.borderStrong(context),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.3,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null) trailing!,
            Material(
              color: AppTheme.border(context).withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(999),
              child: InkWell(
                borderRadius: BorderRadius.circular(999),
                onTap: () => Navigator.of(context, rootNavigator: true).maybePop(),
                child: const Tooltip(
                  message: 'Close',
                  child: Padding(
                    padding: EdgeInsets.all(6),
                    child: Icon(Icons.close_rounded, size: 17),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        const Divider(),
        const SizedBox(height: 14),
      ],
    );
  }
}

class DetailRowTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData? icon;

  const DetailRowTile({
    super.key,
    required this.label,
    required this.value,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.cardElevated(context),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border(context)),
      ),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: AppTheme.mutedText(context)),
            const SizedBox(width: 8),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 12.5,
              color: AppTheme.mutedText(context),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: AppTheme.tabular(
                const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
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
    this.size = 44,
  });

  @override
  Widget build(BuildContext context) {
    final resolved = AppConfig.getMediaUrl(url);
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'B';

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.emerald.withValues(alpha: 0.22),
            AppTheme.info.withValues(alpha: 0.14),
          ],
        ),
        borderRadius: BorderRadius.circular(size * 0.28),
        border: Border.all(
          color: AppTheme.emerald.withValues(alpha: 0.35),
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
                    fontWeight: FontWeight.w900,
                    fontSize: size * 0.4,
                    color: AppTheme.emeraldBright,
                  ),
                ),
              ),
            )
          : Center(
              child: Text(
                initial,
                style: TextStyle(
                  fontWeight: FontWeight.w900,
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
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        hintText: hint,
        fillColor: AppTheme.card(context),
        prefixIcon: Icon(
          Icons.search_rounded,
          size: 20,
          color: AppTheme.mutedText(context),
        ),
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: AppTheme.border(context)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: AppTheme.border(context)),
        ),
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
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: Theme.of(
                    context,
                  ).colorScheme.primary.withValues(alpha: 0.22),
                ),
              ),
              child: Icon(
                icon,
                size: 36,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (action != null) ...[const SizedBox(height: 18), action!],
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
    this.height = 128,
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
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderStrong(context)),
            color: AppTheme.cardElevated(context),
          ),
          clipBehavior: Clip.antiAlias,
          child: hasImage
              ? Stack(
                  fit: StackFit.expand,
                  children: [
                    _buildPreview(context, value!),
                    Positioned(
                      top: 8,
                      right: 8,
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
                          const SizedBox(width: 6),
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
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Theme.of(
                            context,
                          ).colorScheme.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.add_photo_alternate_rounded,
                          size: 26,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Tap to upload image',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
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
      content: Row(
        children: [
          Icon(
            isError ? Icons.error_outline_rounded : Icons.check_circle_rounded,
            color: Colors.white,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(message)),
        ],
      ),
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

T? safeDropdownValue<T>(T? value, Iterable<T> allowed) {
  if (value == null) return null;
  return allowed.contains(value) ? value : null;
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
