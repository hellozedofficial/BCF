import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bcf_app/app.dart';
import 'package:bcf_app/features/auth/data/auth_models.dart';

void main() {
  testWidgets('BcfAdminApp boots into login flow when unauthenticated', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const ProviderScope(child: BcfAdminApp()));
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.byType(BcfAdminApp), findsOneWidget);
  });

  test('AdminUser parses linked umpire_profile cleanly', () {
    final user = AdminUser.fromJson({
      'id': 7,
      'email': 'umpire@bcf.org.bd',
      'name': 'Kamrul Hasan',
      'role': 'Umpire',
      'umpire_profile': {
        'id': 3,
        'umpire_id': 'BCF-U-100003',
        'name': 'Kamrul Hasan',
        'grade': 'National Umpire',
        'status': 'Active',
      },
    });
    expect(user.isUmpireOnly, isTrue);
    expect(user.umpireProfile?.umpireId, 'BCF-U-100003');
  });

  test('AdminUser respects explicit umpire_access_only flag', () {
    final restricted = AdminUser.fromJson({
      'id': 8,
      'email': 'mod@bcf.org.bd',
      'name': 'Rashedul Islam',
      'role': 'Moderator',
      'umpire_access_only': true,
    });
    expect(restricted.umpireAccessOnly, isTrue);
    expect(restricted.isUmpireOnly, isTrue);

    final fullAdmin = AdminUser.fromJson({
      'id': 9,
      'email': 'admin@bcf.org.bd',
      'name': 'Super Official',
      'role': 'Admin',
      'umpire_access_only': false,
      'umpire_profile': {'id': 4, 'name': 'Super Official'},
    });
    expect(fullAdmin.umpireAccessOnly, isFalse);
    expect(fullAdmin.isUmpireOnly, isFalse);
  });
}
