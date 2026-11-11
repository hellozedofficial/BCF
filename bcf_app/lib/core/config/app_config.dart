class AppConfig {
  AppConfig._();

  static const String appName = 'BCF Admin';
  static const String federationName = 'Bangladesh Carrom Federation';

  /// Override with `--dart-define=API_URL=http://localhost:5050/api` for local dev.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://bcf.org.bd/api',
  );

  /// Override with `--dart-define=SERVER_URL=http://localhost:5050` for local dev.
  static const String serverBaseUrl = String.fromEnvironment(
    'SERVER_URL',
    defaultValue: 'https://bcf.org.bd',
  );

  static String getMediaUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) return '';
    final url = rawUrl.trim();
    if (url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('data:')) {
      return url;
    }
    final cleanPath = url.startsWith('/') ? url : '/$url';
    return '$serverBaseUrl$cleanPath';
  }
}

