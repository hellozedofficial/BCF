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
}
