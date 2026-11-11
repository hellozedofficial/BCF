import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _tokenKey = 'bcf_admin_jwt_token';
  static const _userKey = 'bcf_admin_user_json';
  static const _themeModeKey = 'bcf_admin_theme_mode';

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  String? _memoryToken;
  Map<String, dynamic>? _memoryUser;

  /// Sequential writes prevent WebCrypto AES key race conditions on Flutter Web.
  Future<void> saveSession({
    required String token,
    required Map<String, dynamic> userJson,
  }) async {
    _memoryToken = token;
    _memoryUser = Map<String, dynamic>.from(userJson);
    try {
      await _storage.write(key: _tokenKey, value: token);
      await _storage.write(key: _userKey, value: jsonEncode(userJson));
    } catch (_) {
      // If WebCrypto localStorage has a stale key, wipe and retry once sequentially.
      await _safeWipe();
      try {
        await _storage.write(key: _tokenKey, value: token);
        await _storage.write(key: _userKey, value: jsonEncode(userJson));
      } catch (_) {}
    }
  }

  Future<String?> getToken() async {
    if (_memoryToken != null && _memoryToken!.isNotEmpty) {
      return _memoryToken;
    }
    try {
      final token = await _storage.read(key: _tokenKey);
      _memoryToken = token;
      return token;
    } catch (_) {
      // Handles WebCrypto OperationError from corrupted/stale browser storage cleanly.
      await clearSession();
      return null;
    }
  }

  Future<Map<String, dynamic>?> getUser() async {
    if (_memoryUser != null) return _memoryUser;
    try {
      final raw = await _storage.read(key: _userKey);
      if (raw == null || raw.isEmpty) return null;
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) {
        _memoryUser = decoded;
        return decoded;
      }
      return null;
    } catch (_) {
      await clearSession();
      return null;
    }
  }

  Future<void> updateUser(Map<String, dynamic> userJson) async {
    _memoryUser = Map<String, dynamic>.from(userJson);
    try {
      await _storage.write(key: _userKey, value: jsonEncode(userJson));
    } catch (_) {}
  }

  Future<void> clearSession() async {
    _memoryToken = null;
    _memoryUser = null;
    await _safeWipe();
  }

  Future<void> _safeWipe() async {
    try {
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _userKey);
    } catch (_) {
      if (kIsWeb) {
        try {
          await _storage.deleteAll();
        } catch (_) {}
      }
    }
  }

  Future<void> saveThemeDark(bool isDark) async {
    try {
      await _storage.write(
        key: _themeModeKey,
        value: isDark ? 'dark' : 'light',
      );
    } catch (_) {}
  }

  Future<bool> getThemeDark() async {
    try {
      final val = await _storage.read(key: _themeModeKey);
      return val != 'light';
    } catch (_) {
      return true;
    }
  }
}
