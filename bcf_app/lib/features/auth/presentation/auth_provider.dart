import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../data/auth_models.dart';

class AuthState {
  final bool initializing;
  final bool loading;
  final AdminUser? user;
  final String? error;

  const AuthState({
    this.initializing = true,
    this.loading = false,
    this.user,
    this.error,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    bool? initializing,
    bool? loading,
    AdminUser? user,
    bool clearUser = false,
    String? error,
    bool clearError = false,
  }) {
    return AuthState(
      initializing: initializing ?? this.initializing,
      loading: loading ?? this.loading,
      user: clearUser ? null : (user ?? this.user),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(
    storage: storage,
    onUnauthorized: () {
      ref.read(authProvider.notifier).forceSignedOut();
    },
  );
});

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    Future.microtask(restoreSession);
    return const AuthState(initializing: true);
  }

  Future<void> restoreSession() async {
    final storage = ref.read(secureStorageProvider);
    final token = await storage.getToken();
    if (token == null || token.isEmpty) {
      state = const AuthState(initializing: false);
      return;
    }

    final cachedUser = await storage.getUser();
    if (cachedUser != null) {
      state = AuthState(
        initializing: false,
        user: AdminUser.fromJson(cachedUser),
      );
    }

    try {
      final res = await ref.read(apiClientProvider).dio.get(ApiEndpoints.me);
      final data = res.data;
      if (data is Map<String, dynamic> &&
          data['success'] == true &&
          data['user'] is Map<String, dynamic>) {
        final userMap = data['user'] as Map<String, dynamic>;
        await storage.updateUser(userMap);
        state = AuthState(
          initializing: false,
          user: AdminUser.fromJson(userMap),
        );
      } else {
        await storage.clearSession();
        state = const AuthState(initializing: false);
      }
    } catch (_) {
      if (cachedUser == null) {
        await storage.clearSession();
        state = const AuthState(initializing: false);
      } else {
        state = state.copyWith(initializing: false);
      }
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final res = await ref.read(apiClientProvider).dio.post(
        ApiEndpoints.login,
        data: {'email': email.trim(), 'password': password},
      );
      final data = res.data;
      if (data is Map<String, dynamic> &&
          data['success'] == true &&
          data['token'] != null &&
          data['user'] is Map<String, dynamic>) {
        final token = data['token'].toString();
        final userMap = data['user'] as Map<String, dynamic>;
        await ref.read(secureStorageProvider).saveSession(
          token: token,
          userJson: userMap,
        );
        state = AuthState(
          initializing: false,
          loading: false,
          user: AdminUser.fromJson(userMap),
        );
        return true;
      }
      state = state.copyWith(
        loading: false,
        error: (data is Map ? data['message'] : null)?.toString() ??
            'Login failed.',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: ApiClient.extractErrorMessage(e, 'Unable to sign in.'),
      );
      return false;
    }
  }

  Future<String?> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final res = await ref.read(apiClientProvider).dio.put(
        ApiEndpoints.updatePassword,
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
      final data = res.data;
      if (data is Map<String, dynamic> && data['success'] == true) {
        return null;
      }
      return (data is Map ? data['message'] : null)?.toString() ??
          'Failed to update password.';
    } catch (e) {
      return ApiClient.extractErrorMessage(e, 'Failed to update password.');
    }
  }

  Future<void> logout() async {
    try {
      await ref.read(apiClientProvider).dio.post(ApiEndpoints.logout);
    } catch (_) {
      // Clear local session even if server unreachable
    }
    await ref.read(secureStorageProvider).clearSession();
    state = const AuthState(initializing: false);
  }

  void forceSignedOut() {
    if (state.user != null) {
      state = const AuthState(initializing: false);
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

class ThemeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    Future.microtask(_load);
    return ThemeMode.dark;
  }

  Future<void> _load() async {
    final isDark = await ref.read(secureStorageProvider).getThemeDark();
    state = isDark ? ThemeMode.dark : ThemeMode.light;
  }

  Future<void> toggle() async {
    final nextDark = state != ThemeMode.dark;
    state = nextDark ? ThemeMode.dark : ThemeMode.light;
    await ref.read(secureStorageProvider).saveThemeDark(nextDark);
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(
  ThemeNotifier.new,
);

