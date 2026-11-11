class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String login = '/auth/login';
  static const String me = '/auth/me';
  static const String logout = '/auth/logout';
  static const String updatePassword = '/auth/update-password';

  // Stats
  static const String stats = '/stats';

  // Tournaments
  static const String tournaments = '/tournaments';
  static String tournamentById(int id) => '/tournaments/$id';
  static String tournamentPublish(int id) => '/tournaments/$id/publish';
  static String tournamentBracket(int id) => '/tournaments/$id/bracket';
  static String tournamentGenerateFixtures(int id) =>
      '/tournaments/$id/generate-fixtures';
  static String tournamentParticipants(int id) =>
      '/tournaments/$id/participants';
  static String tournamentParticipant(int tournamentId, int playerId) =>
      '/tournaments/$tournamentId/participants/$playerId';
  static String tournamentGallery(int id) => '/tournaments/$id/gallery';
  static String tournamentMatchScore(int matchId) =>
      '/tournaments/matches/$matchId/score';

  // Matches
  static const String matches = '/matches';
  static String matchScore(int id) => '/matches/$id/score';
  static String matchDelete(int id) => '/matches/$id';
  static String matchEvents(int id) => '/matches/$id/events';
  static String matchUndoEvent(int id) => '/matches/$id/events/undo';
  static const String bulkAssignUmpire = '/matches/bulk-assign-umpire';

  // Players
  static const String players = '/players';
  static String playerById(dynamic id) => '/players/$id';

  // Umpires
  static const String umpires = '/umpires';
  static String umpireById(int id) => '/umpires/$id';

  // Clubs
  static const String clubs = '/clubs';
  static String clubById(int id) => '/clubs/$id';
  static String clubStatus(int id) => '/clubs/$id/status';

  // Registrations
  static const String playerRegister = '/player-register';
  static String playerRegisterById(int id) => '/player-register/$id';
  static String playerRegisterStatus(int id) => '/player-register/$id/status';
  static const String legacyRegistrations = '/registrations';
  static String legacyRegistrationStatus(int id) => '/registrations/$id/status';
  static String legacyRegistrationById(int id) => '/registrations/$id';

  // Geocode
  static const String divisions = '/geocode/divisions';
  static String districts(int divisionId) => '/geocode/districts/$divisionId';

  // CMS
  static const String banners = '/banners';
  static String bannerById(int id) => '/banners/$id';
  static const String announcements = '/announcements';
  static String announcementById(int id) => '/announcements/$id';
  static String announcementPublish(int id) => '/announcements/$id/publish';
  static const String news = '/news';
  static String newsById(int id) => '/news/$id';
  static const String newsUploadImage = '/news/upload-image';
  static const String committee = '/committee';
  static String committeeById(int id) => '/committee/$id';
  static const String committeeReorder = '/committee/reorder';
  static const String about = '/about';

  // System
  static const String users = '/users';
  static String userById(int id) => '/users/$id';
  static String userStatus(int id) => '/users/$id/status';
  static const String storageSettings = '/settings/storage';
  static const String storageTest = '/settings/storage/test';
}

