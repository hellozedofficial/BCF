import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/common_widgets.dart';
import 'auth_provider.dart';

Future<void> showProfileSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => const _ProfileSheetContent(),
  );
}

class _ProfileSheetContent extends ConsumerStatefulWidget {
  const _ProfileSheetContent();

  @override
  ConsumerState<_ProfileSheetContent> createState() =>
      _ProfileSheetContentState();
}

class _ProfileSheetContentState extends ConsumerState<_ProfileSheetContent> {
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  bool _updating = false;
  bool _showPasswordForm = false;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    if (_currentCtrl.text.isEmpty || _newCtrl.text.length < 6) {
      showAppSnack(
        context,
        'Enter current password and at least 6 chars for new password.',
        isError: true,
      );
      return;
    }
    setState(() => _updating = true);
    final err = await ref.read(authProvider.notifier).updatePassword(
      currentPassword: _currentCtrl.text,
      newPassword: _newCtrl.text,
    );
    if (!mounted) return;
    setState(() => _updating = false);
    if (err != null) {
      showAppSnack(context, err, isError: true);
    } else {
      _currentCtrl.clear();
      _newCtrl.clear();
      setState(() => _showPasswordForm = false);
      showAppSnack(context, 'Password updated successfully.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final themeMode = ref.watch(themeProvider);
    if (user == null) return const SizedBox.shrink();

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 18,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                AppAvatar(url: user.avatarUrl, name: user.name, size: 52),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.name,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        user.email,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 4),
                      StatusBadge(label: user.role, color: AppTheme.emerald),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(
                    themeMode == ThemeMode.dark
                        ? Icons.light_mode_rounded
                        : Icons.dark_mode_rounded,
                  ),
                  tooltip: 'Toggle Theme',
                  onPressed: () => ref.read(themeProvider.notifier).toggle(),
                ),
              ],
            ),
            if (user.umpireProfile != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.info.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.info.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.gavel_rounded,
                      color: AppTheme.info,
                      size: 22,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Linked Official Umpire',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.info,
                            ),
                          ),
                          Text(
                            '${user.umpireProfile!.name} (${user.umpireProfile!.umpireId ?? 'Umpire'})',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                    if (user.umpireProfile!.grade != null)
                      StatusBadge(
                        label: user.umpireProfile!.grade!,
                        color: AppTheme.info,
                      ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () =>
                  setState(() => _showPasswordForm = !_showPasswordForm),
              icon: const Icon(Icons.password_rounded, size: 18),
              label: Text(
                _showPasswordForm ? 'Hide Password Form' : 'Change Password',
              ),
            ),
            if (_showPasswordForm) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _currentCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Current Password',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _newCtrl,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'New Password'),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _updating ? null : _changePassword,
                child: Text(_updating ? 'Updating...' : 'Save New Password'),
              ),
            ],
            const SizedBox(height: 14),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.danger,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                Navigator.of(context).pop();
                await ref.read(authProvider.notifier).logout();
              },
              icon: const Icon(Icons.logout_rounded, size: 18),
              label: const Text('Sign Out'),
            ),
          ],
        ),
      ),
    );
  }
}

